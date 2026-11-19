import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { StandardizeDto } from './dto/standardize.dto';
import { AddressDto } from './dto/address.dto';
import { AddressValidationDto } from './dto/address-validation.dto';
import { StandardizedAddressDto } from './dto/standardized-address.dto';

@Controller('addresses')
@ApiTags('Addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOkResponse({
    description: 'Format check of a digital code',
    type: AddressValidationDto,
  })
  @Get('validate/:code')
  @ApiOperation({
    summary: 'Validate Ghana Post Digital Address',
    description:
      'Validate a Ghana Post Digital Address code to ensure it is valid and exists in the database. - Inactive for now',
  })
  validateAddress(@Param('code') code: string) {
    return this.addressesService.validateDigitalCode(code);
  }

  @ApiOkResponse({
    description:
      'The nearest address, or null when neither geocoder finds one (the response body is then null)',
    schema: { nullable: true, allOf: [{ $ref: getSchemaPath(AddressDto) }] },
  })
  @Get('lookup')
  @ApiOperation({
    summary: 'Reverse geocoding nearest digital address',
    description:
      'Lookup the nearest digital address to a given latitude and longitude.',
  })
  lookupByCoordinates(@Query() query: LookupQueryDto) {
    return this.addressesService.lookupByCoordinates(query.lat, query.lng);
  }

  @ApiOkResponse({ description: 'Matching addresses', type: [AddressDto] })
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

  @ApiCreatedResponse({
    description: 'The standardised address',
    type: StandardizedAddressDto,
  })
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
