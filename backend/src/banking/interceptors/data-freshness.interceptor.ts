import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BankDataProviderService } from '../services/bank-data-provider.service';

export type FreshnessDataset = 'banks' | 'atms';
type DatasetSelector =
  | FreshnessDataset[]
  | ((request: Request) => FreshnessDataset[]);

export const FRESHNESS_DATASETS_KEY = 'banking:freshness-datasets';

/**
 * Declares which datasets a route reads, so its freshness headers describe
 * only those. Pass a function when it depends on the request. Routes without
 * this decorator are treated as using both datasets.
 */
export const FreshnessDatasets = (datasets: DatasetSelector) =>
  SetMetadata(FRESHNESS_DATASETS_KEY, datasets);

/**
 * Tells clients how old the bank data is, without changing response bodies.
 *   X-Data-As-Of: when the oldest dataset the route used was last fetched
 *                 (ISO 8601)
 *   X-Data-Stale: "true" when any dataset the route used is past its 24h life
 *                 and is being served from the last good fetch while a
 *                 refresh runs
 */
@Injectable()
export class DataFreshnessInterceptor implements NestInterceptor {
  constructor(
    private readonly provider: BankDataProviderService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const res = http.getResponse<Response>();
        const selector = this.reflector.get<DatasetSelector | undefined>(
          FRESHNESS_DATASETS_KEY,
          context.getHandler(),
        );
        const datasets: FreshnessDataset[] =
          typeof selector === 'function'
            ? selector(http.getRequest<Request>())
            : (selector ?? ['banks', 'atms']);

        const freshness = this.provider.getFreshness();
        const used = datasets.map((dataset) => freshness[dataset]);

        const fetchedAt = used
          .map((entry) => entry.asOf)
          .filter((value): value is string => value !== null)
          .sort();
        if (fetchedAt.length > 0) {
          res.setHeader('X-Data-As-Of', fetchedAt[0]);
        }
        res.setHeader('X-Data-Stale', String(used.some((e) => e.stale)));
      }),
    );
  }
}
