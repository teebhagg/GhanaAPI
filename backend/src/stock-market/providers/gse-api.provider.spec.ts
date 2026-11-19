import { networkError } from '../../test/axios-error';
import { HttpService } from '@nestjs/axios';
import { defer, delay, finalize, of, throwError } from 'rxjs';
import { GSEApiProvider } from './gse-api.provider';

const live = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    name: `S${i}`,
    price: 10 + i,
    change: 0.1,
    volume: 100,
  }));

const equity = (name: string) => ({
  capital: 1_000_000,
  company: {
    address: '',
    directors: [],
    email: '',
    facsimile: null,
    industry: 'Banking',
    name: `${name} Plc`,
    sector: 'Financials',
    telephone: '',
    website: '',
  },
  dps: null,
  eps: null,
  name,
  price: 10,
  shares: 1000,
});

describe('GSEApiProvider upstream load', () => {
  let get: jest.Mock;
  let provider: GSEApiProvider;
  let inFlight: number;
  let maxInFlight: number;

  /** Every call takes a few ms and is counted while it is running */
  const slow = (data: unknown) =>
    defer(() => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return of({ data }).pipe(
        delay(5),
        finalize(() => inFlight--),
      );
    });

  beforeEach(() => {
    inFlight = 0;
    maxInFlight = 0;
    get = jest.fn((url: string) => {
      if (url.endsWith('/live')) return slow(live(20));
      const name = url.split('/equities/')[1];
      return slow(equity(name));
    });
    provider = new GSEApiProvider({ get } as unknown as HttpService);
  });

  it('fetches company details at most 4 at a time, not 20 at once', async () => {
    const stocks = await provider.fetchAllStocks();

    expect(stocks).toHaveLength(20);
    expect(stocks[0].sector).toBe('Financials');
    const detailCalls = get.mock.calls.filter((c) =>
      c[0].includes('/equities/'),
    );
    expect(detailCalls).toHaveLength(20);
    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it('fetches company details for every stock, not only the first 20', async () => {
    get.mockImplementation((url: string) =>
      url.endsWith('/live')
        ? slow(live(30))
        : slow(equity(url.split('/equities/')[1])),
    );

    const stocks = await provider.fetchAllStocks();

    expect(stocks).toHaveLength(30);
    expect(stocks[29].sector).toBe('Financials'); // the 30th has details too
    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it('caches company details, so the next refresh only calls /live', async () => {
    await provider.fetchAllStocks();
    get.mockClear();

    await provider.fetchAllStocks();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toMatch(/\/live$/);
  });

  it('pauses detail requests after a 429 instead of retrying into it', async () => {
    get.mockImplementation((url: string) =>
      url.endsWith('/live')
        ? slow(live(20))
        : throwError(() => ({ response: { status: 429 }, message: '429' })),
    );

    const stocks = await provider.fetchAllStocks();

    expect(stocks).toHaveLength(20); // live prices still served
    expect(stocks[0].sector).toBe('Unknown'); // details are optional
    const detailCalls = get.mock.calls.filter((c) =>
      c[0].includes('/equities/'),
    );
    // Only the first few in-flight requests were sent before the pause kicked in
    expect(detailCalls.length).toBeLessThanOrEqual(4);
  });

  it('computes market indices from stocks it is given, without another request', async () => {
    const stocks = await provider.fetchAllStocks();
    get.mockClear();

    await provider.fetchMarketIndices(stocks);

    expect(get).not.toHaveBeenCalled();
  });

  it('keeps the upstream error as the cause, so /status can say why', async () => {
    const timeout = networkError(
      'ECONNABORTED',
      'timeout of 10000ms exceeded',
      'https://dev.kwayisi.org/apis/gse/live',
    );
    get.mockImplementation(() => throwError(() => timeout));

    await expect(provider.fetchAllStocks()).rejects.toMatchObject({
      status: 503,
      cause: timeout,
    });
  });

  it('throws a 503 when the live prices cannot be fetched', async () => {
    get.mockImplementation(() => throwError(() => new Error('timeout')));

    await expect(provider.fetchAllStocks()).rejects.toMatchObject({
      status: 503,
    });
  });

  it('keeps the upstream error text out of the client message', async () => {
    const failure = networkError(
      'ECONNREFUSED',
      'connect ECONNREFUSED 10.1.2.3:443',
      'https://dev.kwayisi.org/apis/gse/live',
    );
    get.mockImplementation(() => throwError(() => failure));

    const all = await provider.fetchAllStocks().catch((e: unknown) => e);
    expect((all as Error).message).not.toMatch(/ECONNREFUSED|10\.1\.2\.3/);
    expect((all as { cause?: unknown }).cause).toBe(failure);

    const one = await provider.fetchStock('GCB').catch((e: unknown) => e);
    expect((one as Error).message).not.toMatch(/ECONNREFUSED|10\.1\.2\.3/);
    expect((one as { cause?: unknown }).cause).toBeDefined();
  });
});
