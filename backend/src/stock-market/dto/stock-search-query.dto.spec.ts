import { ValidationPipe } from '@nestjs/common';
import { StockSearchQueryDto } from './stock-search-query.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (query: unknown) =>
  pipe.transform(query, { type: 'query', metatype: StockSearchQueryDto });

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

describe('StockSearchQueryDto', () => {
  it('accepts every documented sort field and order', async () => {
    for (const sortBy of [
      'price',
      'change',
      'changePercent',
      'volume',
      'marketCap',
      'symbol',
      'name',
    ]) {
      await expect(run({ sortBy, sortOrder: 'asc' })).resolves.toMatchObject({
        sortBy,
        sortOrder: 'asc',
      });
    }
    await expect(run({ sortOrder: 'desc' })).resolves.toMatchObject({
      sortOrder: 'desc',
    });
  });

  it('accepts a search with no sorting', async () => {
    await expect(run({ q: 'GCB' })).resolves.toMatchObject({ limit: 20 });
  });

  it.each(['foo', 'Price', 'PRICE', '', 'price;drop'])(
    'rejects sortBy=%p',
    async (sortBy) => {
      await expect(rejected({ sortBy })).resolves.toMatch(/sortBy/);
    },
  );

  it.each(['sideways', 'ASC', ''])(
    'rejects sortOrder=%p',
    async (sortOrder) => {
      await expect(rejected({ sortOrder })).resolves.toMatch(/sortOrder/);
    },
  );
});
