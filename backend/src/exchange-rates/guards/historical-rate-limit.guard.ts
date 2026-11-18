import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export const HISTORICAL_RATE_LIMIT = 30;
export const HISTORICAL_RATE_WINDOW_MS = 60_000;
// Upper bound on tracked clients, so a flood of distinct addresses cannot grow memory without limit.
const MAX_TRACKED_CLIENTS = 10_000;

function proxyHops(): number {
  const hops = Number.parseInt(process.env.RATE_LIMIT_PROXY_HOPS ?? '', 10);
  return Number.isInteger(hops) && hops >= 1 ? hops : 1;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-client fixed-window limit for the endpoints that read the history table.
 * Counts live in this process, so each instance enforces its own limit.
 */
@Injectable()
export class HistoricalRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const now = Date.now();

    const key = this.clientKey(request);
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.evictExpired(now);
      bucket = { count: 0, resetAt: now + HISTORICAL_RATE_WINDOW_MS };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, HISTORICAL_RATE_LIMIT - bucket.count);
    response.setHeader('X-RateLimit-Limit', String(HISTORICAL_RATE_LIMIT));
    response.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > HISTORICAL_RATE_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        `Too many requests. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  // Behind a proxy (Render) req.ip is the proxy. Each proxy appends the address
  // it received the request from to X-Forwarded-For, so counting from the right
  // gives addresses our own infrastructure vouched for; entries further left can
  // be forged by the caller. RATE_LIMIT_PROXY_HOPS is how many proxies of ours
  // sit in front of the app (default 1); set it to 2 if another layer, such as a
  // CDN, adds its own address after the client's.
  private clientKey(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const header = Array.isArray(forwarded) ? forwarded.join(',') : forwarded;
    const entries =
      header
        ?.split(',')
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [];
    const hops = proxyHops();
    const client = entries[Math.max(0, entries.length - hops)];
    return client || request.ip || request.socket?.remoteAddress || 'unknown';
  }

  private evictExpired(now: number): void {
    if (this.buckets.size < MAX_TRACKED_CLIENTS) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Still full of live entries: drop the oldest to make room.
    while (this.buckets.size >= MAX_TRACKED_CLIENTS) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}
