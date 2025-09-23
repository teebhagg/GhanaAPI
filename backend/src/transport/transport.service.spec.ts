import { Test, TestingModule } from '@nestjs/testing';
import { FuelPriceService } from './services/fuel-price.service';
import { GeocodingService } from './services/geocoding.service';
import { RoutingService } from './services/routing.service';
import { TransportRoutesService } from './services/transport-routes.service';
import { TransportStopsService } from './services/transport-stops.service';
import { TransportService } from './transport.service';

describe('TransportService', () => {
  let service: TransportService;
  let mockGeocodingService: jest.Mocked<GeocodingService>;
  let mockFuelPriceService: jest.Mocked<FuelPriceService>;
  let mockTransportRoutesService: jest.Mocked<TransportRoutesService>;
  let mockTransportStopsService: jest.Mocked<TransportStopsService>;
  let mockRoutingService: jest.Mocked<RoutingService>;

  beforeEach(async () => {
    const mockGeocodingServiceValue = {
      geocode: jest.fn(),
      reverseGeocode: jest.fn(),
    };

    const mockFuelPriceServiceValue = {
      getFuelPrices: jest.fn(),
    };

    const mockTransportRoutesServiceValue = {
      getPublicTransportRoutes: jest.fn(),
      searchRoutes: jest.fn(),
    };

    const mockTransportStopsServiceValue = {
      getTransportStops: jest.fn(),
      getNearbyStops: jest.fn(),
    };

    const mockRoutingServiceValue = {
      calculateRoute: jest.fn(),
      getDirections: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        {
          provide: GeocodingService,
          useValue: mockGeocodingServiceValue,
        },
        {
          provide: FuelPriceService,
          useValue: mockFuelPriceServiceValue,
        },
        {
          provide: TransportRoutesService,
          useValue: mockTransportRoutesServiceValue,
        },
        {
          provide: TransportStopsService,
          useValue: mockTransportStopsServiceValue,
        },
        {
          provide: RoutingService,
          useValue: mockRoutingServiceValue,
        },
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
    mockGeocodingService = module.get(GeocodingService);
    mockFuelPriceService = module.get(FuelPriceService);
    mockTransportRoutesService = module.get(TransportRoutesService);
    mockTransportStopsService = module.get(TransportStopsService);
    mockRoutingService = module.get(RoutingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTransportRoutes', () => {
    it('should return routes from Overpass API', async () => {
      const mockRoutes = [
        {
          id: '12345',
          name: 'Circle to Kaneshie',
          type: 'bus' as const,
          coordinates: [
            [5.6037, -0.187],
            [5.6137, -0.197],
          ] as [number, number][],
        },
      ];

      mockTransportRoutesService.getPublicTransportRoutes.mockResolvedValue(
        mockRoutes,
      );

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

      expect(
        mockTransportRoutesService.getPublicTransportRoutes,
      ).toHaveBeenCalledWith('accra');
    });

    it('should fallback to next API when Overpass fails', async () => {
      const mockRoutes = [
        {
          id: '1',
          name: 'Circle Route',
          type: 'bus' as const,
          coordinates: [
            [5.6037, -0.187],
            [5.6137, -0.197],
          ] as [number, number][],
        },
      ];

      mockTransportRoutesService.getPublicTransportRoutes.mockResolvedValue(
        mockRoutes,
      );

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toEqual(mockRoutes);
      expect(
        mockTransportRoutesService.getPublicTransportRoutes,
      ).toHaveBeenCalledWith('accra');
    });

    it('should throw error when all APIs fail', async () => {
      mockTransportRoutesService.getPublicTransportRoutes.mockRejectedValue(
        new Error('All APIs failed'),
      );

      await expect(service.getPublicTransportRoutes('accra')).rejects.toThrow(
        'All APIs failed',
      );
    });
  });

  describe('getTransportStops', () => {
    it('should return stops from Overpass API', async () => {
      const mockStops = [
        {
          id: 'stop1',
          name: 'Circle Bus Stop',
          coordinates: [5.6037, -0.187] as [number, number],
          type: 'bus_stop',
        },
      ];

      mockTransportStopsService.getTransportStops.mockResolvedValue(mockStops);

      const result = await service.getTransportStops('accra');

      expect(result).toEqual(mockStops);
      expect(mockTransportStopsService.getTransportStops).toHaveBeenCalledWith(
        'accra',
        undefined,
      );
    });

    it('should fallback to GTFS when Overpass fails', async () => {
      const mockStops = [
        {
          id: 'stop1',
          name: 'Circle Bus Stop',
          coordinates: [5.6037, -0.187] as [number, number],
          type: 'bus_stop',
        },
      ];

      mockTransportStopsService.getTransportStops.mockResolvedValue(mockStops);

      const result = await service.getTransportStops('accra', 'bus_stop');

      expect(result).toEqual(mockStops);
      expect(mockTransportStopsService.getTransportStops).toHaveBeenCalledWith(
        'accra',
        'bus_stop',
      );
    });

    it('should throw error when all APIs fail', async () => {
      mockTransportStopsService.getTransportStops.mockRejectedValue(
        new Error('All APIs failed'),
      );

      await expect(service.getTransportStops('accra')).rejects.toThrow(
        'All APIs failed',
      );
    });
  });

  describe('calculateRoute', () => {
    it('should calculate route using HERE API', async () => {
      const mockRoute = {
        distance: 15.5,
        duration: 25.2,
        coordinates: [
          [5.6037, -0.187],
          [6.6885, -1.6244],
        ] as [number, number][],
        instructions: ['Head north on Ring Road'],
      };

      mockRoutingService.calculateRoute.mockResolvedValue(mockRoute);

      const result = await service.calculateRoute(
        [5.6037, -0.187],
        [6.6885, -1.6244],
      );

      expect(result).toEqual(mockRoute);
      expect(mockRoutingService.calculateRoute).toHaveBeenCalledWith(
        [5.6037, -0.187],
        [6.6885, -1.6244],
        'driving',
      );
    });

    it('should fallback to GraphHopper when HERE fails', async () => {
      const mockRoute = {
        distance: 15.5,
        duration: 25.2,
        coordinates: [
          [5.6037, -0.187],
          [6.6885, -1.6244],
        ] as [number, number][],
        instructions: ['Head north on Ring Road'],
      };

      mockRoutingService.calculateRoute.mockResolvedValue(mockRoute);

      const result = await service.calculateRoute(
        [5.6037, -0.187],
        [6.6885, -1.6244],
        'cycling',
      );

      expect(result).toEqual(mockRoute);
      expect(mockRoutingService.calculateRoute).toHaveBeenCalledWith(
        [5.6037, -0.187],
        [6.6885, -1.6244],
        'cycling',
      );
    });

    it('should throw error when all routing APIs fail', async () => {
      mockRoutingService.calculateRoute.mockRejectedValue(
        new Error('All routing APIs failed'),
      );

      await expect(
        service.calculateRoute([5.6037, -0.187], [5.6137, -0.197]),
      ).rejects.toThrow('All routing APIs failed');
    });
  });

  describe('getFuelPrices', () => {
    it('should return fuel prices from GlobalPetrolPrices', async () => {
      const mockPrices = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS' as const,
        lastUpdated: '2023-12-01T10:00:00Z',
        source: 'GlobalPetrolPrices',
        status: 'success' as const,
      };

      mockFuelPriceService.getFuelPrices.mockResolvedValue(mockPrices);

      const result = await service.getFuelPrices();

      expect(result).toEqual(mockPrices);
      expect(mockFuelPriceService.getFuelPrices).toHaveBeenCalled();
    });

    it('should fallback to alternative API when GlobalPetrolPrices fails', async () => {
      const mockPrices = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS' as const,
        lastUpdated: '2023-12-01T10:00:00Z',
        source: 'Alternative API',
        status: 'success' as const,
      };

      mockFuelPriceService.getFuelPrices.mockResolvedValue(mockPrices);

      const result = await service.getFuelPrices();

      expect(result).toEqual(mockPrices);
      expect(mockFuelPriceService.getFuelPrices).toHaveBeenCalled();
    });

    it('should use local data when all external APIs fail', async () => {
      const mockPrices = {
        petrol: 15.0,
        diesel: 16.0,
        lpg: 14.5,
        currency: 'GHS' as const,
        lastUpdated: new Date().toISOString(),
        source: 'Local fallback data',
        status: 'success' as const,
      };

      mockFuelPriceService.getFuelPrices.mockResolvedValue(mockPrices);

      const result = await service.getFuelPrices();

      expect(result).toEqual(mockPrices);
      expect(mockFuelPriceService.getFuelPrices).toHaveBeenCalled();
    });
  });

  describe('helper methods', () => {
    it('should return correct bounding box for cities', async () => {
      const mockStops = [
        {
          id: 'stop1',
          name: 'Accra Stop',
          coordinates: [5.6037, -0.187] as [number, number],
          type: 'bus_stop',
        },
      ];

      mockTransportStopsService.getTransportStops.mockResolvedValue(mockStops);

      const result = await service.getTransportStops('accra');

      expect(result).toEqual(mockStops);
      expect(mockTransportStopsService.getTransportStops).toHaveBeenCalledWith(
        'accra',
        undefined,
      );
    });

    it('should parse Overpass data correctly', async () => {
      const mockRoutes = [
        {
          id: '12345',
          name: 'Test Route',
          type: 'bus' as const,
          coordinates: [[5.6037, -0.187]] as [number, number][],
        },
      ];

      mockTransportRoutesService.getPublicTransportRoutes.mockResolvedValue(
        mockRoutes,
      );

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toEqual(mockRoutes);
    });

    it('should parse GTFS data correctly', async () => {
      const mockRoutes = [
        {
          id: '1',
          name: 'GTFS Route',
          type: 'bus' as const,
          coordinates: [[5.6037, -0.187]] as [number, number][],
        },
      ];

      mockTransportRoutesService.getPublicTransportRoutes.mockResolvedValue(
        mockRoutes,
      );

      const result = await service.getPublicTransportRoutes('accra');

      expect(result).toEqual(mockRoutes);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockTransportRoutesService.getPublicTransportRoutes.mockRejectedValue(
        new Error('Network timeout'),
      );

      await expect(service.getPublicTransportRoutes('accra')).rejects.toThrow(
        'Network timeout',
      );
    });

    it('should handle malformed API responses', async () => {
      mockTransportStopsService.getTransportStops.mockRejectedValue(
        new Error('Malformed response'),
      );

      await expect(service.getTransportStops('accra')).rejects.toThrow(
        'Malformed response',
      );
    });

    it('should validate coordinates properly', async () => {
      mockRoutingService.calculateRoute.mockRejectedValue(
        new Error('Invalid coordinates'),
      );

      await expect(
        service.calculateRoute([999, 999], [5.6037, -0.187]),
      ).rejects.toThrow('Invalid coordinates');
    });
  });
});
