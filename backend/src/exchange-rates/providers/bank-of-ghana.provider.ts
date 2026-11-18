import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import {
  ConversionResult,
  RateData,
  RateProvider,
} from './rate-provider.interface';

type BogQuote = { buy: number; sell: number };

// Fallback for the old 3-column table that has no "Currency Pair" column.
const QUOTED_PER_GHS = new Set(['NGN']);

/**
 * The Bank of Ghana quotes most currencies as GHS per 1 unit (pair "USDGHS")
 * but some as units per 1 GHS (pair "GHSNGN"). Return GHS per 1 unit for
 * either, so the rest of the provider uses one convention. Null when a value
 * is not a positive number.
 */
function ghsPerUnit(
  buy: number,
  sell: number,
  quotedPerGhs: boolean,
): BogQuote | null {
  if (!(buy > 0) || !(sell > 0)) return null;
  // Units per GHS: the bank pays the lower figure for GHS, so a customer
  // buying the foreign currency pays 1 / lower GHS per unit.
  return quotedPerGhs ? { buy: 1 / sell, sell: 1 / buy } : { buy, sell };
}

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
    if (/(^|[^A-Z])CHF([^A-Z]|$)|SWISS\s*FRANC/.test(L)) return 'CHF';
    if (/(^|[^A-Z])JPY([^A-Z]|$)|JAPANESE\s*YEN|YEN(?!\s*RENMINBI)/.test(L))
      return 'JPY';
    if (/(^|[^A-Z])CNY([^A-Z]|$)|CHINESE\s*YUAN|RENMINBI|RMB|YUAN|CN¥/.test(L))
      return 'CNY';
    return null;
  }

  /** Parse the Bank of Ghana table into GHS per 1 unit of each currency. */
  private parseRates(html: string): {
    rates: Map<string, BogQuote>;
    parsedRows: number;
    detectedDate?: string;
  } {
    const $ = cheerio.load(html);

    const rates = new Map<string, BogQuote>();
    let parsedRows = 0;
    let detectedDate: string | undefined;
    // Primary: 6-column table (date, currency, pair, buying, selling, mid)
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 6) {
        const date = $(cells[0]).text().trim();
        const currencyLabel = $(cells[1]).text().trim();
        // "USDGHS" is GHS per USD; "GHSNGN" is NGN per GHS
        const pair = $(cells[2])
          .text()
          .replace(/[^A-Za-z]/g, '')
          .toUpperCase();
        const buy = parseFloat($(cells[3]).text().trim().replace(/,/g, ''));
        const sell = parseFloat($(cells[4]).text().trim().replace(/,/g, ''));
        const code = this.normalizeCode(currencyLabel);
        const quote =
          code &&
          ghsPerUnit(buy, sell, pair.length === 6 && pair.startsWith('GHS'));
        if (code && quote) {
          rates.set(code, quote);
          parsedRows++;
          detectedDate = detectedDate || date;
        }
      }
    });
    // Fallback: 3-column table (currency, buying, selling), no pair column
    if (parsedRows === 0) {
      $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          const currencyLabel = $(cells[0]).text().trim();
          const buy = parseFloat($(cells[1]).text().trim().replace(/,/g, ''));
          const sell = parseFloat($(cells[2]).text().trim().replace(/,/g, ''));
          const code = this.normalizeCode(currencyLabel);
          const quote = code && ghsPerUnit(buy, sell, QUOTED_PER_GHS.has(code));
          if (code && quote) {
            rates.set(code, quote);
            parsedRows++;
          }
        }
      });
    }

    return { rates, parsedRows, detectedDate };
  }

  private async loadRates(
    refresh = false,
  ): Promise<Map<string, { buy: number; sell: number }>> {
    const now = Date.now();
    if (!refresh && this.cache && now - this.cache.ts < this.ttlMs) {
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

    const { rates, parsedRows, detectedDate } = this.parseRates(html);

    this.logger.log(
      `BoG parsed rows=${parsedRows}, date=${detectedDate ?? 'n/a'}, currencies=[${[...rates.keys()].join(', ')}]`,
    );

    this.cache = { ts: now, rates };
    return rates;
  }

  /**
   * Foreign units that 1 GHS buys. The bank sells foreign currency at SELL,
   * which is GHS per 1 unit, so the rate is 1 / SELL. fetchRates and
   * convertCurrency both use this, so they cannot disagree.
   */
  private foreignPerGhs(row: { sell: number }): number {
    return 1 / row.sell;
  }

  async fetchRates(
    base: string,
    targets: string[],
    options: { refresh?: boolean } = {},
  ): Promise<RateData[]> {
    if (base !== 'GHS') throw new Error('Base must be GHS for this provider');

    const rates = await this.loadRates(options.refresh);
    const now = new Date();
    const out: RateData[] = [];

    for (const t of targets) {
      const code = t.toUpperCase();
      const row = rates.get(code);
      if (!row) continue;
      out.push({
        baseCurrency: base,
        targetCurrency: code,
        rate: this.foreignPerGhs(row),
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
      // GHS -> foreign: the bank sells at SELL, see foreignPerGhs
      rate = this.foreignPerGhs(toRow); // to per 1 GHS
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

    // A zero or missing buy/sell value must not become Infinity or NaN
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`No usable rate for ${from} -> ${to}`);
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
