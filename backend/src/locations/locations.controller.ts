import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@Controller('locations')
@ApiTags('Locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('regions')
  @ApiOperation({ summary: 'List all regions' })
  getRegions() {
    return this.locationsService.getRegions();
  }

  @Get('districts/:regionId')
  @ApiOperation({ summary: 'List districts for a region' })
  getDistricts(@Param('regionId') regionId: string) {
    return this.locationsService.getDistricts(regionId);
  }
}
