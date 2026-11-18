import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { TimeoutError } from 'rxjs';
import { axiosError, httpError, networkError } from '../../test/axios-error';
import {
  describeFailure,
  safeMessage,
  summariseSources,
  UpstreamFailure,
} from './upstream-failure';

describe('describeFailure', () => {
  it('should name the status and the host of an HTTP error', () => {
    const error = httpError(502, 'https://z.overpass-api.de/api/interpreter');

    expect(describeFailure(error)).toBe('HTTP 502 from z.overpass-api.de');
  });

  it('should never include a path or query, which can hold an API key', () => {
    const error = httpError(
      401,
      'https://v6.exchangerate-api.com/v6/SECRETKEY123/pair/USD/GHS/10?token=abc',
    );

    const reason = describeFailure(error);

    expect(reason).toBe('HTTP 401 from v6.exchangerate-api.com');
    expect(reason).not.toMatch(/SECRETKEY123|token|pair/);
  });

  it('should resolve a relative url against the base url', () => {
    const error = axiosError('x', {
      url: '/api/v3/simple/price',
      baseURL: 'https://api.coingecko.com',
      status: 429,
    });

    expect(describeFailure(error)).toBe('HTTP 429 from api.coingecko.com');
  });

  it('should report a timeout with its length', () => {
    const error = networkError(
      'ECONNABORTED',
      'timeout of 8000ms exceeded',
      'https://dev.kwayisi.org/apis/gse/live',
    );

    expect(describeFailure(error)).toBe(
      'timeout after 8000ms contacting dev.kwayisi.org',
    );
  });

  it('should report a failed DNS lookup', () => {
    const error = networkError(
      'ENOTFOUND',
      'getaddrinfo ENOTFOUND api.coingecko.com',
      'https://api.coingecko.com/x',
    );

    expect(describeFailure(error)).toBe(
      'DNS lookup failed for api.coingecko.com',
    );
  });

  it('should report other connection errors with their code', () => {
    const error = networkError(
      'ECONNRESET',
      'socket hang up',
      'https://cedirates.com/fuel-prices/gh/',
    );

    expect(describeFailure(error)).toBe(
      'connection error ECONNRESET contacting cedirates.com',
    );
  });

  it('should say so when there is no code and no response', () => {
    const error = axiosError('boom', { url: 'https://a.test/x' });

    expect(describeFailure(error)).toBe('no response from a.test');
  });

  it('should recognise an rxjs timeout', () => {
    expect(describeFailure(new TimeoutError())).toContain('timeout');
  });

  it('should look through the cause of a service exception', () => {
    const wrapped = new ServiceUnavailableException('Stock data is down', {
      cause: networkError(
        'ECONNABORTED',
        'timeout of 10000ms exceeded',
        'https://dev.kwayisi.org/apis/gse/live',
      ),
    });

    expect(describeFailure(wrapped)).toBe(
      'timeout after 10000ms contacting dev.kwayisi.org',
    );
  });

  it('should prefer a summary a service already wrote', () => {
    const wrapped = new HttpException('All sources failed', 503, {
      cause: new UpstreamFailure('overpass: HTTP 502 from overpass-api.de'),
    });

    expect(describeFailure(wrapped)).toBe(
      'overpass: HTTP 502 from overpass-api.de',
    );
  });

  it('should use the message of an error with no useful cause', () => {
    expect(describeFailure(new Error('No GTFS data available'))).toBe(
      'No GTFS data available',
    );
  });

  it('should replace urls in a message with their host and drop credentials', () => {
    const reason = describeFailure(
      new Error('connect failed for postgres://user:secret@db.internal:5432/x'),
    );

    expect(reason).toContain('db.internal:5432');
    expect(reason).not.toMatch(/secret|user:/);
  });

  it('should cut a long message', () => {
    const reason = describeFailure(new Error('x'.repeat(1000)));

    expect(reason.length).toBeLessThanOrEqual(160);
    expect(reason.endsWith('…')).toBe(true);
  });

  it('should cope with values that are not errors', () => {
    expect(describeFailure('plain text failure')).toBe('plain text failure');
    expect(describeFailure(undefined)).toBe('unknown error');
    expect(describeFailure({ any: 'object' })).toBe('unknown error');
  });

  it('should stop on a cause loop', () => {
    const a = new Error('first');
    const b = new Error('second', { cause: a });
    (a as { cause?: unknown }).cause = b;

    expect(describeFailure(a)).toBe('first');
  });
});

describe('safeMessage', () => {
  it('should leave text without urls alone', () => {
    expect(safeMessage('  plain   text ')).toBe('plain text');
  });
});

describe('summariseSources', () => {
  it('should name each source and keep the first error as the cause', () => {
    const first = httpError(502, 'https://overpass-api.de/api/interpreter');
    const summary = summariseSources([
      { source: 'overpass', error: first },
      { source: 'gtfs', error: new Error('No GTFS data available for Ghana') },
    ]);

    expect(summary).toBeInstanceOf(UpstreamFailure);
    expect(summary.summary).toBe(
      'overpass: HTTP 502 from overpass-api.de; gtfs: No GTFS data available for Ghana',
    );
    expect(summary.cause).toBe(first);
  });

  it('should keep every source when there are many', () => {
    const sources = [
      'npa-scraper',
      'cedirates-scraper',
      'citinews-scraper',
      'joyonline-scraper',
      'ghanaweb-scraper',
    ];
    const summary = summariseSources(
      sources.map((source) => ({
        source,
        error: networkError(
          'ECONNREFUSED',
          'connect ECONNREFUSED',
          'https://www.example-news-site.com/some/long/path',
        ),
      })),
    );

    for (const source of sources) {
      expect(summary.summary).toContain(`${source}: `);
    }
    expect(summary.summary).not.toContain('…');
    expect(summary.summary).not.toContain('/some/long/path');
  });
});
