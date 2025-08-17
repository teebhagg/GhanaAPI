import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app-exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: any = {
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };

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
    } else if (exception instanceof Error) {
      payload = {
        statusCode: status,
        error: exception.name,
        message: exception.message,
      };
    }

    response.status(status).json(payload);
  }
}
