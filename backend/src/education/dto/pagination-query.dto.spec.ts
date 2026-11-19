import { ValidationPipe } from '@nestjs/common';
import { PaginationQueryDto } from './pagination-query.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (query: unknown) =>
  pipe.transform(query, { type: 'query', metatype: PaginationQueryDto });

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

describe('PaginationQueryDto', () => {
  it('defaults to 20 results from the start', async () => {
    await expect(run({})).resolves.toMatchObject({ limit: 20, offset: 0 });
  });

  it('reads limit and offset from the query string', async () => {
    await expect(run({ limit: '5', offset: '10' })).resolves.toMatchObject({
      limit: 5,
      offset: 10,
    });
  });

  it('accepts an explicit offset of 0 and a large ordinary offset', async () => {
    await expect(run({ offset: '0' })).resolves.toMatchObject({ offset: 0 });
    await expect(run({ offset: '1000000' })).resolves.toMatchObject({
      offset: 1000000,
    });
  });

  it('accepts the largest page and an offset of zero', async () => {
    await expect(run({ limit: '100', offset: '0' })).resolves.toMatchObject({
      limit: 100,
      offset: 0,
    });
  });

  it.each(['101', '500', '0', '-1', '2.5', 'abc', ''])(
    'rejects limit=%p',
    async (limit) => {
      await expect(rejected({ limit })).resolves.toMatch(/limit/);
    },
  );

  it.each(['-3', '1.5', 'abc', '', ' ', '%20', '100000000000000000000'])(
    'rejects offset=%p',
    async (offset) => {
      await expect(rejected({ offset })).resolves.toMatch(/offset/);
    },
  );
});
