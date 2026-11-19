import { ValidationPipe } from '@nestjs/common';
import { BankSearchQueryDto, NearbyBanksQueryDto } from './bank-search.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (metatype: new () => object, query: unknown) =>
  pipe.transform(query, { type: 'query', metatype });

const rejected = async (
  metatype: new () => object,
  query: unknown,
): Promise<string> => {
  try {
    await run(metatype, query);
  } catch (error) {
    const response = (
      error as { getResponse: () => { message: string[]; statusCode: number } }
    ).getResponse();
    expect(response.statusCode).toBe(400);
    return response.message.join(' ');
  }
  throw new Error('expected the query to be rejected');
};

describe('NearbyBanksQueryDto', () => {
  const ok = { lat: '5.6037', lng: '-0.187' };

  it('defaults the radius to 5 km and the limit to 10', async () => {
    await expect(run(NearbyBanksQueryDto, ok)).resolves.toMatchObject({
      lat: 5.6037,
      lng: -0.187,
      radius: 5,
      limit: 10,
    });
  });

  it('accepts the edges of the radius and limit ranges', async () => {
    await expect(
      run(NearbyBanksQueryDto, { ...ok, radius: '0.1', limit: '1' }),
    ).resolves.toMatchObject({ radius: 0.1, limit: 1 });
    await expect(
      run(NearbyBanksQueryDto, { ...ok, radius: '50', limit: '100' }),
    ).resolves.toMatchObject({ radius: 50, limit: 100 });
  });

  it.each(['-5', '0', '0.05', '51', '100000000', 'abc', '', ' ', 'Infinity'])(
    'rejects radius=%p',
    async (radius) => {
      await expect(
        rejected(NearbyBanksQueryDto, { ...ok, radius }),
      ).resolves.toMatch(/radius/);
    },
  );

  it.each(['0', '-1', '101', '2.5x', 'abc', ''])(
    'rejects limit=%p',
    async (limit) => {
      await expect(
        rejected(NearbyBanksQueryDto, { ...ok, limit }),
      ).resolves.toMatch(/limit/);
    },
  );

  it.each(['95', '-91', 'abc', ''])('rejects lat=%p', async (lat) => {
    await expect(
      rejected(NearbyBanksQueryDto, { ...ok, lat }),
    ).resolves.toMatch(/lat/);
  });

  it.each(['181', '-190', 'abc', ''])('rejects lng=%p', async (lng) => {
    await expect(
      rejected(NearbyBanksQueryDto, { ...ok, lng }),
    ).resolves.toMatch(/lng/);
  });

  it('rejects a missing coordinate', async () => {
    await expect(
      rejected(NearbyBanksQueryDto, { lat: '5.6' }),
    ).resolves.toMatch(/lng/);
  });
});

describe('BankSearchQueryDto coordinates', () => {
  it('accepts a search with no location', async () => {
    await expect(run(BankSearchQueryDto, { q: 'GCB' })).resolves.toMatchObject({
      q: 'GCB',
    });
  });

  it.each([
    ['lat', '95'],
    ['lat', ''],
    ['lng', '-190'],
    ['lng', ' '],
  ])('rejects %s=%p', async (key, value) => {
    await expect(
      rejected(BankSearchQueryDto, { q: 'GCB', [key]: value }),
    ).resolves.toMatch(new RegExp(key));
  });
});
