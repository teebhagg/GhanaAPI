import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { BankSearchResponseDto } from './dto/bank-search-response.dto';
import { BankSearchQueryDto } from './dto/bank-search.dto';
import { BankDto } from './dto/bank.dto';

@ApiTags('Banking & ATM Locator')
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for banks and ATMs',
    description:
      'Search for banks and ATM locations by name, location, or type. Supports both text search and location-based proximity search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved banking facilities',
    type: BankSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async searchBanks(
    @Query() query: BankSearchQueryDto,
  ): Promise<BankSearchResponseDto> {
    try {
      // Validate location parameters
      if ((query.lat && !query.lng) || (!query.lat && query.lng)) {
        throw new HttpException(
          'Both latitude and longitude are required for location-based search',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.bankingService.searchBanks(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to search banking facilities',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('banks')
  @ApiOperation({
    summary: 'Get all banks',
    description: 'Retrieve all bank branches (excluding ATM-only locations)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all banks',
    type: [BankDto],
  })
  async getAllBanks(): Promise<BankDto[]> {
    try {
      return await this.bankingService.getAllBanks();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve banks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('atms')
  @ApiOperation({
    summary: 'Get all ATMs',
    description: 'Retrieve all ATM locations',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all ATMs',
    type: [BankDto],
  })
  async getAllATMs(): Promise<BankDto[]> {
    try {
      return await this.bankingService.getAllATMs();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve ATMs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('region/:region')
  @ApiOperation({
    summary: 'Get banks by region',
    description: 'Retrieve all banking facilities in a specific region',
  })
  @ApiParam({
    name: 'region',
    description: 'Region name (e.g., "Greater Accra", "Ashanti")',
    example: 'Greater Accra',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved banks in the region',
    type: [BankDto],
  })
  async getBanksByRegion(@Param('region') region: string): Promise<BankDto[]> {
    try {
      return await this.bankingService.getBanksByRegion(region);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve banks in region: ${region}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('city/:city')
  @ApiOperation({
    summary: 'Get banks by city',
    description: 'Retrieve all banking facilities in a specific city',
  })
  @ApiParam({
    name: 'city',
    description: 'City name (e.g., "Accra", "Kumasi")',
    example: 'Accra',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved banks in the city',
    type: [BankDto],
  })
  async getBanksByCity(@Param('city') city: string): Promise<BankDto[]> {
    try {
      return await this.bankingService.getBanksByCity(city);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve banks in city: ${city}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearest banks and ATMs',
    description: 'Find the nearest banking facilities to a specific location',
  })
  @ApiQuery({
    name: 'lat',
    type: 'number',
    description: 'Latitude coordinate',
    example: 5.6037,
  })
  @ApiQuery({
    name: 'lng',
    type: 'number',
    description: 'Longitude coordinate',
    example: -0.187,
  })
  @ApiQuery({
    name: 'radius',
    type: 'number',
    required: false,
    description: 'Search radius in kilometers (default: 5km, max: 50km)',
    example: 10,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Maximum number of results (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully found nearest banking facilities',
    type: [BankDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates provided',
  })
  async getNearestBanks(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ): Promise<BankDto[]> {
    try {
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new HttpException(
          'Valid latitude and longitude coordinates are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate coordinate ranges for Ghana
      if (lat < 4.5 || lat > 11.5 || lng < -3.5 || lng > 1.5) {
        throw new HttpException(
          'Coordinates appear to be outside Ghana. Please verify your location.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const safeRadius = Math.min(radius || 5, 50);
      const safeLimit = Math.min(limit || 10, 100);

      return await this.bankingService.getNearestBanks(
        lat,
        lng,
        safeRadius,
        safeLimit,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find nearest banking facilities',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
