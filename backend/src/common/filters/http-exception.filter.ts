import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { AppException } from '../exceptions/app-exception';

const logger = new Logger('AllExceptionsFilter');

/** "Bad Request", "Payload Too Large", ... for a status code. */
const statusText = (status: number): string => STATUS_CODES[status] ?? 'Error';

/**
 * The 4xx status of an error from the HTTP layer (body-parser raises 413 for a
 * body that is too large, 415 for an unsupported charset). These carry a
 * client-safe message and `expose: true`. An ordinary Error that merely has a
 * `status` property is not trusted.
 */
function exposedClientStatus(exception: unknown): number | null {
  if (typeof exception !== 'object' || exception === null) return null;
  const { status, statusCode, expose } = exception as Record<string, unknown>;
  const code = typeof status === 'number' ? status : statusCode;
  return expose === true &&
    typeof code === 'number' &&
    code >= 400 &&
    code < 500
    ? code
    : null;
}

/**
 * Every error leaves the API as { statusCode, error, message }, plus any extra
 * fields the thrower set (code, details, success...). Unexpected errors are
 * logged in full and answered with a generic 500, so internals such as
 * database messages never reach the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: Record<string, unknown>;

    const clientStatus = exposedClientStatus(exception);

    if (exception instanceof AppException) {
      status = exception.getStatus();
      payload = {
        statusCode: status,
        error: exception.name,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      payload =
        typeof res === 'object' && res !== null
          ? { statusCode: status, ...(res as Record<string, unknown>) }
          : { statusCode: status, message: res };
      payload.error ??= statusText(status);
    } else if (clientStatus !== null) {
      status = clientStatus;
      payload = {
        statusCode: status,
        error: statusText(status),
        message: (exception as Error).message,
      };
    } else {
      const request = ctx.getRequest<Request>();
      const detail =
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception);
      logger.error(`${request.method} ${request.url}\n${detail}`);
      payload = {
        statusCode: status,
        error: statusText(status),
        message: 'Internal server error',
      };
    }

    response.status(status).json(payload);
  }
}
