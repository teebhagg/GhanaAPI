import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsService],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('getRegions', () => {
    it('should return all 16 regions of Ghana', () => {
      const regions = service.getRegions();

      expect(regions).toBeDefined();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBe(16);

      // Check structure of each region
      regions.forEach((region) => {
        expect(region).toHaveProperty('code');
        expect(region).toHaveProperty('label');
        expect(typeof region.code).toBe('string');
        expect(typeof region.label).toBe('string');
      });
    });

    it('should include major regions like Greater Accra and Ashanti', () => {
      const regions = service.getRegions();
      const regionCodes = regions.map((r) => r.code);
      const regionLabels = regions.map((r) => r.label);

      expect(regionCodes).toContain('GAR');
      expect(regionCodes).toContain('ASR'); // Ashanti Region code is ASR, not ASH
      expect(regionLabels).toContain('Greater Accra Region');
      expect(regionLabels).toContain('Ashanti Region');
    });

    it('should return consistent data on multiple calls', () => {
      const regions1 = service.getRegions();
      const regions2 = service.getRegions();

      expect(regions1).toEqual(regions2);
    });
  });

  describe('getDistricts', () => {
    it('should return districts for Greater Accra Region', () => {
      const districts = service.getDistricts('GAR');

      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);

      // Check structure of each district
      districts.forEach((district) => {
        expect(district).toHaveProperty('code');
        expect(district).toHaveProperty('label');
        expect(district).toHaveProperty('category');
        expect(district).toHaveProperty('capital');
        expect(typeof district.code).toBe('string');
        expect(typeof district.label).toBe('string');
        expect(typeof district.category).toBe('string');
        expect(typeof district.capital).toBe('string');
      });
    });

    it('should include Accra Metropolitan in Greater Accra Region', () => {
      const districts = service.getDistricts('GAR');
      const districtLabels = districts.map((d) => d.label);

      expect(districtLabels).toContain('Accra'); // District is called "Accra", not "Accra Metropolitan"
    });

    it('should return districts for Ashanti Region', () => {
      const districts = service.getDistricts('ASR'); // Use correct region code ASR instead of ASH

      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);

      const districtLabels = districts.map((d) => d.label);
      expect(districtLabels).toContain('Kumasi'); // District is called "Kumasi", not "Kumasi Metropolitan"
    });

    it('should return empty array for non-existent region', () => {
      const districts = service.getDistricts('INVALID');

      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBe(0);
    });

    it('should return different districts for different regions', () => {
      const garDistricts = service.getDistricts('GAR');
      const asrDistricts = service.getDistricts('ASR');

      expect(garDistricts).not.toEqual(asrDistricts);
      expect(garDistricts.length).toBeGreaterThan(0);
      expect(asrDistricts.length).toBeGreaterThan(0);
    });

    it('should handle case-sensitive region codes', () => {
      const districtsUpper = service.getDistricts('GAR');
      const districtsLower = service.getDistricts('gar');

      // Should be case-sensitive and return empty for lowercase
      expect(districtsUpper.length).toBeGreaterThan(0);
      expect(districtsLower.length).toBe(0);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
