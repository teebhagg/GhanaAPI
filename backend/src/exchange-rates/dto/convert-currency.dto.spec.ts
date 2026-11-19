import { ValidationPipe } from '@nestjs/common';
import { ConvertCurrencyDto } from './convert-currency.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (body: unknown) =>
  pipe.transform(body, { type: 'body', metatype: ConvertCurrencyDto });

const messagesOf = async (body: unknown): Promise<string[]> => {
  try {
    await run(body);
  } catch (error) {
    const response = (
      error as { getResponse: () => { message: string[]; statusCode: number } }
    ).getResponse();
    expect(response.statusCode).toBe(400);
    return response.message;
  }
  throw new Error('expected the body to be rejected');
};

describe('ConvertCurrencyDto', () => {
  it('accepts a supported pair and a positive amount', async () => {
    await expect(run({ from: 'GHS', to: 'USD', amount: 100 })).resolves.toEqual(
      { from: 'GHS', to: 'USD', amount: 100 },
    );
  });

  it('accepts a fractional amount and a numeric string', async () => {
    await expect(
      run({ from: 'GHS', to: 'USD', amount: 0.01 }),
    ).resolves.toMatchObject({ amount: 0.01 });
    await expect(
      run({ from: 'GHS', to: 'USD', amount: '12.5' }),
    ).resolves.toMatchObject({ amount: 12.5 });
  });

  it('upper-cases and trims the currency codes', async () => {
    await expect(
      run({ from: ' ghs ', to: 'usd', amount: 5 }),
    ).resolves.toMatchObject({ from: 'GHS', to: 'USD' });
  });

  it.each([-5, 0, -0.01, '-1', '0'])(
    'rejects the amount %p',
    async (amount) => {
      const messages = await messagesOf({ from: 'GHS', to: 'USD', amount });
      expect(messages.join(' ')).toMatch(/amount/);
    },
  );

  it.each(['abc', null, undefined, Infinity, NaN])(
    'rejects the amount %p',
    async (amount) => {
      await messagesOf({ from: 'GHS', to: 'USD', amount });
    },
  );

  it('rejects an unsupported currency with a 400 that lists the choices', async () => {
    const messages = await messagesOf({ from: 'USD', to: 'XYZ', amount: 5 });
    expect(messages.join(' ')).toMatch(/to must be one of the following/);
    expect(messages.join(' ')).toContain('GHS');
  });

  it.each([123, '', null, undefined])(
    'rejects the currency %p',
    async (code) => {
      await messagesOf({ from: code, to: 'USD', amount: 5 });
    },
  );
});
