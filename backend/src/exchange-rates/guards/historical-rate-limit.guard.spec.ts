import { ExecutionContext, HttpException } from '@nestjs/common';
import {
  HISTORICAL_RATE_LIMIT,
  HISTORICAL_RATE_WINDOW_MS,
  HistoricalRateLimitGuard,
} from './historical-rate-limit.guard';

function contextFor(headers: Record<string, string> = {}, ip = '10.0.0.1') {
  const response = { setHeader: jest.fn() };
  const request = { headers, ip, socket: { remoteAddress: ip } };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { context, response };
}

describe('HistoricalRateLimitGuard', () => {
  let guard: HistoricalRateLimitGuard;

  beforeEach(() => {
    guard = new HistoricalRateLimitGuard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.RATE_LIMIT_PROXY_HOPS;
  });

  it('allows requests up to the limit and sets rate limit headers', () => {
    const { context, response } = contextFor();
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) {
      expect(guard.canActivate(context)).toBe(true);
    }
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      '0',
    );
  });

  it('rejects the request over the limit with 429 and Retry-After', () => {
    const { context, response } = contextFor();
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) guard.canActivate(context);

    let error: HttpException | undefined;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e as HttpException;
    }
    expect(error?.getStatus()).toBe(429);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '60');
  });

  it('counts clients separately', () => {
    const a = contextFor({}, '10.0.0.1').context;
    const b = contextFor({}, '10.0.0.2').context;
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) guard.canActivate(a);

    expect(() => guard.canActivate(a)).toThrow(HttpException);
    expect(guard.canActivate(b)).toBe(true);
  });

  it('keys on the last X-Forwarded-For entry, which the caller cannot forge', () => {
    const real = '203.0.113.9';
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) {
      // Each request forges a different leading address; the proxy appends the real one.
      guard.canActivate(
        contextFor({ 'x-forwarded-for': `1.1.1.${i}, ${real}` }).context,
      );
    }
    const next = contextFor({ 'x-forwarded-for': `9.9.9.9, ${real}` }).context;
    expect(() => guard.canActivate(next)).toThrow(HttpException);
  });

  it('counts from the right by RATE_LIMIT_PROXY_HOPS when another proxy sits in front', () => {
    process.env.RATE_LIMIT_PROXY_HOPS = '2';
    const client = '203.0.113.9';
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) {
      // The CDN address (last) differs per request; the client address is the second from the right.
      guard.canActivate(
        contextFor({ 'x-forwarded-for': `${client}, 172.70.0.${i}` }).context,
      );
    }
    const next = contextFor({
      'x-forwarded-for': `${client}, 172.70.9.9`,
    }).context;
    expect(() => guard.canActivate(next)).toThrow(HttpException);
  });

  it('starts a fresh window after the old one expires', () => {
    const { context } = contextFor();
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000_000);
    for (let i = 0; i < HISTORICAL_RATE_LIMIT; i++) guard.canActivate(context);
    expect(() => guard.canActivate(context)).toThrow(HttpException);

    now.mockReturnValue(1_000_000 + HISTORICAL_RATE_WINDOW_MS + 1);
    expect(guard.canActivate(context)).toBe(true);
  });
});
