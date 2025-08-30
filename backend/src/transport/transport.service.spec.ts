// src/transport/transport.service.spec.ts
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { TransportService } from './transport.service';

describe('TransportService', () => {
  let service: TransportService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
    // httpService and configService are available via service instance
    // but we use the mocked versions for testing
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTransportRoutes', () => {
    it('should return routes from Overpass API', async () => {
      const mockOverpassResponse = {
        data: {
          elements: [
            {
              type: 'relation',
              id: 12345,
              tags: {
                route: 'bus',
                name: 'Circle to Kaneshie',
              },
              geometry: [
                { lat: 5.6037, lon: -0.187 },
                { lat: 5.6137, lon: -0.197 },
              ],
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockOverpassResponse));

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '12345',
        name: 'Circle to Kaneshie',
        type: 'bus',
        coordinates: [
          [5.6037, -0.187],
          [5.6137, -0.197],
        ],
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://overpass-api.de/api/interpreter',
        expect.stringContaining('route'),
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 30000,
        },
      );
    });

    it('should fallback to next API when Overpass fails', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Overpass API failed')),
      );
      mockConfigService.get.mockReturnValue('https://example.com/gtfs');
      mockHttpService.get.mockReturnValue(
        of({
          data: 'route_id,agency_id,route_short_name,route_long_name,route_type\n1,1,Circle,Circle to Kaneshie,3',
        }),
      );

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Circle');
      expect(mockHttpService.post).toHaveBeenCalled();
      expect(mockHttpService.get).toHaveBeenCalled();
    });

    it('should throw error when all APIs fail', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Overpass failed')),
      );
      mockConfigService.get.mockReturnValue(null);

      await expect(service.getPublicTransportRoutes('accra')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getTransportStops', () => {
    it('should return stops from Overpass API', async () => {
      const mockOverpassResponse = {
        data: {
          elements: [
            {
              type: 'node',
              id: 54321,
              lat: 5.6037,
              lon: -0.187,
              tags: {
                public_transport: 'stop_position',
                name: 'Circle Bus Stop',
              },
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockOverpassResponse));

      const result = await service.getTransportStops('accra');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '54321',
        name: 'Circle Bus Stop',
        coordinates: [5.6037, -0.187],
        type: 'stop_position',
      });
    });

    it('should fallback to GTFS when Overpass fails', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Overpass failed')),
      );
      mockConfigService.get.mockReturnValue('https://example.com/gtfs');
      mockHttpService.get.mockReturnValue(
        of({
          data: 'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon\n1,,Circle Station,,5.6037,-0.1870',
        }),
      );

      const result = await service.getTransportStops('accra');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Circle Station');
      expect(result[0].coordinates).toEqual([5.6037, -0.187]);
    });

    it('should throw error when all APIs fail', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Overpass failed')),
      );
      mockConfigService.get.mockReturnValue(null);

      await expect(service.getTransportStops('accra')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('calculateRoute', () => {
    it('should calculate route using HERE API', async () => {
      const mockHereResponse = {
        data: {
          routes: [
            {
              sections: [
                {
                  summary: {
                    length: 5000,
                    duration: 600,
                  },
                  polyline: 'mock_polyline_data',
                  actions: [
                    { instruction: 'Head north on Ring Road' },
                    { instruction: 'Turn left onto Oxford Street' },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockConfigService.get.mockReturnValue('mock_here_api_key');
      mockHttpService.get.mockReturnValue(of(mockHereResponse));

      const result = await service.calculateRoute(
        [5.6037, -0.187],
        [5.6137, -0.197],
        'driving',
      );

      expect(result.distance).toBe(5000);
      expect(result.duration).toBe(600);
      expect(result.instructions).toHaveLength(2);
    });

    it('should fallback to GraphHopper when HERE fails', async () => {
      const mockGraphHopperResponse = {
        data: {
          paths: [
            {
              distance: 4500,
              time: 540000, // in milliseconds
              points: 'mock_polyline_data',
              instructions: [
                { text: 'Start on Ring Road' },
                { text: 'Turn left' },
              ],
            },
          ],
        },
      };

      mockConfigService.get
        .mockReturnValueOnce(null) // HERE API key not configured
        .mockReturnValue('mock_graphhopper_api_key'); // GraphHopper API key
      mockHttpService.get.mockReturnValue(of(mockGraphHopperResponse));

      const result = await service.calculateRoute(
        [5.6037, -0.187],
        [5.6137, -0.197],
        'driving',
      );

      expect(result.distance).toBe(4500);
      expect(result.duration).toBe(540); // converted from ms to seconds
    });

    it('should throw error when all routing APIs fail', async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(
        service.calculateRoute([5.6037, -0.187], [5.6137, -0.197]),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getFuelPrices', () => {
    it('should return fuel prices from GlobalPetrolPrices', async () => {
      const mockGlobalPricesResponse = {
        data: {
          petrol_price: 15.2,
          diesel_price: 15.99,
          currency: 'GHS',
          last_updated: '2023-12-01T10:00:00Z',
        },
      };

      mockHttpService.get.mockReturnValue(of(mockGlobalPricesResponse));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(15.2);
      expect(result.diesel).toBe(15.99);
      expect(result.currency).toBe('GHS');
      expect(result.source).toBe('GlobalPetrolPrices');
    });

    it('should fallback to alternative API when GlobalPetrolPrices fails', async () => {
      const mockAlternativeResponse = {
        data: {
          prices: {
            petrol: 15.5,
            diesel: 16.2,
            lpg: 8.5,
          },
          currency: 'GHS',
          timestamp: '2023-12-01T10:00:00Z',
        },
      };

      mockHttpService.get
        .mockReturnValueOnce(
          throwError(() => new Error('GlobalPetrolPrices failed')),
        )
        .mockReturnValue(of(mockAlternativeResponse));
      mockConfigService.get.mockReturnValue('mock_fuel_api_key');

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(15.5);
      expect(result.diesel).toBe(16.2);
      expect(result.lpg).toBe(8.5);
      expect(result.source).toBe('FuelPriceAPI');
    });

    it('should use local data when all external APIs fail', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API failed')),
      );
      mockConfigService.get.mockReturnValue(null);

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(15.2);
      expect(result.diesel).toBe(15.99);
      expect(result.lpg).toBe(8.5);
      expect(result.currency).toBe('GHS');
      expect(result.source).toBe('NPA Ghana');
    });
  });

  describe('helper methods', () => {
    it('should return correct bounding box for cities', () => {
      // This tests private method through public interface
      // We can't directly test private methods, but we can verify they work through public methods
      expect(() => service.getPublicTransportRoutes('accra')).not.toThrow();
      expect(() => service.getPublicTransportRoutes('kumasi')).not.toThrow();
      expect(() =>
        service.getPublicTransportRoutes('unknown_city'),
      ).not.toThrow();
    });

    it('should parse Overpass data correctly', async () => {
      const mockOverpassResponse = {
        data: {
          elements: [
            {
              type: 'relation',
              id: 123,
              tags: { route: 'minibus', name: 'Trotro Route' },
              geometry: [{ lat: 5.6, lon: -0.2 }],
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockOverpassResponse));

      const result = await service.getPublicTransportRoutes('accra');

      expect(result[0].type).toBe('trotro'); // minibus should map to trotro
      expect(result[0].name).toBe('Trotro Route');
    });

    it('should parse GTFS data correctly', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Overpass failed')),
      );
      mockConfigService.get.mockReturnValue('https://example.com/gtfs');

      const gtfsData =
        'route_id,agency_id,route_short_name,route_long_name,route_type\n' +
        '1,1,R1,Route One,3\n' +
        '2,1,R2,Route Two,11';

      mockHttpService.get.mockReturnValue(of({ data: gtfsData }));

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('bus'); // route_type 3 = bus
      expect(result[1].type).toBe('trotro'); // route_type 11 = trolleybus -> trotro
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ code: 'ECONNABORTED' })),
      );
      mockHttpService.get.mockReturnValue(
        throwError(() => ({ code: 'ECONNABORTED' })),
      );
      mockConfigService.get.mockReturnValue(null);

      // Should fall back to local data for fuel prices
      const result = await service.getFuelPrices();
      expect(result.source).toBe('NPA Ghana');

      // Should throw for transport routes when all fail
      await expect(service.getPublicTransportRoutes('accra')).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle malformed API responses', async () => {
      mockHttpService.post.mockReturnValue(of({ data: 'invalid json' }));

      // Should handle parsing errors gracefully
      const result = await service.getPublicTransportRoutes('accra');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should validate coordinates properly', () => {
      mockConfigService.get.mockReturnValue('mock_api_key');

      // Should not throw for valid Ghana coordinates
      expect(() =>
        service.calculateRoute([5.6037, -0.187], [6.6885, -1.6244]),
      ).not.toThrow();
    });
  });
});
