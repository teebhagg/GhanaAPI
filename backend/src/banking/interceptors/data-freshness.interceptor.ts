import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BankDataProviderService } from '../services/bank-data-provider.service';

/**
 * Tells clients how old the bank data is, without changing response bodies.
 *   X-Data-As-Of: when the oldest dataset used was last fetched (ISO 8601)
 *   X-Data-Stale: "true" when any dataset is past its 24h life and is being
 *                 served from the last good fetch while a refresh runs
 */
@Injectable()
export class DataFreshnessInterceptor implements NestInterceptor {
  constructor(private readonly provider: BankDataProviderService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const { banks, atms } = this.provider.getFreshness();

        const fetchedAt = [banks.asOf, atms.asOf]
          .filter((value): value is string => value !== null)
          .sort();
        if (fetchedAt.length > 0) {
          res.setHeader('X-Data-As-Of', fetchedAt[0]);
        }
        res.setHeader('X-Data-Stale', String(banks.stale || atms.stale));
      }),
    );
  }
}
