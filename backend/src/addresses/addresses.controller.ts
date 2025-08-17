import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { StandardizeDto } from './dto/standardize.dto';

@Controller('addresses')
@ApiTags('Addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get('validate/:code')
  @ApiOperation({
    summary: 'Validate Ghana Post Digital Address',
    description:
      'Validate a Ghana Post Digital Address code to ensure it is valid and exists in the database. - Inactive for now',
  })
  validateAddress(@Param('code') code: string) {
    return this.addressesService.validateDigitalCode(code);
  }

  @Get('lookup')
  @ApiOperation({
    summary: 'Reverse geocoding nearest digital address',
    description:
      'Lookup the nearest digital address to a given latitude and longitude.',
  })
  lookupByCoordinates(@Query() query: LookupQueryDto) {
    return this.addressesService.lookupByCoordinates(query.lat, query.lng);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search addresses and digital codes',
    description:
      'Search for addresses and digital codes by keyword or partial match.',
  })
  @ApiQuery({ name: 'q', required: true })
  search(@Query() query: SearchQueryDto) {
    return this.addressesService.searchAddresses(query.q);
  }

  @Post('standardize')
  @ApiOperation({
    summary: 'Standardize a raw address string',
    description:
      'Standardize a raw address string to ensure it is in a consistent format. - Inactive for now',
  })
  standardize(@Body() body: StandardizeDto) {
    return this.addressesService.standardizeAddress(body.rawAddress);
  }
}
