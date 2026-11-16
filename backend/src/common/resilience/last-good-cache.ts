import {
  HttpException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface LastGoodCacheOptions {
  /** Shown in logs and error messages, e.g. "Stock data" */
  label: string;
  /** Data younger than this is returned without contacting upstream */
  freshMs: number;
  /** Data older than freshMs but younger than this is served while a refresh runs */
  maxStaleMs: number;
  /** After a failed refresh, do not contact upstream again for this long */
  backoffMs: number;
}

export interface CacheResult<T> {
  data: T;
  /** When the data was fetched from upstream */
  asOf: Date;
  /** True when older than freshMs and served while a refresh runs or backs off */
  stale: boolean;
}

interface Entry<T> {
  data: T | null;
  fetchedAt: number | null;
  failedUntil: number;
  inFlight: Promise<T> | null;
}

/**
 * Keyed cache that never blocks callers on upstream once it has data, and
 * never invents data when it has none:
 *
 * - fresh data: returned immediately
 * - older data (within maxStaleMs): returned immediately as stale, refreshed
 *   in the background
 * - no usable data: callers wait for ONE shared upstream request; if that
 *   fails they get a 503, and further callers get a 503 without contacting
 *   upstream until the backoff passes
 */
export class LastGoodCache<T> {
  private readonly logger: Logger;
  private readonly entries = new Map<string, Entry<T>>();

  constructor(private readonly options: LastGoodCacheOptions) {
    this.logger = new Logger(`LastGoodCache:${options.label}`);
  }

  async get(key: string, fetcher: () => Promise<T>): Promise<CacheResult<T>> {
    const entry = this.entryFor(key);
    const age = this.ageOf(entry);

    if (entry.data !== null && age < this.options.freshMs) {
      return this.result(entry, false);
    }

    const pending = this.startRefresh(key, entry, fetcher);

    if (entry.data !== null && age < this.options.maxStaleMs) {
      this.logger.warn(`${key}: serving data from the last good fetch`);
      pending?.catch(() => undefined); // failure is logged and backed off
      return this.result(entry, true);
    }

    if (!pending) {
      throw this.unavailable();
    }
    try {
      await pending;
    } catch (error) {
      throw error instanceof HttpException ? error : this.unavailable();
    }
    return this.result(entry, false);
  }

  /** Start a background refresh now (for scheduled warming). Never throws. */
  async refresh(key: string, fetcher: () => Promise<T>): Promise<void> {
    const pending = this.startRefresh(key, this.entryFor(key), fetcher);
    await pending?.then(
      () => undefined,
      () => undefined,
    );
  }

  /** What the cache holds for a key, without contacting upstream. */
  peek(key: string): { asOf: Date; stale: boolean } | null {
    const entry = this.entries.get(key);
    if (!entry || entry.data === null || entry.fetchedAt === null) {
      return null;
    }
    return {
      asOf: new Date(entry.fetchedAt),
      stale: this.ageOf(entry) >= this.options.freshMs,
    };
  }

  private entryFor(key: string): Entry<T> {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { data: null, fetchedAt: null, failedUntil: 0, inFlight: null };
      this.entries.set(key, entry);
    }
    return entry;
  }

  private ageOf(entry: Entry<T>): number {
    return entry.fetchedAt === null ? Infinity : Date.now() - entry.fetchedAt;
  }

  private result(entry: Entry<T>, stale: boolean): CacheResult<T> {
    return {
      data: entry.data as T,
      asOf: new Date(entry.fetchedAt as number),
      stale,
    };
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      `${this.options.label} is temporarily unavailable`,
    );
  }

  private startRefresh(
    key: string,
    entry: Entry<T>,
    fetcher: () => Promise<T>,
  ): Promise<T> | null {
    if (entry.inFlight) {
      return entry.inFlight; // share the running request
    }
    if (Date.now() < entry.failedUntil) {
      return null;
    }
    entry.inFlight = fetcher()
      .then(
        (data) => {
          entry.data = data;
          entry.fetchedAt = Date.now();
          return data;
        },
        (error) => {
          this.logger.error(
            `${key}: refresh failed: ${(error as Error).message}`,
          );
          entry.failedUntil = Date.now() + this.options.backoffMs;
          throw error;
        },
      )
      .finally(() => {
        entry.inFlight = null;
      });
    return entry.inFlight;
  }
}
