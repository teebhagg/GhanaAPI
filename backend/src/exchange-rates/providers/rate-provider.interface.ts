import { ConvertCurrencyDto } from '../dto/convert-currency.dto';

export type RateData = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  provider: string;
  timestamp?: Date;
};

export type ConversionResult = {
  from: string;
  to: string;
  amount: number;
  rate: number; // to per 1 from
  result: number; // amount * rate
  provider: string;
  timestamp: Date;
};

export interface RateProvider {
  name: string;
  fetchRates(base: string, targets: string[]): Promise<RateData[]>;
  convertCurrency?(body: ConvertCurrencyDto): Promise<ConversionResult>;
}

export type FallbackResult = {
  success: boolean;
  message: string;
  data: unknown[];
};
