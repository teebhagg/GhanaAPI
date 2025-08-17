/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import {
  ConversionResult,
  RateData,
  RateProvider,
} from './rate-provider.interface';

@Injectable()
export class BankOfGhanaProvider implements RateProvider {
  name = 'bank-of-ghana';
  private readonly logger = new Logger(BankOfGhanaProvider.name);

  private cache:
    | {
        ts: number;
        rates: Map<string, { buy: number; sell: number }>;
      }
    | undefined;
  private readonly ttlMs = 30 * 60 * 1000; // 30 minutes

  private normalizeCode(label: string): string | null {
    const L = label.toUpperCase();
    if (/(^|[^A-Z])USD([^A-Z]|$)|US\s*DOLLAR/.test(L)) return 'USD';
    if (/(^|[^A-Z])EUR([^A-Z]|$)|EURO/.test(L)) return 'EUR';
    if (/(^|[^A-Z])GBP([^A-Z]|$)|POUND/.test(L)) return 'GBP';
    if (/(^|[^A-Z])NGN([^A-Z]|$)|NAIRA/.test(L)) return 'NGN';
    return null;
  }

  private async loadRates(): Promise<
    Map<string, { buy: number; sell: number }>
  > {
    const now = Date.now();
    if (this.cache && now - this.cache.ts < this.ttlMs) {
      return this.cache.rates;
    }

    // Site has two similar paths; try both
    const urls = [
      'https://www.bog.gov.gh/treasury-and-the-markets/daily-interbank-fx-rates/',
      'https://www.bog.gov.gh/treasury-and-markets/daily-interbank-fx-rates/',
    ];

    let html: string | undefined;
    let lastError: unknown;
    for (const url of urls) {
      try {
        const res = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; scraperscript/1.0)',
            'Accept-Language': 'en',
          },
          timeout: 20000,
        });
        html = res.data as string;
        this.logger.log(`Fetched BoG FX page OK from ${url}`);
        break;
      } catch (e: unknown) {
        lastError = e;
      }
    }

    if (!html)
      throw new Error((lastError as string) || 'Failed to fetch BoG page');

    const $ = cheerio.load(html);

    const rates = new Map<string, { buy: number; sell: number }>();
    let parsedRows = 0;
    let detectedDate: string | undefined;
    // Primary: 6-column table (date, currency, pair, buying, selling, mid)
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 6) {
        const date = $(cells[0]).text().trim();
        const currencyLabel = $(cells[1]).text().trim();
        const buyingStr = $(cells[3]).text().trim();
        const sellingStr = $(cells[4]).text().trim();
        const buy = parseFloat(buyingStr.replace(/,/g, ''));
        const sell = parseFloat(sellingStr.replace(/,/g, ''));
        const code = this.normalizeCode(currencyLabel);
        if (code && isFinite(buy) && isFinite(sell)) {
          rates.set(code, { buy, sell });
          parsedRows++;
          detectedDate = detectedDate || date;
        }
      }
    });
    // Fallback: 3-column table (currency, buying, selling)
    if (parsedRows === 0) {
      $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          const currencyLabel = $(cells[0]).text().trim();
          const buyingStr = $(cells[1]).text().trim();
          const sellingStr = $(cells[2]).text().trim();
          const buy = parseFloat(buyingStr.replace(/,/g, ''));
          const sell = parseFloat(sellingStr.replace(/,/g, ''));
          const code = this.normalizeCode(currencyLabel);
          if (code && isFinite(buy) && isFinite(sell)) {
            rates.set(code, { buy, sell });
            parsedRows++;
          }
        }
      });
    }

    this.logger.log(
      `BoG parsed rows=${parsedRows}, date=${detectedDate ?? 'n/a'}, currencies=[${[...rates.keys()].join(', ')}]`,
    );

    this.cache = { ts: now, rates };
    return rates;
  }

  async fetchRates(base: string, targets: string[]): Promise<RateData[]> {
    if (base !== 'GHS') throw new Error('Base must be GHS for this provider');

    const rates = await this.loadRates();
    const now = new Date();
    const out: RateData[] = [];

    for (const t of targets) {
      const code = t.toUpperCase();
      const row = rates.get(code);
      if (!row) continue;
      // GHS -> target uses SELL (GHS per 1 unit target)
      const ghsToTarget = 1 / row.sell;
      out.push({
        baseCurrency: base,
        targetCurrency: code,
        rate: ghsToTarget,
        provider: this.name,
        timestamp: now,
      });
    }

    return out;
  }

  async convertCurrency(body: ConvertCurrencyDto): Promise<ConversionResult> {
    const from = body.from.toUpperCase().trim();
    const to = body.to.toUpperCase().trim();
    const amount = Number(body.amount);
    if (!isFinite(amount)) {
      throw new Error('Invalid amount');
    }
    if (from === to) {
      return {
        from,
        to,
        amount,
        rate: 1,
        result: amount,
        provider: this.name,
        timestamp: new Date(),
      };
    }

    const rates = await this.loadRates();
    const getRow = (code: string) => rates.get(code); // { buy, sell }

    let rate: number;

    if (from === 'GHS') {
      const toRow = getRow(to);
      if (!toRow) throw new Error(`Unsupported currency: ${to}`);
      // GHS -> foreign: use SELL
      rate = 1 / toRow.sell; // to per 1 GHS
    } else if (to === 'GHS') {
      const fromRow = getRow(from);
      if (!fromRow) throw new Error(`Unsupported currency: ${from}`);
      // foreign -> GHS: use BUY
      rate = fromRow.buy; // GHS per 1 from
    } else {
      const fromRow = getRow(from);
      const toRow = getRow(to);
      if (!fromRow) throw new Error(`Unsupported currency: ${from}`);
      if (!toRow) throw new Error(`Unsupported currency: ${to}`);
      // foreign -> foreign: buy(from) then sell(to)
      rate = fromRow.buy / toRow.sell; // to per 1 from
    }

    const result = amount * rate;

    return {
      from,
      to,
      amount,
      rate,
      result,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
