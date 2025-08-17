import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import {
  ConversionResult,
  RateData,
  RateProvider,
} from './rate-provider.interface';

@Injectable()
export class ExchangeRateApiProvider implements RateProvider {
  name = 'exchangerate-api';

  async fetchRates(base: string, targets: string[]): Promise<RateData[]> {
    if (base !== 'GHS') throw new Error('Base must be GHS for this provider');
    const key = process.env.EXCHANGERATE_API_KEY;
    if (!key) throw new Error('EXCHANGERATE_API_KEY missing');

    const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`;
    const res = await axios.get(url);
    const data = res.data as {
      conversion_rates: Record<string, number>;
    };
    const rates = data.conversion_rates || {};
    const now = new Date();

    return targets
      .filter((t) => rates[t] !== undefined)
      .map((t) => ({
        baseCurrency: base,
        targetCurrency: t,
        rate: rates[t],
        provider: this.name,
        timestamp: now,
      }));
  }

  async convertCurrency(body: ConvertCurrencyDto): Promise<ConversionResult> {
    const key = process.env.EXCHANGERATE_API_KEY;
    if (!key) throw new Error('EXCHANGERATE_API_KEY missing');

    const from = body.from.toUpperCase().trim();
    const to = body.to.toUpperCase().trim();
    const amount = Number(body.amount);
    if (!isFinite(amount)) throw new Error('Invalid amount');

    const url = `https://v6.exchangerate-api.com/v6/${key}/pair/${from}/${to}/${amount}`;
    const res = await axios.get(url);
    const data = res.data as {
      conversion_rate: number;
      conversion_result: number;
      time_last_update_unix?: number;
    };

    const rate = Number(data.conversion_rate);
    const result = Number(data.conversion_result);
    const timestamp = data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000)
      : new Date();

    return {
      from,
      to,
      amount,
      rate,
      result,
      provider: this.name,
      timestamp,
    };
  }
}
