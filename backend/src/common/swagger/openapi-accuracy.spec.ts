import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppController } from '../../app.controller';
import { AppService } from '../../app.service';
import { AddressesController } from '../../addresses/addresses.controller';
import { AddressesService } from '../../addresses/addresses.service';
import { LocationsController } from '../../locations/locations.controller';
import { LocationsService } from '../../locations/locations.service';
import { ExchangeRatesController } from '../../exchange-rates/exchange-rates.controller';
import { ExchangeRatesService } from '../../exchange-rates/exchange-rates.service';
import { EducationController } from '../../education/education.controller';
import { EducationService } from '../../education/education.service';
import { CryptoController } from '../../crypto/crypto.controller';
import { CryptoService } from '../../crypto/crypto.service';
import { TransportController } from '../../transport/transport.controller';
import { TransportService } from '../../transport/transport.service';

/** Walk a list of keys into a JSON-like value; undefined where it is missing */
const pick = (root: unknown, ...keys: string[]): unknown =>
  keys.reduce<unknown>(
    (node, key) =>
      node !== null && typeof node === 'object'
        ? (node as Record<string, unknown>)[key]
        : undefined,
    root,
  );

/**
 * The OpenAPI document must describe what the API really returns. This builds
 * the document from the real controllers (with no-op services) and checks the
 * operations, schemas and enums that were wrong before.
 */
describe('OpenAPI document accuracy', () => {
  let app: INestApplication;
  let doc: unknown;

  beforeAll(async () => {
    const stub = {};
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AppController,
        AddressesController,
        LocationsController,
        ExchangeRatesController,
        EducationController,
        CryptoController,
        TransportController,
      ],
      providers: [
        { provide: AppService, useValue: stub },
        { provide: AddressesService, useValue: stub },
        { provide: LocationsService, useValue: stub },
        { provide: ExchangeRatesService, useValue: stub },
        { provide: EducationService, useValue: stub },
        { provide: CryptoService, useValue: stub },
        { provide: TransportService, useValue: stub },
        { provide: CACHE_MANAGER, useValue: stub },
        { provide: ConfigService, useValue: stub },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('t').setVersion('1').build(),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  /** The success response of an operation */
  const successOf = (method: string, path: string): unknown => {
    const responses = pick(doc, 'paths', path, method, 'responses');
    expect(responses).toBeDefined();
    const code = Object.keys(responses as object).find((c) => /^2/.test(c));
    return code ? pick(responses, code) : undefined;
  };

  /** The allowed values of the `type` query parameter of /transport/stops */
  const stopTypeFilterEnum = (): unknown => {
    const params = pick(
      doc,
      'paths',
      '/api/v1/transport/stops',
      'get',
      'parameters',
    ) as Array<{ name: string }>;
    return pick(
      params.find((p) => p.name === 'type'),
      'schema',
      'enum',
    );
  };

  it.each([
    ['get', '/api/v1'],
    ['get', '/api/v1/status'],
    ['get', '/api/v1/addresses/validate/{code}'],
    ['get', '/api/v1/addresses/lookup'],
    ['get', '/api/v1/addresses/search'],
    ['post', '/api/v1/addresses/standardize'],
    ['get', '/api/v1/locations/regions'],
    ['get', '/api/v1/locations/districts/{regionId}'],
    ['get', '/api/v1/exchange-rates/current'],
    ['get', '/api/v1/exchange-rates/historical'],
    ['get', '/api/v1/exchange-rates/{currency}/trend'],
    ['post', '/api/v1/exchange-rates/convert'],
    ['get', '/api/v1/education/schools/statistics'],
    ['get', '/api/v1/crypto'],
  ])('%s %s documents a success schema', (method, path) => {
    expect(
      pick(successOf(method, path), 'content', 'application/json', 'schema'),
    ).toBeDefined();
  });

  it('documents /transport/directions as the success/data envelope', () => {
    expect(
      pick(
        successOf('get', '/api/v1/transport/directions'),
        'content',
        'application/json',
        'schema',
      ),
    ).toEqual({ $ref: '#/components/schemas/RouteDirectionsEnvelopeDto' });
    expect(
      pick(
        doc,
        'components',
        'schemas',
        'RouteDirectionsEnvelopeDto',
        'properties',
      ),
    ).toMatchObject({
      success: { type: 'boolean' },
      data: { $ref: '#/components/schemas/RouteDirectionsResponseDto' },
    });
  });

  it('marks the optional school fields nullable, because the API returns null for them', () => {
    for (const field of [
      'nickname',
      'email',
      'phone',
      'website',
      'boxAddress',
    ]) {
      expect(
        pick(doc, 'components', 'schemas', 'SchoolDto', 'properties', field),
      ).toMatchObject({ nullable: true });
    }
  });

  it('documents the crypto envelope, with the prices under data', () => {
    const schema = pick(
      successOf('get', '/api/v1/crypto'),
      'content',
      'application/json',
      'schema',
    ) as Record<string, unknown>;
    expect(
      pick(schema, 'properties', 'data', 'additionalProperties'),
    ).toBeDefined();
    expect(pick(schema, 'properties', 'source')).toMatchObject({
      type: 'string',
    });
    expect(pick(schema, 'properties', 'timestamp')).toBeDefined();
  });

  it('documents a nullable address lookup, because the API returns null when nothing is found', () => {
    const schema = pick(
      successOf('get', '/api/v1/addresses/lookup'),
      'content',
      'application/json',
      'schema',
    );
    expect(schema).toMatchObject({ nullable: true });
  });

  it('documents the stop type filter with the values the API accepts', () => {
    expect(stopTypeFilterEnum()).toEqual([
      'bus_stop',
      'stop_position',
      'platform',
      'station',
    ]);
  });

  it('does not list halt or tram_stop as stop types, because the filter rejects them', () => {
    expect(
      pick(doc, 'components', 'schemas', 'TransportStopDetailDto', 'enum'),
    ).toBeUndefined();
    expect(stopTypeFilterEnum()).not.toContain('halt');
    expect(stopTypeFilterEnum()).not.toContain('tram_stop');
  });
});
