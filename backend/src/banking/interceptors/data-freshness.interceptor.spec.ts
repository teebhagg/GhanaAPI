import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { BankDataProviderService } from '../services/bank-data-provider.service';
import { DataFreshnessInterceptor } from './data-freshness.interceptor';

describe('DataFreshnessInterceptor', () => {
  const run = async (freshness: unknown) => {
    const setHeader = jest.fn();
    const provider = {
      getFreshness: jest.fn().mockReturnValue(freshness),
    } as unknown as BankDataProviderService;
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ setHeader }) }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('body') };

    const body = await lastValueFrom(
      new DataFreshnessInterceptor(provider).intercept(context, next),
    );
    return { setHeader, body };
  };

  it('sets the oldest fetch time and stale=false for fresh data', async () => {
    const { setHeader, body } = await run({
      banks: { asOf: '2026-11-16T10:00:00.000Z', stale: false },
      atms: { asOf: '2026-11-16T09:00:00.000Z', stale: false },
    });

    expect(body).toBe('body');
    expect(setHeader).toHaveBeenCalledWith(
      'X-Data-As-Of',
      '2026-11-16T09:00:00.000Z',
    );
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'false');
  });

  it('sets stale=true when any dataset is stale', async () => {
    const { setHeader } = await run({
      banks: { asOf: '2026-11-15T10:00:00.000Z', stale: true },
      atms: { asOf: null, stale: false },
    });

    expect(setHeader).toHaveBeenCalledWith(
      'X-Data-As-Of',
      '2026-11-15T10:00:00.000Z',
    );
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'true');
  });

  it('omits X-Data-As-Of when nothing has been fetched', async () => {
    const { setHeader } = await run({
      banks: { asOf: null, stale: false },
      atms: { asOf: null, stale: false },
    });

    expect(setHeader).not.toHaveBeenCalledWith(
      'X-Data-As-Of',
      expect.anything(),
    );
  });
});
