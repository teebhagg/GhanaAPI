import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import {
  ConversionResult,
  RateData,
  RateProvider,
} from './rate-provider.interface';

@Injectable()
export class FixerProvider implements RateProvider {
  name = 'fixer';

  async fetchRates(base: string, targets: string[]): Promise<RateData[]> {
    // Free plan uses EUR as base; compute GHS->target via ratios.
    const key = process.env.FIXER_API_KEY;
    if (!key) throw new Error('FIXER_API_KEY missing');

    const symbols = Array.from(new Set([...targets, 'GHS'])).join(',');
    const url = `http://data.fixer.io/api/latest?access_key=${key}&symbols=${symbols}`;
    const res = await axios.get(url);
    const data = res.data as {
      success: boolean;
      rates: Record<string, number>;
    };
    if (!data.success) throw new Error('Fixer request failed');

    const rates = data.rates;
    const eurToGhs = rates['GHS'];
    if (!eurToGhs) throw new Error('GHS rate missing in Fixer response');

    const now = new Date();
    return targets
      .filter((t) => rates[t] !== undefined)
      .map((t) => {
        const eurToTarget = rates[t];
        const ghsToTarget = eurToTarget / eurToGhs; // target per 1 GHS
        return {
          baseCurrency: base,
          targetCurrency: t,
          rate: ghsToTarget,
          provider: this.name,
          timestamp: now,
        } as RateData;
      });
  }

  async convertCurrency(body: ConvertCurrencyDto): Promise<ConversionResult> {
    const key = process.env.FIXER_API_KEY;
    if (!key) throw new Error('FIXER_API_KEY missing');

    const from = body.from.toUpperCase().trim();
    const to = body.to.toUpperCase().trim();
    const amount = Number(body.amount);
    if (!isFinite(amount)) throw new Error('Invalid amount');

    const symbols = `${from},${to}`;
    const url = `http://data.fixer.io/api/latest?access_key=${key}&symbols=${symbols}`;
    const res = await axios.get(url);
    const data = res.data as {
      success: boolean;
      rates: Record<string, number>;
    };
    if (!data.success) throw new Error('Fixer request failed');

    const eurToFrom = data.rates[from];
    const eurToTo = data.rates[to];
    if (!eurToFrom || !eurToTo)
      throw new Error('Rate missing for requested currency');

    const rate = eurToTo / eurToFrom; // to per 1 from
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
