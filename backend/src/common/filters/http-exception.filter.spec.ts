import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  INestApplication,
  Logger,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import { IsString } from 'class-validator';
import request from 'supertest';
import { AppException } from '../exceptions/app-exception';
import { AllExceptionsFilter } from './http-exception.filter';

class EchoDto {
  @IsString()
  name!: string;
}

@Controller()
class ProbeController {
  @Post('echo')
  echo(@Body() body: EchoDto) {
    return body;
  }

  @Get('crash')
  crash() {
    throw new Error('connection to postgres://user:secret@db failed');
  }

  @Get('crash-string')
  crashString() {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw 'a plain string';
  }

  @Get('fake-4xx')
  fakeClientError() {
    // A 4xx-looking property on an ordinary Error is not trusted
    throw Object.assign(new Error('internal detail'), { status: 404 });
  }

  @Get('http-string')
  httpString() {
    throw new HttpException('plain message', 400);
  }

  @Get('http-object')
  httpObject() {
    throw new HttpException(
      { statusCode: 400, message: 'object message' },
      400,
    );
  }

  @Get('http-extra')
  httpExtra() {
    throw new HttpException(
      { success: false, message: 'with extras', error: 'Custom Name' },
      503,
    );
  }

  @Get('nest-bad-request')
  nestBadRequest() {
    throw new BadRequestException('bad input');
  }

  @Get('app')
  app() {
    throw AppException.rateProviderFailed('providers down', { tried: 3 });
  }

  @Get('app-internal')
  appInternal() {
    throw AppException.internal('deliberate message');
  }
}

describe('AllExceptionsFilter', () => {
  let app: INestApplication;
  let logError: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    // Same global setup as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  beforeEach(() => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => logError.mockRestore());

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer() as Server);
  const bodyOf = (res: request.Response) => res.body as Record<string, unknown>;

  describe('errors raised by the body parser', () => {
    it('should answer 413 with a Payload Too Large body for an oversized request', async () => {
      const res = await http()
        .post('/echo')
        .send({ name: 'x'.repeat(300_000) });

      expect(res.status).toBe(413);
      expect(res.body).toEqual({
        statusCode: 413,
        error: 'Payload Too Large',
        message: 'request entity too large',
      });
    });

    it('should answer 400 for malformed JSON', async () => {
      const res = await http()
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send('{not json');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
    });

    it('should answer 415 for an unsupported charset', async () => {
      const res = await http()
        .post('/echo')
        .set('Content-Type', 'application/json; charset=bogus')
        .send('{"name":"a"}');

      expect(res.status).toBe(415);
      expect(res.body).toMatchObject({
        statusCode: 415,
        error: 'Unsupported Media Type',
      });
    });

    it('should not log a client error as a server failure', async () => {
      await http()
        .post('/echo')
        .send({ name: 'x'.repeat(300_000) });

      expect(logError).not.toHaveBeenCalled();
    });
  });

  describe('HttpException bodies always carry an error field', () => {
    it('should add the status text when the exception has only a message', async () => {
      const res = await http().get('/http-string');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'plain message',
      });
    });

    it('should add the status text to an object response that lacks one', async () => {
      const res = await http().get('/http-object');

      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'object message',
      });
    });

    it('should keep extra fields and an error name that is already set', async () => {
      const res = await http().get('/http-extra');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        statusCode: 503,
        success: false,
        message: 'with extras',
        error: 'Custom Name',
      });
    });

    it('should keep the shape Nest already gives its own exceptions', async () => {
      const res = await http().get('/nest-bad-request');

      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'bad input',
      });
    });

    it('should keep the validation message list and add the error field', async () => {
      const res = await http().post('/echo').send({ name: 5, extra: true });

      expect(res.status).toBe(400);
      expect(Array.isArray(bodyOf(res).message)).toBe(true);
      expect(bodyOf(res).error).toBe('Bad Request');
    });

    it('should leave an AppException exactly as before', async () => {
      const res = await http().get('/app');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        statusCode: 503,
        error: 'AppException',
        code: 'RATE_PROVIDER_FAILED',
        message: 'providers down',
        details: { tried: 3 },
      });
    });

    it('should keep the message of a deliberate AppException 500', async () => {
      const res = await http().get('/app-internal');

      expect(res.status).toBe(500);
      expect(bodyOf(res).message).toBe('deliberate message');
      expect(bodyOf(res).code).toBe('INTERNAL_ERROR');
    });

    it('should answer 404 for an unknown route in the same shape', async () => {
      const res = await http().get('/does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    });
  });

  describe('unexpected errors', () => {
    it('should answer 500 without leaking the error message or name', async () => {
      const res = await http().get('/crash');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
      expect(JSON.stringify(res.body)).not.toMatch(/secret|postgres/);
    });

    it('should log the real error with the request that caused it', async () => {
      await http().get('/crash');

      expect(logError).toHaveBeenCalledTimes(1);
      const [logged] = logError.mock.calls[0] as [string];
      expect(logged).toContain('GET /crash');
      expect(logged).toContain(
        'connection to postgres://user:secret@db failed',
      );
    });

    it('should answer 500 when something that is not an Error is thrown', async () => {
      const res = await http().get('/crash-string');

      expect(res.status).toBe(500);
      expect(bodyOf(res).message).toBe('Internal server error');
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it('should not trust a status property on an ordinary Error', async () => {
      const res = await http().get('/fake-4xx');

      expect(res.status).toBe(500);
      expect(JSON.stringify(res.body)).not.toContain('internal detail');
    });
  });
});
