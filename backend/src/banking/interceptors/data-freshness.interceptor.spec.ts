import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { BankDataProviderService } from '../services/bank-data-provider.service';
import { DataFreshnessInterceptor } from './data-freshness.interceptor';

describe('DataFreshnessInterceptor', () => {
  const FRESH_BANKS = { asOf: '2026-11-16T10:00:00.000Z', stale: false };
  const FRESH_ATMS = { asOf: '2026-11-16T09:00:00.000Z', stale: false };
  const STALE_ATMS = { asOf: '2026-11-14T09:00:00.000Z', stale: true };

  const run = async (
    freshness: unknown,
    selector?: unknown,
    request: unknown = { query: {} },
  ) => {
    const setHeader = jest.fn();
    const provider = {
      getFreshness: jest.fn().mockReturnValue(freshness),
    } as unknown as BankDataProviderService;
    const reflector = {
      get: jest.fn().mockReturnValue(selector),
    } as unknown as Reflector;
    const context = {
      getHandler: () => () => undefined,
      switchToHttp: () => ({
        getResponse: () => ({ setHeader }),
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('body') };

    const body = await lastValueFrom(
      new DataFreshnessInterceptor(provider, reflector).intercept(context, next),
    );
    return { setHeader, body };
  };

  it('uses both datasets by default: oldest fetch time, stale=false when fresh', async () => {
    const { setHeader, body } = await run({
      banks: FRESH_BANKS,
      atms: FRESH_ATMS,
    });

    expect(body).toBe('body');
    expect(setHeader).toHaveBeenCalledWith('X-Data-As-Of', FRESH_ATMS.asOf);
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'false');
  });

  it('is stale when any dataset the route uses is stale', async () => {
    const { setHeader } = await run({ banks: FRESH_BANKS, atms: STALE_ATMS });

    expect(setHeader).toHaveBeenCalledWith('X-Data-As-Of', STALE_ATMS.asOf);
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'true');
  });

  it('ignores a stale ATM dataset on a banks-only route', async () => {
    const { setHeader } = await run(
      { banks: FRESH_BANKS, atms: STALE_ATMS },
      ['banks'],
    );

    expect(setHeader).toHaveBeenCalledWith('X-Data-As-Of', FRESH_BANKS.asOf);
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'false');
  });

  it('picks datasets from the request when the selector is a function', async () => {
    const selector = (req: { query?: { type?: string } }) =>
      req.query?.type === 'bank' ? ['banks'] : ['banks', 'atms'];
    const freshness = { banks: FRESH_BANKS, atms: STALE_ATMS };

    const bankOnly = await run(freshness, selector, { query: { type: 'bank' } });
    expect(bankOnly.setHeader).toHaveBeenCalledWith('X-Data-Stale', 'false');

    const both = await run(freshness, selector, { query: { type: 'both' } });
    expect(both.setHeader).toHaveBeenCalledWith('X-Data-Stale', 'true');
  });

  it('omits X-Data-As-Of when the datasets used were never fetched', async () => {
    const { setHeader } = await run(
      {
        banks: { asOf: null, stale: false },
        atms: { asOf: null, stale: false },
      },
      ['banks'],
    );

    expect(setHeader).not.toHaveBeenCalledWith('X-Data-As-Of', expect.anything());
  });
});
