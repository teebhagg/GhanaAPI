import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RouteProfile } from './dto/route-directions.dto';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

describe('TransportController', () => {
  let controller: TransportController;
  let mockTransportService: jest.Mocked<TransportService>;

  beforeEach(async () => {
    mockTransportService = {
      getTransportStops: jest.fn(),
      calculateRoute: jest.fn(),
      getFuelPrices: jest.fn(),
      getPublicTransportRoutes: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportController],
      providers: [
        {
          provide: TransportService,
          useValue: mockTransportService,
        },
      ],
    }).compile();

    controller = module.get<TransportController>(TransportController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStops', () => {
    it('should return transport stops for default city (Accra)', async () => {
      const mockStops = [
        {
          id: 'stop1',
          name: 'Circle Bus Stop',
          coordinates: [5.6037, -0.187] as [number, number],
          type: 'bus_stop',
        },
        {
          id: 'stop2',
          name: 'Kaneshie Market',
          coordinates: [5.55, -0.25] as [number, number],
          type: 'station',
        },
      ];

      mockTransportService.getTransportStops.mockResolvedValue(mockStops);

      const result = await controller.getStops();

      expect(mockTransportService.getTransportStops).toHaveBeenCalledWith(
        'accra',
        undefined,
      );
      expect(result).toEqual({
        success: true,
        data: mockStops,
        count: mockStops.length,
        city: 'accra',
      });
    });

    it('should return transport stops for specified city and type', async () => {
      const mockStops = [
        {
          id: 'stop3',
          name: 'Kumasi Central Station',
          coordinates: [6.6885, -1.6244] as [number, number],
          type: 'station',
        },
      ];

      mockTransportService.getTransportStops.mockResolvedValue(mockStops);

      const result = await controller.getStops('kumasi', 'station');

      expect(mockTransportService.getTransportStops).toHaveBeenCalledWith(
        'kumasi',
        'station',
      );
      expect(result).toEqual({
        success: true,
        data: mockStops,
        count: mockStops.length,
        city: 'kumasi',
        type: 'station',
      });
    });

    it('should handle service errors gracefully', async () => {
      mockTransportService.getTransportStops.mockRejectedValue(
        new Error('Service unavailable'),
      );

      await expect(controller.getStops()).rejects.toThrow(HttpException);
    });
  });

  describe('getNearbyStops', () => {
    it('should find nearby transport stops', async () => {
      const mockStops = [
        {
          id: 'stop1',
          name: 'Circle Bus Stop',
          coordinates: [5.6037, -0.187] as [number, number],
          type: 'bus_stop',
          distance: 150,
        },
      ];

      mockTransportService.getTransportStops.mockResolvedValue(mockStops);

      const result = await controller.getNearbyStops(5.6037, -0.187);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle invalid coordinates', async () => {
      const invalidLat = 200; // Invalid latitude
      const validLng = -0.187;

      await expect(
        controller.getNearbyStops(invalidLat, validLng),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('calculateRoute', () => {
    it('should calculate route between two coordinates', async () => {
      const mockRoute = {
        distance: 15.5,
        duration: 25.2,
        coordinates: [
          [5.6037, -0.187],
          [6.6885, -1.6244],
        ] as [number, number][],
        instructions: ['Head north on Ring Road'],
      };

      mockTransportService.calculateRoute.mockResolvedValue(mockRoute);

      const result = await controller.calculateRoute(
        5.6037,
        -0.187,
        6.6885,
        -1.6244,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoute);
    });

    it('should handle invalid coordinates', async () => {
      const invalidStartLat = 0; // Outside Ghana boundaries
      const validStartLng = -0.187;
      const validEndLat = 6.6885;
      const validEndLng = -1.6244;

      await expect(
        controller.calculateRoute(
          invalidStartLat,
          validStartLng,
          validEndLat,
          validEndLng,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getRouteDirections', () => {
    it('should get route directions using query parameters', async () => {
      const mockDirections = {
        start: [5.6037, -0.187] as [number, number],
        end: [6.6885, -1.6244] as [number, number],
        profile: 'driving-car',
        distance: 250.5,
        duration: 180.2,
        estimated_cost: 120.5,
      };

      // Mock the service method if it exists
      const mockServiceDirections = jest.fn().mockResolvedValue(mockDirections);
      (controller as any).transportService = {
        ...mockTransportService,
        getRouteDirections: mockServiceDirections,
      };

      const query = {
        start_lat: 5.6037,
        start_lng: -0.187,
        end_lat: 6.6885,
        end_lng: -1.6244,
        profile: RouteProfile.DRIVING_CAR,
      };

      const result = await controller.getRouteDirections(query);

      expect(result.success).toBe(true);
    });
  });

  describe('estimateTravelCost', () => {
    it('should estimate travel cost for driving', async () => {
      const mockFuelPrices = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS',
        lastUpdated: '2023-12-01T10:00:00Z',
        source: 'NPA',
        status: 'success' as const,
      };

      mockTransportService.getFuelPrices.mockResolvedValue(mockFuelPrices);

      const result = await controller.estimateTravelCost(25.5, 'car', 10.5);

      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('car');
      expect(result.data.distance).toBe(25.5);
      expect(typeof result.data.fuelCost).toBe('number');
    });

    it('should estimate cost for public transport', async () => {
      const mockFuelPrices = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS',
        lastUpdated: '2023-12-01T10:00:00Z',
        source: 'NPA',
        status: 'success' as const,
      };

      mockTransportService.getFuelPrices.mockResolvedValue(mockFuelPrices);

      const result = await controller.estimateTravelCost(15.2, 'trotro');

      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('trotro');
      expect(result.data.distance).toBe(15.2);
      expect(typeof result.data.estimatedFare).toBe('number');
    });
  });

  describe('getFuelPrices', () => {
    it('should return current fuel prices', async () => {
      const mockPrices = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS',
        lastUpdated: '2023-12-01T10:00:00Z',
        source: 'National Petroleum Authority (NPA)',
        status: 'success' as const,
      };

      mockTransportService.getFuelPrices.mockResolvedValue(mockPrices);

      const result = await controller.getFuelPrices();

      expect(mockTransportService.getFuelPrices).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPrices);
    });

    it('should handle service errors gracefully', async () => {
      mockTransportService.getFuelPrices.mockRejectedValue(
        new Error('Unable to fetch fuel prices'),
      );

      await expect(controller.getFuelPrices()).rejects.toThrow(HttpException);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
