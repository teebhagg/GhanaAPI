import { HttpException, HttpStatus } from '@nestjs/common';

export type AppErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(payload: AppErrorPayload, status: HttpStatus) {
    super(payload.message, status);
    this.code = payload.code;
    this.details = payload.details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppException(
      { code: 'BAD_REQUEST', message, details },
      HttpStatus.BAD_REQUEST,
    );
  }

  static notFound(message: string, details?: unknown) {
    return new AppException(
      { code: 'NOT_FOUND', message, details },
      HttpStatus.NOT_FOUND,
    );
  }

  static rateProviderFailed(
    message = 'All providers failed',
    details?: unknown,
  ) {
    return new AppException(
      { code: 'RATE_PROVIDER_FAILED', message, details },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new AppException(
      { code: 'INTERNAL_ERROR', message, details },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
