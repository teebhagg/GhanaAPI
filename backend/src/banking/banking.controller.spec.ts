import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankSearchResponseDto } from './dto/bank-search-response.dto';
import { BankSearchQueryDto } from './dto/bank-search.dto';
import { BankDto } from './dto/bank.dto';

describe('BankingController', () => {
  let controller: BankingController;
  let service: BankingService;

  const mockBankingService = {
    searchBanks: jest.fn(),
    getAllBanks: jest.fn(),
    getAllATMs: jest.fn(),
    getBanksByRegion: jest.fn(),
    getBanksByCity: jest.fn(),
    getNearestBanks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankingController],
      providers: [
        {
          provide: BankingService,
          useValue: mockBankingService,
        },
      ],
    }).compile();

    controller = module.get<BankingController>(BankingController);
    service = module.get<BankingService>(BankingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBanks', () => {
    it('should return search results for valid query', async () => {
      const query: BankSearchQueryDto = {
        q: 'GCB',
        type: 'bank',
        limit: 10,
      };

      const mockResponse: BankSearchResponseDto = {
        success: true,
        data: [
          {
            id: 'gcb-1',
            name: 'GCB Bank Limited',
            type: 'bank',
            code: 'GCB',
            address: 'Thorpe Road, Accra',
            city: 'Accra',
            region: 'Greater Accra',
            latitude: 5.6037,
            longitude: -0.187,
          } as BankDto,
        ],
        total: 1,
        searchParams: {
          query: 'GCB',
          type: 'bank',
          limit: 10,
        },
        source: 'OpenStreetMap + Static Directory',
        timestamp: new Date().toISOString(),
      };

      mockBankingService.searchBanks.mockResolvedValue(mockResponse);

      const result = await controller.searchBanks(query);

      expect(service.searchBanks).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for invalid location parameters', async () => {
      const query: BankSearchQueryDto = {
        lat: 5.6037,
        // Missing lng
      };

      await expect(controller.searchBanks(query)).rejects.toThrow(
        new HttpException(
          'Both latitude and longitude are required for location-based search',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('getAllBanks', () => {
    it('should return all banks', async () => {
      const mockBanks: BankDto[] = [
        {
          id: 'gcb-1',
          name: 'GCB Bank Limited',
          type: 'bank',
          address: 'Thorpe Road, Accra',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.6037,
          longitude: -0.187,
        } as BankDto,
      ];

      mockBankingService.getAllBanks.mockResolvedValue(mockBanks);

      const result = await controller.getAllBanks();

      expect(service.getAllBanks).toHaveBeenCalled();
      expect(result).toEqual(mockBanks);
    });
  });

  describe('getAllATMs', () => {
    it('should return all ATMs', async () => {
      const mockATMs: BankDto[] = [
        {
          id: 'atm-1',
          name: 'GCB ATM',
          type: 'atm',
          address: 'Circle, Accra',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.5719,
          longitude: -0.231,
        } as BankDto,
      ];

      mockBankingService.getAllATMs.mockResolvedValue(mockATMs);

      const result = await controller.getAllATMs();

      expect(service.getAllATMs).toHaveBeenCalled();
      expect(result).toEqual(mockATMs);
    });
  });

  describe('getNearestBanks', () => {
    it('should return nearest banks for valid coordinates', async () => {
      const lat = 5.6037;
      const lng = -0.187;
      const radius = 10;
      const limit = 5;

      const mockBanks: BankDto[] = [
        {
          id: 'bank-1',
          name: 'Nearby Bank',
          type: 'bank',
          address: 'Near Location',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.604,
          longitude: -0.1875,
          distance: 0.5,
        } as BankDto,
      ];

      mockBankingService.getNearestBanks.mockResolvedValue(mockBanks);

      const result = await controller.getNearestBanks(lat, lng, radius, limit);

      expect(service.getNearestBanks).toHaveBeenCalledWith(lat, lng, 10, 5);
      expect(result).toEqual(mockBanks);
    });

    it('should throw error for coordinates outside Ghana', async () => {
      const lat = 51.5074; // London coordinates
      const lng = -0.1278;

      await expect(controller.getNearestBanks(lat, lng)).rejects.toThrow(
        new HttpException(
          'Coordinates appear to be outside Ghana. Please verify your location.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should apply radius and limit caps', async () => {
      const lat = 5.6037;
      const lng = -0.187;
      const radius = 100; // Should be capped at 50
      const limit = 200; // Should be capped at 100

      mockBankingService.getNearestBanks.mockResolvedValue([]);

      await controller.getNearestBanks(lat, lng, radius, limit);

      expect(service.getNearestBanks).toHaveBeenCalledWith(lat, lng, 50, 100);
    });
  });

  describe('getBanksByRegion', () => {
    it('should return banks for a specific region', async () => {
      const region = 'Greater Accra';
      const mockBanks: BankDto[] = [
        {
          id: 'bank-1',
          name: 'Accra Bank',
          type: 'bank',
          address: 'Accra Location',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.6037,
          longitude: -0.187,
        } as BankDto,
      ];

      mockBankingService.getBanksByRegion.mockResolvedValue(mockBanks);

      const result = await controller.getBanksByRegion(region);

      expect(service.getBanksByRegion).toHaveBeenCalledWith(region);
      expect(result).toEqual(mockBanks);
    });
  });

  describe('getBanksByCity', () => {
    it('should return banks for a specific city', async () => {
      const city = 'Accra';
      const mockBanks: BankDto[] = [
        {
          id: 'bank-1',
          name: 'Accra Bank',
          type: 'bank',
          address: 'Accra Location',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.6037,
          longitude: -0.187,
        } as BankDto,
      ];

      mockBankingService.getBanksByCity.mockResolvedValue(mockBanks);

      const result = await controller.getBanksByCity(city);

      expect(service.getBanksByCity).toHaveBeenCalledWith(city);
      expect(result).toEqual(mockBanks);
    });
  });
});
