import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { LastGoodCache } from './last-good-cache';

const HOUR = 60 * 60 * 1000;

describe('LastGoodCache', () => {
  let cache: LastGoodCache<string[]>;
  let now: number;
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    now = 1_000_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    cache = new LastGoodCache<string[]>({
      label: 'Test data',
      freshMs: 5 * 60 * 1000,
      maxStaleMs: 24 * HOUR,
      backoffMs: 60 * 1000,
    });
  });

  afterEach(() => nowSpy.mockRestore());

  it('fetches once and returns fresh data without contacting upstream again', async () => {
    const fetcher = jest.fn().mockResolvedValue(['a']);

    const first = await cache.get('k', fetcher);
    const second = await cache.get('k', fetcher);

    expect(first).toMatchObject({ data: ['a'], stale: false });
    expect(second.data).toBe(first.data);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('50 simultaneous callers share one upstream request', async () => {
    let release!: (value: string[]) => void;
    const fetcher = jest.fn(
      () => new Promise<string[]>((resolve) => (release = resolve)),
    );

    const calls = Array.from({ length: 50 }, () => cache.get('k', fetcher));
    release(['x']);
    const results = await Promise.all(calls);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.data[0] === 'x')).toBe(true);
  });

  it('serves older data immediately as stale and refreshes in the background', async () => {
    await cache.get('k', jest.fn().mockResolvedValue(['old']));
    now += 10 * 60 * 1000; // past freshMs
    const fetcher = jest.fn(() => new Promise<string[]>(() => undefined)); // never settles

    const result = await cache.get('k', fetcher); // must not hang

    expect(result).toMatchObject({ data: ['old'], stale: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps serving the last good data when the refresh fails', async () => {
    await cache.get('k', jest.fn().mockResolvedValue(['good']));
    now += 10 * 60 * 1000;

    const result = await cache.get(
      'k',
      jest.fn().mockRejectedValue(new Error('upstream down')),
    );
    await new Promise((r) => setImmediate(r));

    expect(result).toMatchObject({ data: ['good'], stale: true });
    expect(cache.peek('k')?.stale).toBe(true);
  });

  it('throws 503 when there is no data and upstream fails', async () => {
    await expect(
      cache.get('k', jest.fn().mockRejectedValue(new Error('down'))),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('keeps an HttpException from the fetcher as it is', async () => {
    const original = new HttpException('upstream 503', 503);

    await expect(
      cache.get('k', jest.fn().mockRejectedValue(original)),
    ).rejects.toBe(original);
  });

  it('does not contact upstream during the backoff window, then retries', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('down'));
    await expect(cache.get('k', fetcher)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    now += 30 * 1000; // inside the 60 s backoff
    await expect(cache.get('k', fetcher)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);

    now += 31 * 1000; // backoff over
    await expect(cache.get('k', fetcher)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not serve data older than maxStaleMs', async () => {
    await cache.get('k', jest.fn().mockResolvedValue(['ancient']));
    now += 25 * HOUR;

    await expect(
      cache.get('k', jest.fn().mockRejectedValue(new Error('down'))),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('keeps keys independent', async () => {
    await cache.get('a', jest.fn().mockResolvedValue(['A']));
    const b = await cache.get('b', jest.fn().mockResolvedValue(['B']));

    expect(b.data).toEqual(['B']);
    expect(cache.peek('a')?.stale).toBe(false);
    expect(cache.peek('missing')).toBeNull();
  });

  it('refresh() warms the cache and never throws', async () => {
    await cache.refresh('k', jest.fn().mockResolvedValue(['warm']));
    expect(cache.peek('k')?.stale).toBe(false);

    await expect(
      cache.refresh('other', jest.fn().mockRejectedValue(new Error('down'))),
    ).resolves.toBeUndefined();
  });

  describe('a fetcher that throws before returning a promise', () => {
    const throwsSync = () => {
      throw new Error('boom');
    };

    it('is a failed refresh: 503, then backoff without retrying', async () => {
      const fetcher = jest.fn(throwsSync);

      await expect(cache.get('k', fetcher)).rejects.toMatchObject({
        status: 503,
      });
      await expect(cache.get('k', fetcher)).rejects.toMatchObject({
        status: 503,
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('keeps serving the last good data and refresh() does not throw', async () => {
      await cache.get('k', jest.fn().mockResolvedValue(['a']));
      now += 10 * 60 * 1000; // stale

      const stale = await cache.get('k', throwsSync);
      expect(stale).toMatchObject({ data: ['a'], stale: true });

      now += 2 * 60 * 1000; // past the backoff
      await expect(cache.refresh('k', throwsSync)).resolves.toBeUndefined();
    });
  });

  describe('health()', () => {
    it('is healthy and empty before anything is fetched', () => {
      expect(cache.health()).toEqual({ status: 'healthy', asOf: null });
    });

    it('is healthy after a successful fetch, with the fetch time', async () => {
      await cache.get('k', jest.fn().mockResolvedValue(['a']));

      expect(cache.health()).toEqual({
        status: 'healthy',
        asOf: new Date(now),
      });
    });

    it('is unhealthy when the refresh failed and there is no data', async () => {
      await cache
        .get('k', jest.fn().mockRejectedValue(new Error('x')))
        .catch(() => undefined);

      expect(cache.health().status).toBe('unhealthy');
    });

    it('stays unhealthy after the backoff ends, until a refresh succeeds', async () => {
      await cache
        .get('k', jest.fn().mockRejectedValue(new Error('x')))
        .catch(() => undefined);
      now += 10 * 60 * 1000; // well past the 1 minute backoff

      expect(cache.health().status).toBe('unhealthy');

      await cache.get('k', jest.fn().mockResolvedValue(['a']));
      expect(cache.health().status).toBe('healthy');
    });

    it('is degraded when a refresh failed but older real data is still served', async () => {
      await cache.get('k', jest.fn().mockResolvedValue(['a']));
      now += 10 * 60 * 1000; // stale
      await cache.refresh('k', jest.fn().mockRejectedValue(new Error('x')));

      expect(cache.health().status).toBe('degraded');
    });

    it('is unhealthy when the failed refresh left only data past maxStale', async () => {
      await cache.get('k', jest.fn().mockResolvedValue(['a']));
      now += 25 * HOUR; // past the 24 hour limit
      await cache.refresh('k', jest.fn().mockRejectedValue(new Error('x')));

      expect(cache.health().status).toBe('unhealthy');
    });

    it('reports the worst key', async () => {
      await cache.get('ok', jest.fn().mockResolvedValue(['a']));
      await cache
        .get('bad', jest.fn().mockRejectedValue(new Error('x')))
        .catch(() => undefined);

      expect(cache.health().status).toBe('unhealthy');
    });
  });

  describe('noDataBackoffMs', () => {
    it('retries a city with no data after the short backoff, not backoffMs', async () => {
      const shortCache = new LastGoodCache<string[]>({
        label: 'Test data',
        freshMs: 5 * 60 * 1000,
        maxStaleMs: 24 * HOUR,
        backoffMs: 10 * 60 * 1000,
        noDataBackoffMs: 60 * 1000,
      });
      const fetcher = jest
        .fn()
        .mockRejectedValueOnce(new Error('overpass busy'))
        .mockResolvedValueOnce(['a']);

      await expect(shortCache.get('k', fetcher)).rejects.toThrow();
      now += 59 * 1000;
      await expect(shortCache.get('k', fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);

      now += 2 * 1000;
      await expect(shortCache.get('k', fetcher)).resolves.toMatchObject({
        data: ['a'],
      });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('keeps the full backoff when the city already has data', async () => {
      const shortCache = new LastGoodCache<string[]>({
        label: 'Test data',
        freshMs: 5 * 60 * 1000,
        maxStaleMs: 24 * HOUR,
        backoffMs: 10 * 60 * 1000,
        noDataBackoffMs: 60 * 1000,
      });
      const fetcher = jest
        .fn()
        .mockResolvedValueOnce(['a'])
        .mockRejectedValueOnce(new Error('overpass busy'));

      await shortCache.get('k', fetcher);
      now += 6 * 60 * 1000; // stale, so a refresh starts and fails
      await shortCache.get('k', fetcher);
      await new Promise((r) => setImmediate(r));

      now += 2 * 60 * 1000; // past noDataBackoffMs, still inside backoffMs
      await shortCache.get('k', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
