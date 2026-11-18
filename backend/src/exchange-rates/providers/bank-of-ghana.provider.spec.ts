/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BankOfGhanaProvider } from './bank-of-ghana.provider';

describe('BankOfGhanaProvider', () => {
  let provider: BankOfGhanaProvider;

  beforeEach(() => {
    provider = new BankOfGhanaProvider();
  });

  it('should calculate GHS to NGN rate using the inverse of the sell price', async () => {
    jest
      .spyOn(provider as any, 'loadRates')
      .mockResolvedValue(new Map([['NGN', { buy: 0.075, sell: 0.08 }]]) as any);

    const rates = await provider.fetchRates('GHS', ['NGN']);

    expect(rates).toHaveLength(1);
    expect(rates[0]).toMatchObject({
      baseCurrency: 'GHS',
      targetCurrency: 'NGN',
      provider: 'bank-of-ghana',
    });
    expect(rates[0].rate).toBeCloseTo(12.5, 5);
  });

  it('should bypass its own cache when a refresh is requested', async () => {
    const load = jest
      .spyOn(provider as any, 'loadRates')
      .mockResolvedValue(new Map([['NGN', { buy: 0.075, sell: 0.08 }]]) as any);

    await provider.fetchRates('GHS', ['NGN'], { refresh: true });
    await provider.fetchRates('GHS', ['NGN']);

    expect(load).toHaveBeenNthCalledWith(1, true);
    expect(load).toHaveBeenNthCalledWith(2, undefined);
  });

  it('should map new currency labels to ISO codes', () => {
    const normalize = (label: string) =>
      (provider as any).normalizeCode(label) as string | null;

    expect(normalize('Swiss Franc')).toBe('CHF');
    expect(normalize('Japanese Yen')).toBe('JPY');
    expect(normalize('Chinese Yuan')).toBe('CNY');
    expect(normalize('Renminbi ¥')).toBe('CNY');
    expect(normalize('US Dollar')).toBe('USD');
    expect(normalize('Euro')).toBe('EUR');
    expect(normalize('British Pound')).toBe('GBP');
    expect(normalize('Nigerian Naira')).toBe('NGN');
  });

  describe('convertCurrency', () => {
    // GHS per 1 unit of foreign currency, as the Bank of Ghana publishes them
    const rows = new Map([
      ['USD', { buy: 11.7, sell: 11.76 }],
      ['EUR', { buy: 12.9, sell: 12.94 }],
      ['GBP', { buy: 15.5, sell: 15.6 }],
      ['NGN', { buy: 0.0075, sell: 0.0086 }],
    ]);
    const convert = (from: string, to: string, amount = 100) =>
      provider.convertCurrency({ from, to, amount });

    beforeEach(() => {
      jest.spyOn(provider as any, 'loadRates').mockResolvedValue(rows as any);
    });

    it('should convert GHS into a foreign currency by dividing by the sell rate', async () => {
      const result = await convert('GHS', 'USD');

      expect(result.rate).toBeCloseTo(1 / 11.76, 8);
      expect(result.result).toBeCloseTo(100 / 11.76, 6); // about 8.50, not 1176
    });

    it('should convert GHS into GBP by dividing by the sell rate', async () => {
      const result = await convert('GHS', 'GBP');

      expect(result.rate).toBeCloseTo(1 / 15.6, 8);
      expect(result.result).toBeCloseTo(100 / 15.6, 6);
    });

    it('should give less than 100 of a stronger currency for 100 GHS', async () => {
      for (const to of ['USD', 'EUR', 'GBP']) {
        expect((await convert('GHS', to)).result).toBeLessThan(100);
      }
    });

    it('should give more than 100 NGN for 100 GHS', async () => {
      const result = await convert('GHS', 'NGN');

      expect(result.result).toBeCloseTo(100 / 0.0086, 2);
      expect(result.result).toBeGreaterThan(100);
    });

    it('should convert foreign currency into GHS by multiplying by the buy rate', async () => {
      const result = await convert('USD', 'GHS');

      expect(result.rate).toBeCloseTo(11.7, 8);
      expect(result.result).toBeCloseTo(1170, 6);
    });

    it('should convert a weaker currency into GHS', async () => {
      const result = await convert('NGN', 'GHS');

      expect(result.rate).toBeCloseTo(0.0075, 8);
      expect(result.result).toBeLessThan(100);
    });

    it('should convert between two foreign currencies through buy and sell', async () => {
      const result = await convert('USD', 'EUR');

      expect(result.rate).toBeCloseTo(11.7 / 12.94, 8);
    });

    it('should lose only the bank spread on a round trip through GHS', async () => {
      for (const code of ['USD', 'EUR', 'GBP', 'NGN']) {
        const out = await convert('GHS', code, 1000);
        const back = await convert(code, 'GHS', out.result);

        expect(back.result).toBeLessThanOrEqual(1000);
        expect(back.result).toBeGreaterThan(1000 * 0.8);
      }
    });

    it('should return the amount unchanged for the same currency', async () => {
      expect(await convert('GHS', 'GHS', 10)).toMatchObject({
        rate: 1,
        result: 10,
      });
    });

    it('should reject a currency it has no rate for, in either direction', async () => {
      await expect(convert('GHS', 'XXX')).rejects.toThrow(/Unsupported/);
      await expect(convert('XXX', 'GHS')).rejects.toThrow(/Unsupported/);
    });

    it('should reject a zero rate instead of returning Infinity or NaN', async () => {
      jest.spyOn(provider as any, 'loadRates').mockResolvedValue(
        new Map([
          ['USD', { buy: 11.7, sell: 0 }], // zero sell
          ['EUR', { buy: 12.9, sell: 12.94 }],
          ['GBP', { buy: 0, sell: 15.6 }], // zero buy
        ]) as any,
      );

      // GHS -> foreign divides by sell
      await expect(convert('GHS', 'USD')).rejects.toThrow(/No usable rate/);
      // foreign -> foreign divides by the target's sell
      await expect(convert('EUR', 'USD')).rejects.toThrow(/No usable rate/);
      // foreign -> GHS multiplies by buy
      await expect(convert('GBP', 'GHS')).rejects.toThrow(/No usable rate/);
    });

    it('should use the same GHS to foreign rate in fetchRates and convertCurrency', async () => {
      const [fetched] = await provider.fetchRates('GHS', ['USD']);
      const converted = await convert('GHS', 'USD', 1);

      expect(converted.rate).toBe(fetched.rate);
    });
  });

  describe('quote direction (Currency Pair column)', () => {
    // Rows as published by the Bank of Ghana on 18 Nov 2026. "USDGHS" is GHS
    // per USD. "GHSNGN" is NGN per GHS: the naira is quoted the other way.
    const row = (name: string, pair: string, buy: string, sell: string) =>
      `<tr><td>18 Nov 2026</td><td>${name}</td><td>${pair}</td><td>${buy}</td><td>${sell}</td><td>0</td></tr>`;
    const html = (rows: string[]) =>
      `<table><tbody>${rows.join('')}</tbody></table>`;
    const live = html([
      row('US Dollar', 'USDGHS', '11.7741', '11.7859'),
      row('Euro', 'EURGHS', '12.9236', '12.9365'),
      row('Japanese yen', 'JPYGHS', '0.0739', '0.0740'),
      row('Naira', 'GHSNGN', '116.5993', '117.0382'),
      row('Dalasi', 'GHSGMD', '6.2488', '6.2689'), // not a supported currency
    ]);
    type Quote = { buy: number; sell: number };
    type Parsed = {
      rates: Map<string, Quote>;
      parsedRows: number;
      detectedDate?: string;
    };
    const parse = (source: string) =>
      (provider as any).parseRates(source) as Parsed;

    it('should keep GHS per unit quotes as published', () => {
      const { rates } = parse(live);

      expect(rates.get('USD')).toEqual({ buy: 11.7741, sell: 11.7859 });
      expect(rates.get('JPY')).toEqual({ buy: 0.0739, sell: 0.074 });
    });

    it('should turn a units per GHS quote into GHS per unit', () => {
      const { rates, parsedRows, detectedDate } = parse(live);
      const ngn = rates.get('NGN') as Quote;

      expect(ngn.buy).toBeCloseTo(1 / 117.0382, 10);
      expect(ngn.sell).toBeCloseTo(1 / 116.5993, 10);
      expect(ngn.buy).toBeLessThan(ngn.sell); // the bank still earns the spread
      expect(rates.has('GMD')).toBe(false);
      expect(parsedRows).toBe(4);
      expect(detectedDate).toBe('18 Nov 2026');
    });

    it('should skip a row whose buy or sell is not a positive number', () => {
      const { rates } = parse(
        html([
          row('US Dollar', 'USDGHS', '0.0000', '11.7859'),
          row('Naira', 'GHSNGN', '116.5993', '0.0000'),
          row('Euro', 'EURGHS', '12.9236', '12.9365'),
        ]),
      );

      expect([...rates.keys()]).toEqual(['EUR']);
    });

    it('should treat the naira as units per GHS in the old 3-column table', () => {
      const { rates } = parse(
        `<table><tbody>
          <tr><td>US Dollar</td><td>11.7741</td><td>11.7859</td></tr>
          <tr><td>Naira</td><td>116.5993</td><td>117.0382</td></tr>
        </tbody></table>`,
      );

      expect(rates.get('USD')).toEqual({ buy: 11.7741, sell: 11.7859 });
      expect(rates.get('NGN')?.sell).toBeCloseTo(1 / 116.5993, 10);
    });

    describe('with the real table', () => {
      beforeEach(() => {
        const { rates } = parse(live);
        jest.spyOn(provider as any, 'loadRates').mockResolvedValue(rates);
      });

      it('should convert 100 GHS into about 11,660 NGN', async () => {
        const result = await provider.convertCurrency({
          from: 'GHS',
          to: 'NGN',
          amount: 100,
        });

        expect(result.result).toBeCloseTo(11659.93, 1);
      });

      it('should convert 100 NGN into under 1 GHS', async () => {
        const result = await provider.convertCurrency({
          from: 'NGN',
          to: 'GHS',
          amount: 100,
        });

        expect(result.result).toBeCloseTo(100 / 117.0382, 6); // about 0.854
      });

      it('should convert USD into NGN at about 1,370 NGN per USD', async () => {
        const result = await provider.convertCurrency({
          from: 'USD',
          to: 'NGN',
          amount: 1,
        });

        expect(result.result).toBeCloseTo(11.7741 * 116.5993, 2);
        expect(result.result).toBeGreaterThan(1000);
        expect(result.result).toBeLessThan(2000);
      });

      it('should publish the GHS to NGN rate as naira per cedi', async () => {
        const [ngn] = await provider.fetchRates('GHS', ['NGN']);

        expect(ngn.rate).toBeCloseTo(116.5993, 4); // not 0.0086
      });

      it('should still convert GHS into USD by dividing', async () => {
        const result = await provider.convertCurrency({
          from: 'GHS',
          to: 'USD',
          amount: 100,
        });

        expect(result.result).toBeCloseTo(100 / 11.7859, 6);
      });
    });
  });
});
