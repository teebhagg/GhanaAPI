import { Injectable } from '@nestjs/common';
import { DistrictDto } from './dto/district.dto';
import { RegionDto } from './dto/region.dto';
import { regions } from './data/regions.json';

@Injectable()
export class LocationsService {
  getRegions(): RegionDto[] {
    return regions.map((r) => ({ code: r.code, label: r.label }));
  }

  getDistricts(regionId: string): DistrictDto[] {
    let districts: DistrictDto[] = [];
    for (const region of regions) {
      if (region.code === regionId) {
        districts = region.districts.map((d) => ({
          code: d.code,
          label: d.label,
          category: d.category,
          capital: d.capital,
        }));
      }
    }
    return districts;
  }
}
