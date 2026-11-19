import { UpstreamFailure } from './upstream-failure';
import {
  FailureReport,
  failureReport,
  newestFailure,
  worstOf,
} from './service-health';

describe('failureReport', () => {
  afterEach(() => jest.useRealTimers());

  it('describes the error safely and stamps the time', () => {
    jest.useFakeTimers({ now: new Date('2026-11-19T10:00:00.000Z') });

    expect(failureReport(new UpstreamFailure('no stops'), 'gtfs')).toEqual({
      reason: 'no stops',
      at: '2026-11-19T10:00:00.000Z',
      scope: 'gtfs',
    });
  });

  it('leaves the scope out when there is none', () => {
    expect(failureReport(new UpstreamFailure('no prices'))).not.toHaveProperty(
      'scope',
    );
  });

  it('never publishes the message of an unknown error', () => {
    const report = failureReport(new Error('key=SECRET at /v1/x?token=abc'));

    expect(report.reason).toBe('unexpected Error');
  });
});

describe('newestFailure', () => {
  const at = (time: string, reason = time): FailureReport => ({
    reason,
    at: time,
  });

  it('returns the most recent failure', () => {
    const newest = at('2026-11-19T10:05:00.000Z');

    expect(newestFailure([at('2026-11-19T10:00:00.000Z'), newest, null])).toBe(
      newest,
    );
  });

  it('ignores missing entries and returns null when none are left', () => {
    expect(newestFailure([null, undefined])).toBeNull();
    expect(newestFailure([])).toBeNull();
  });

  it('keeps the first of two failures at the same time', () => {
    const first = at('2026-11-19T10:00:00.000Z', 'first');
    const second = at('2026-11-19T10:00:00.000Z', 'second');

    expect(newestFailure([first, second])).toBe(first);
  });
});

describe('worstOf', () => {
  it('returns the worst state', () => {
    expect(worstOf('healthy', 'unhealthy', 'degraded')).toBe('unhealthy');
    expect(worstOf()).toBe('healthy');
  });
});
