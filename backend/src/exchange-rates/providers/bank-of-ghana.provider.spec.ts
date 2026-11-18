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
      ['NGN', { buy: 0.0075, sell: 0.0086 }],
    ]);
    const convert = (from: string, to: string, amount = 100) =>
      provider.convertCurrency({ from, to, amount });

    beforeEach(() => {
      jest.spyOn(provider as any, 'loadRates').mockResolvedValue(rows as any);
    });

    it('converts GHS into a foreign currency by dividing by the sell rate', async () => {
      const r = await convert('GHS', 'USD');

      expect(r.rate).toBeCloseTo(1 / 11.76, 8);
      expect(r.result).toBeCloseTo(100 / 11.76, 6); // about 8.50, not 1176
    });

    it('100 GHS is worth less than 100 of a stronger currency', async () => {
      for (const to of ['USD', 'EUR']) {
        expect((await convert('GHS', to)).result).toBeLessThan(100);
      }
    });

    it('converts a weaker currency into GHS and back to a larger number', async () => {
      const ngn = await convert('GHS', 'NGN');
      expect(ngn.result).toBeCloseTo(100 / 0.0086, 2);
      expect(ngn.result).toBeGreaterThan(100);
    });

    it('converts foreign currency into GHS by multiplying by the buy rate', async () => {
      const r = await convert('USD', 'GHS');

      expect(r.rate).toBeCloseTo(11.7, 8);
      expect(r.result).toBeCloseTo(1170, 6);
    });

    it('converts between two foreign currencies through buy and sell', async () => {
      const r = await convert('USD', 'EUR');

      expect(r.rate).toBeCloseTo(11.7 / 12.94, 8);
    });

    it('a round trip through GHS only loses the bank spread', async () => {
      for (const code of ['USD', 'EUR', 'NGN']) {
        const out = await convert('GHS', code, 1000);
        const back = await convert(code, 'GHS', out.result);

        expect(back.result).toBeLessThanOrEqual(1000);
        expect(back.result).toBeGreaterThan(1000 * 0.8);
      }
    });

    it('returns the amount unchanged for the same currency', async () => {
      expect(await convert('GHS', 'GHS', 10)).toMatchObject({
        rate: 1,
        result: 10,
      });
    });

    it('rejects a currency it has no rate for, in either direction', async () => {
      await expect(convert('GHS', 'XXX')).rejects.toThrow(/Unsupported/);
      await expect(convert('XXX', 'GHS')).rejects.toThrow(/Unsupported/);
    });

    it('rejects a zero sell rate instead of returning Infinity', async () => {
      jest
        .spyOn(provider as any, 'loadRates')
        .mockResolvedValue(new Map([['USD', { buy: 11.7, sell: 0 }]]) as any);

      await expect(convert('GHS', 'USD')).rejects.toThrow(/No usable rate/);
      await expect(convert('EUR', 'USD')).rejects.toThrow();
    });
  });
});
