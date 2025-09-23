import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { AddressesService } from './addresses.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AddressesService', () => {
  let service: AddressesService;
  let mockCacheManager: jest.Mocked<any>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDigitalCode', () => {
    it('should validate correct digital codes', () => {
      const validCodes = ['GA-123-4567', 'WR-456-7890', 'ASH-789-0123'];

      validCodes.forEach((code) => {
        const result = service.validateDigitalCode(code);
        expect(result.isValid).toBe(true);
        expect(result.digitalCode).toBe(code);
      });
    });

    it('should reject invalid digital codes', () => {
      const invalidCodes = [
        'invalid',
        'GA-12-4567', // too few digits in middle
        'GA-1234-567', // too few digits at end
        'G-123-4567', // too few letters at start
        'GA123-4567', // missing hyphen
        'ga-123-4567', // lowercase (should be converted to uppercase)
      ];

      invalidCodes.forEach((code) => {
        const result = service.validateDigitalCode(code);
        if (code === 'ga-123-4567') {
          // This should be valid after conversion to uppercase
          expect(result.isValid).toBe(true);
          expect(result.digitalCode).toBe('GA-123-4567');
        } else {
          expect(result.isValid).toBe(false);
        }
      });
    });

    it('should handle empty or whitespace codes', () => {
      const result1 = service.validateDigitalCode('');
      const result2 = service.validateDigitalCode('   ');

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('lookupByCoordinates', () => {
    it('should return cached result if available', async () => {
      const mockAddress = {
        digitalCode: '',
        addressLine1: 'Test Address',
        addressLine2: '',
        latitude: 5.6037,
        longitude: -0.187,
        postalCode: undefined,
      };

      mockCacheManager.get.mockResolvedValue(mockAddress);

      const result = await service.lookupByCoordinates(5.6037, -0.187);

      expect(result).toEqual(mockAddress);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'addr:rev:5.6037:-0.187',
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from nominatim when not cached', async () => {
      const mockNominatimResponse = {
        data: {
          display_name: 'Test Location, Accra, Ghana',
          lat: '5.6037',
          lon: '-0.187',
          address: {
            postcode: '00233',
          },
        },
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockNominatimResponse);

      const result = await service.lookupByCoordinates(5.6037, -0.187);

      expect(result).toEqual({
        digitalCode: '',
        addressLine1: 'Test Location, Accra, Ghana',
        addressLine2: '',
        latitude: 5.6037,
        longitude: -0.187,
        postalCode: '00233',
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'addr:rev:5.6037:-0.187',
        expect.any(Object),
        24 * 60 * 60,
      );
    });

    it('should handle nominatim API failures', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.lookupByCoordinates(5.6037, -0.187)).rejects.toThrow(
        'API Error',
      );
    });

    it('should return null for empty nominatim response', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: null });

      const result = await service.lookupByCoordinates(5.6037, -0.187);

      expect(result).toBeNull();
    });
  });

  describe('searchAddresses', () => {
    it('should return empty array for empty query', async () => {
      const result = await service.searchAddresses('');
      expect(result).toEqual([]);

      const result2 = await service.searchAddresses('   ');
      expect(result2).toEqual([]);
    });

    it('should return cached results if available', async () => {
      const mockResults = [
        {
          digitalCode: '',
          addressLine1: 'Accra, Ghana',
          addressLine2: '',
          latitude: 5.6037,
          longitude: -0.187,
          postalCode: undefined,
        },
      ];

      mockCacheManager.get.mockResolvedValue(mockResults);

      const result = await service.searchAddresses('Accra');

      expect(result).toEqual(mockResults);
      expect(mockCacheManager.get).toHaveBeenCalledWith('addr:search:Accra');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from nominatim and cache results', async () => {
      const mockNominatimResponse = {
        data: [
          {
            display_name: 'Accra, Greater Accra Region, Ghana',
            lat: '5.6037',
            lon: '-0.187',
            address: { postcode: '00233' },
          },
          {
            display_name: 'Kumasi, Ashanti Region, Ghana',
            lat: '6.6885',
            lon: '-1.6244',
            address: {},
          },
        ],
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockNominatimResponse);

      const result = await service.searchAddresses('Ghana');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        digitalCode: '',
        addressLine1: 'Accra, Greater Accra Region, Ghana',
        addressLine2: '',
        latitude: 5.6037,
        longitude: -0.187,
        postalCode: '00233',
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'addr:search:Ghana',
        expect.any(Array),
        24 * 60 * 60,
      );
    });

    it('should handle non-array nominatim responses', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: 'not an array' });

      const result = await service.searchAddresses('test');

      expect(result).toEqual([]);
    });
  });

  describe('standardizeAddress', () => {
    it('should extract digital code from address', () => {
      const rawAddress = 'Some street, GA-123-4567, Accra';
      const result = service.standardizeAddress(rawAddress);

      expect(result.digitalCode).toBe('GA-123-4567');
      expect(result.addressLine1).toBe('Some street, GA-123-4567, Accra');
    });

    it('should handle address without digital code', () => {
      const rawAddress = 'Some street, Accra, Ghana';
      const result = service.standardizeAddress(rawAddress);

      expect(result.digitalCode).toBeUndefined();
      expect(result.addressLine1).toBe('Some street, Accra, Ghana');
    });

    it('should clean up whitespace', () => {
      const rawAddress = '  Some   street,    Accra  ';
      const result = service.standardizeAddress(rawAddress);

      expect(result.addressLine1).toBe('Some street, Accra');
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
