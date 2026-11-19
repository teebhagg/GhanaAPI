import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { RegionDto } from './dto/region.dto';
import { DistrictDto } from './dto/district.dto';

@Controller('locations')
@ApiTags('Locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOkResponse({ description: 'All regions', type: [RegionDto] })
  @Get('regions')
  @ApiOperation({ summary: 'List all regions' })
  getRegions() {
    return this.locationsService.getRegions();
  }

  @ApiOkResponse({
    description: 'Districts of the region',
    type: [DistrictDto],
  })
  @Get('districts/:regionId')
  @ApiOperation({ summary: 'List districts for a region' })
  getDistricts(@Param('regionId') regionId: string) {
    return this.locationsService.getDistricts(regionId);
  }
}
