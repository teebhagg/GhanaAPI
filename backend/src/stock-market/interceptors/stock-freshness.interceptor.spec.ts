import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { StockMarketService } from '../stock-market.service';
import { StockFreshnessInterceptor } from './stock-freshness.interceptor';

describe('StockFreshnessInterceptor', () => {
  const run = async (freshness: { asOf: string | null; stale: boolean }) => {
    const setHeader = jest.fn();
    const service = {
      getFreshness: jest.fn().mockReturnValue(freshness),
    } as unknown as StockMarketService;
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ setHeader }) }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('body') };

    const body = await lastValueFrom(
      new StockFreshnessInterceptor(service).intercept(context, next),
    );
    return { setHeader, body };
  };

  it('sets the fetch time and stale=false for fresh prices', async () => {
    const { setHeader, body } = await run({
      asOf: '2026-11-16T10:00:00.000Z',
      stale: false,
    });

    expect(body).toBe('body');
    expect(setHeader).toHaveBeenCalledWith('X-Data-As-Of', '2026-11-16T10:00:00.000Z');
    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'false');
  });

  it('sets stale=true for prices served from the last good fetch', async () => {
    const { setHeader } = await run({
      asOf: '2026-11-15T10:00:00.000Z',
      stale: true,
    });

    expect(setHeader).toHaveBeenCalledWith('X-Data-Stale', 'true');
  });

  it('omits X-Data-As-Of when nothing has been fetched', async () => {
    const { setHeader } = await run({ asOf: null, stale: false });

    expect(setHeader).not.toHaveBeenCalledWith('X-Data-As-Of', expect.anything());
  });
});
