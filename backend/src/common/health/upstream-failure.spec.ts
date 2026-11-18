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

  describe('errors we did not write', () => {
    it.each([
      [
        'a secret in the path',
        'Request failed for /v6/SECRETKEY123/pair/USD/GHS',
      ],
      [
        'a secret in the query',
        'GET /pair?token=abc123&key=SECRETKEY123 failed',
      ],
      ['a relative url', 'could not reach ../internal/admin/keys'],
      [
        'credentials in a connection string',
        'connect failed for postgres://user:secret@db.internal:5432/x',
      ],
      [
        'credentials without a scheme',
        'login user:secret@db.internal rejected',
      ],
    ])(
      'should never publish the message when it holds %s',
      (_label, message) => {
        const reason = describeFailure(new Error(message));

        expect(reason).toBe('unexpected Error');
        expect(reason).not.toMatch(
          /SECRETKEY|secret|token|abc123|internal|db\./,
        );
      },
    );

    it('should describe an error by its own type name', () => {
      class ParseError extends Error {
        name = 'ParseError';
      }

      expect(describeFailure(new ParseError('x'))).toBe(
        'unexpected ParseError',
      );
      expect(describeFailure(new TypeError('x'))).toBe('unexpected TypeError');
    });

    it('should describe a service exception by its status, not its message', () => {
      const error = new ServiceUnavailableException('Failed: token=abc123');

      expect(describeFailure(error)).toBe('service unavailable (503)');
    });

    it('should not publish an unrecognisable cause either', () => {
      const error = new ServiceUnavailableException('outer', {
        cause: new Error('Request failed for /v6/SECRETKEY123/pair'),
      });

      expect(describeFailure(error)).toBe('service unavailable (503)');
    });
  });

  describe('trusted summaries', () => {
    it('should publish the text of an UpstreamFailure', () => {
      expect(
        describeFailure(new UpstreamFailure('No GTFS data available')),
      ).toBe('No GTFS data available');
    });

    it('should still reduce urls in a trusted summary to their host and drop credentials', () => {
      const reason = describeFailure(
        new UpstreamFailure(
          'connect failed for postgres://user:secret@db.internal:5432/x',
        ),
      );

      expect(reason).toContain('db.internal:5432');
      expect(reason).not.toMatch(/secret|user:/);
    });

    it('should cut a very long summary', () => {
      const reason = describeFailure(new UpstreamFailure('x'.repeat(2000)));

      expect(reason.length).toBeLessThanOrEqual(700);
      expect(reason.endsWith('…')).toBe(true);
    });
  });

  it('should cope with values that are not errors', () => {
    expect(describeFailure('plain text failure')).toBe('unknown error');
    expect(describeFailure(undefined)).toBe('unknown error');
    expect(describeFailure({ any: 'object' })).toBe('unknown error');
  });

  it('should stop on a cause loop', () => {
    const a = new Error('first');
    const b = new Error('second', { cause: a });
    (a as { cause?: unknown }).cause = b;

    expect(describeFailure(a)).toBe('unexpected Error');
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
      {
        source: 'gtfs',
        error: new UpstreamFailure('No GTFS data available for Ghana'),
      },
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
