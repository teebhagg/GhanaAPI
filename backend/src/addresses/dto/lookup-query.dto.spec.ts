import { ValidationPipe } from '@nestjs/common';
import { LookupQueryDto } from './lookup-query.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (query: unknown) =>
  pipe.transform(query, { type: 'query', metatype: LookupQueryDto });

const rejected = async (query: unknown): Promise<string> => {
  try {
    await run(query);
  } catch (error) {
    const response = (
      error as { getResponse: () => { message: string[]; statusCode: number } }
    ).getResponse();
    expect(response.statusCode).toBe(400);
    return response.message.join(' ');
  }
  throw new Error('expected the query to be rejected');
};

describe('LookupQueryDto', () => {
  it('accepts coordinates in Ghana', async () => {
    await expect(run({ lat: '5.6037', lng: '-0.187' })).resolves.toMatchObject({
      lat: 5.6037,
      lng: -0.187,
    });
  });

  it('accepts the edges of the valid range and 0,0', async () => {
    await expect(run({ lat: '90', lng: '180' })).resolves.toMatchObject({
      lat: 90,
      lng: 180,
    });
    await expect(run({ lat: '-90', lng: '-180' })).resolves.toMatchObject({
      lat: -90,
      lng: -180,
    });
    await expect(run({ lat: '0', lng: '0' })).resolves.toMatchObject({
      lat: 0,
      lng: 0,
    });
  });

  it.each(['90.0001', '95', '-91', '1000'])('rejects lat=%p', async (lat) => {
    await expect(rejected({ lat, lng: '0' })).resolves.toMatch(/lat/);
  });

  it.each(['180.5', '-190', '999'])('rejects lng=%p', async (lng) => {
    await expect(rejected({ lat: '0', lng })).resolves.toMatch(/lng/);
  });

  it.each(['abc', '', ' ', 'Infinity', 'NaN'])(
    'rejects lat=%p and lng=%p as not numbers',
    async (value) => {
      await expect(rejected({ lat: value, lng: '0' })).resolves.toMatch(/lat/);
      await expect(rejected({ lat: '0', lng: value })).resolves.toMatch(/lng/);
    },
  );

  it('rejects a missing coordinate', async () => {
    await expect(rejected({ lat: '5.6' })).resolves.toMatch(/lng/);
    await expect(rejected({ lng: '-0.2' })).resolves.toMatch(/lat/);
  });
});
