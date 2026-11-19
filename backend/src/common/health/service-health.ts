import { describeFailure } from './upstream-failure';

export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

/** Why the last refresh of a data source failed, in words safe to publish */
export interface FailureReport {
  reason: string;
  /** ISO time of the failure */
  at: string;
  /** What failed when a service holds several datasets, e.g. a city or "atms" */
  scope?: string;
}

/**
 * What a data service knows about itself without calling its upstream:
 * healthy when its last refresh worked (or it has not needed one yet),
 * degraded when the last refresh failed but it still serves older real data,
 * unhealthy when the last refresh failed and it has nothing usable to serve.
 */
export interface ServiceHealth {
  status: HealthState;
  /** When the data being served was last fetched from upstream, if ever */
  asOf: string | null;
  /** A short human-readable reason or note */
  detail?: string;
  /** The most recent failed refresh, while one is outstanding */
  lastFailure?: FailureReport;
}

const ORDER: HealthState[] = ['healthy', 'degraded', 'unhealthy'];

/** The worst of several states */
export function worstOf(...states: HealthState[]): HealthState {
  return states.reduce<HealthState>(
    (worst, state) =>
      ORDER.indexOf(state) > ORDER.indexOf(worst) ? state : worst,
    'healthy',
  );
}

/**
 * A report of a failure that happened now. The reason is written by
 * `describeFailure`, so it is safe to publish. The time comes from `Date.now()`
 * so tests with fake timers control it.
 */
export function failureReport(error: unknown, scope?: string): FailureReport {
  return {
    reason: describeFailure(error),
    at: new Date(Date.now()).toISOString(),
    ...(scope !== undefined && { scope }),
  };
}

/**
 * The most recent of several failures, ignoring the ones that are missing. When
 * two happened at the same time, the first one listed wins.
 */
export function newestFailure(
  failures: ReadonlyArray<FailureReport | null | undefined>,
): FailureReport | null {
  let newest: FailureReport | null = null;
  for (const failure of failures) {
    if (failure && (newest === null || failure.at > newest.at)) {
      newest = failure;
    }
  }
  return newest;
}
