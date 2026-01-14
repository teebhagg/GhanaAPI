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
});
