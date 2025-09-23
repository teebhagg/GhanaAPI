import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationsService;

  const mockLocationsService = {
    getRegions: jest.fn(),
    getDistricts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationsService>(LocationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRegions', () => {
    it('should return all regions', () => {
      const mockRegions = [
        { code: 'GAR', label: 'Greater Accra Region' },
        { code: 'ASH', label: 'Ashanti Region' },
        { code: 'WR', label: 'Western Region' },
      ];

      mockLocationsService.getRegions.mockReturnValue(mockRegions);

      const result = controller.getRegions();

      expect(service.getRegions).toHaveBeenCalled();
      expect(result).toEqual(mockRegions);
    });

    it('should handle empty regions response', () => {
      mockLocationsService.getRegions.mockReturnValue([]);

      const result = controller.getRegions();

      expect(service.getRegions).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getDistricts', () => {
    it('should return districts for a specific region', () => {
      const mockDistricts = [
        {
          code: 'AMA',
          label: 'Accra Metropolitan',
          category: 'Metropolitan',
          capital: 'Accra',
        },
        {
          code: 'TEMA',
          label: 'Tema Metropolitan',
          category: 'Metropolitan',
          capital: 'Tema',
        },
      ];

      mockLocationsService.getDistricts.mockReturnValue(mockDistricts);

      const result = controller.getDistricts('GAR');

      expect(service.getDistricts).toHaveBeenCalledWith('GAR');
      expect(result).toEqual(mockDistricts);
    });

    it('should handle non-existent region code', () => {
      mockLocationsService.getDistricts.mockReturnValue([]);

      const result = controller.getDistricts('INVALID');

      expect(service.getDistricts).toHaveBeenCalledWith('INVALID');
      expect(result).toEqual([]);
    });

    it('should handle different region codes correctly', () => {
      const ashDistricts = [
        {
          code: 'KMA',
          label: 'Kumasi Metropolitan',
          category: 'Metropolitan',
          capital: 'Kumasi',
        },
      ];

      mockLocationsService.getDistricts.mockReturnValue(ashDistricts);

      const result = controller.getDistricts('ASH');

      expect(service.getDistricts).toHaveBeenCalledWith('ASH');
      expect(result).toEqual(ashDistricts);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
