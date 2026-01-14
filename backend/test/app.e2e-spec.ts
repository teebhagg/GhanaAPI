import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) - should return welcome message', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(
        "Welcome to Ghana API - Your gateway to Ghana's data and services",
      );
  });

  it('/status (GET) - should return API status with health checks', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/status')
      .expect(200)
      .expect((res) => {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('health');
        expect(res.body).toHaveProperty('statistics');
        expect(res.body.health).toHaveProperty('database');
        expect(res.body.health).toHaveProperty('services');
        // Verify status is one of the expected values
        expect(['healthy', 'degraded', 'unhealthy']).toContain(res.body.status);
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      });
  });
});
