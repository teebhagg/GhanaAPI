export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

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
