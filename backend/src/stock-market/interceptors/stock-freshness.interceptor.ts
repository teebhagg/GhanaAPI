import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StockMarketService } from '../stock-market.service';

/**
 * Tells clients how old the stock prices are, without changing response bodies.
 *   X-Data-As-Of: when the prices were last fetched from the upstream (ISO 8601)
 *   X-Data-Stale: "true" when they are older than 5 minutes and are being served
 *                 from the last good fetch because the upstream failed or a
 *                 refresh is still running
 */
@Injectable()
export class StockFreshnessInterceptor implements NestInterceptor {
  constructor(private readonly stockMarketService: StockMarketService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap((body) => {
        const res = context.switchToHttp().getResponse<Response>();
        // A market summary says when its own prices were fetched; use that so
        // the headers match the body even if a refresh finished since.
        const { asOf, stale } = this.isSummary(body)
          ? this.stockMarketService.freshnessAt(body.lastUpdated)
          : this.stockMarketService.getFreshness();
        if (asOf) {
          res.setHeader('X-Data-As-Of', asOf);
        }
        res.setHeader('X-Data-Stale', String(stale));
      }),
    );
  }

  private isSummary(body: unknown): body is { lastUpdated: string } {
    return (
      typeof body === 'object' &&
      body !== null &&
      'indexValue' in body &&
      typeof (body as { lastUpdated?: unknown }).lastUpdated === 'string'
    );
  }
}
