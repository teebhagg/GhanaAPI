import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: AddressesService;

  const mockAddressesService = {
    validateDigitalCode: jest.fn(),
    lookupByCoordinates: jest.fn(),
    searchAddresses: jest.fn(),
    standardizeAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
      ],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAddress', () => {
    it('should validate a digital address code', () => {
      const mockResult = { isValid: true, digitalCode: 'GA-123-4567' };
      mockAddressesService.validateDigitalCode.mockReturnValue(mockResult);

      const result = controller.validateAddress('GA-123-4567');

      expect(service.validateDigitalCode).toHaveBeenCalledWith('GA-123-4567');
      expect(result).toEqual(mockResult);
    });

    it('should handle invalid codes', () => {
      const mockResult = { isValid: false, digitalCode: 'INVALID' };
      mockAddressesService.validateDigitalCode.mockReturnValue(mockResult);

      const result = controller.validateAddress('invalid');

      expect(service.validateDigitalCode).toHaveBeenCalledWith('invalid');
      expect(result).toEqual(mockResult);
    });
  });

  describe('lookupByCoordinates', () => {
    it('should lookup address by coordinates', async () => {
      const mockAddress = {
        digitalCode: '',
        addressLine1: 'Test Address, Accra, Ghana',
        addressLine2: '',
        latitude: 5.6037,
        longitude: -0.187,
        postalCode: undefined,
      };

      mockAddressesService.lookupByCoordinates.mockResolvedValue(mockAddress);

      const query = { lat: 5.6037, lng: -0.187 };
      const result = await controller.lookupByCoordinates(query);

      expect(service.lookupByCoordinates).toHaveBeenCalledWith(5.6037, -0.187);
      expect(result).toEqual(mockAddress);
    });

    it('should handle coordinates with no address found', async () => {
      mockAddressesService.lookupByCoordinates.mockResolvedValue(null);

      const query = { lat: 0.0, lng: 0.0 };
      const result = await controller.lookupByCoordinates(query);

      expect(service.lookupByCoordinates).toHaveBeenCalledWith(0.0, 0.0);
      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search for addresses', async () => {
      const mockResults = [
        {
          digitalCode: '',
          addressLine1: 'Accra, Greater Accra Region, Ghana',
          addressLine2: '',
          latitude: 5.6037,
          longitude: -0.187,
          postalCode: undefined,
        },
      ];

      mockAddressesService.searchAddresses.mockResolvedValue(mockResults);

      const query = { q: 'Accra' };
      const result = await controller.search(query);

      expect(service.searchAddresses).toHaveBeenCalledWith('Accra');
      expect(result).toEqual(mockResults);
    });

    it('should handle empty search results', async () => {
      mockAddressesService.searchAddresses.mockResolvedValue([]);

      const query = { q: 'nonexistent' };
      const result = await controller.search(query);

      expect(service.searchAddresses).toHaveBeenCalledWith('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('standardize', () => {
    it('should standardize an address', () => {
      const mockResult = {
        digitalCode: 'GA-123-4567',
        addressLine1: 'Test Street, GA-123-4567, Accra',
      };

      mockAddressesService.standardizeAddress.mockReturnValue(mockResult);

      const body = { rawAddress: 'Test Street, GA-123-4567, Accra' };
      const result = controller.standardize(body);

      expect(service.standardizeAddress).toHaveBeenCalledWith(
        'Test Street, GA-123-4567, Accra',
      );
      expect(result).toEqual(mockResult);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
