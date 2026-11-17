import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HistoricalQueryDto } from './historical-query.dto';

const check = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(HistoricalQueryDto, input, {
    enableImplicitConversion: true,
  });
  return { dto, errors: await validate(dto) };
};

describe('HistoricalQueryDto', () => {
  const valid = { from: '2026-01-01', to: '2026-02-01', currency: 'usd' };

  it('accepts a minimal query and upper-cases the currency', async () => {
    const { dto, errors } = await check(valid);

    expect(errors).toHaveLength(0);
    expect(dto.currency).toBe('USD');
  });

  it.each([
    ['an unsupported currency', { currency: 'XXX' }],
    ['a bad date', { from: 'yesterday' }],
    ['an impossible from date', { from: '2026-02-30' }],
    ['an impossible to date', { to: '2026-04-31' }],
    ['a leap day in a non-leap year', { from: '2026-02-29' }],
    ['an unknown granularity', { granularity: 'hourly' }],
    ['a limit above 1000', { limit: 5000 }],
    ['a limit of 0', { limit: 0 }],
  ])('rejects %s', async (_name, override) => {
    const { errors } = await check({ ...valid, ...override });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a valid leap day', async () => {
    const { errors } = await check({ ...valid, from: '2024-02-29' });

    expect(errors).toHaveLength(0);
  });

  it('accepts granularity and limit within bounds', async () => {
    const { errors } = await check({
      ...valid,
      granularity: 'raw',
      limit: '100',
    });

    expect(errors).toHaveLength(0);
  });
});
