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
import { SchoolSearchResponseDto } from './dto/school-search-response.dto';
import { SchoolSearchDto } from './dto/school-search.dto';
import { SchoolDto } from './dto/school.dto';
import { EducationService } from './education.service';
import { SchoolCategory, SchoolGrade } from './entities/school.entity';

@ApiTags('Education')
@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Get('schools/search')
  @ApiOperation({
    summary: 'Search for educational institutions',
    description:
      'Search for schools by name, region, district, category, and grade. Supports pagination and filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved schools matching search criteria',
    type: SchoolSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async searchSchools(
    @Query() query: SchoolSearchDto,
  ): Promise<SchoolSearchResponseDto> {
    try {
      return await this.educationService.searchSchools(query);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to search schools',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools')
  @ApiOperation({
    summary: 'Get all schools',
    description: 'Retrieve all educational institutions with pagination',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of results per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    type: 'number',
    required: false,
    description: 'Number of results to skip (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all schools',
    type: [SchoolDto],
  })
  async getAllSchools(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<SchoolDto[]> {
    try {
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);
      return await this.educationService.getAllSchools(safeLimit, {
        limit: safeLimit,
        offset: safeOffset,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to retrieve schools',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/statistics')
  @ApiOperation({
    summary: 'Get school statistics',
    description:
      'Retrieve statistical information about schools including counts by category, grade, and region',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved statistics',
  })
  async getStatistics(): Promise<any> {
    try {
      return await this.educationService.getStatistics();
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to retrieve statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/:id')
  @ApiOperation({
    summary: 'Get school by ID',
    description: 'Retrieve detailed information about a specific school',
  })
  @ApiParam({
    name: 'id',
    description: 'School UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved school',
    type: SchoolDto,
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  async getSchoolById(@Param('id') id: string): Promise<SchoolDto> {
    try {
      return await this.educationService.getSchoolById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve school with ID: ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/region/:region')
  @ApiOperation({
    summary: 'Get schools by region',
    description: 'Retrieve all schools in a specific region',
  })
  @ApiParam({
    name: 'region',
    description: 'Region name (e.g., "Greater Accra", "Ashanti")',
    example: 'Greater Accra',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved schools in the region',
    type: [SchoolDto],
  })
  async getSchoolsByRegion(
    @Param('region') region: string,
  ): Promise<SchoolDto[]> {
    try {
      return await this.educationService.getSchoolsByRegion(region);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        `Failed to retrieve schools in region: ${region}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/district/:district')
  @ApiOperation({
    summary: 'Get schools by district',
    description: 'Retrieve all schools in a specific district',
  })
  @ApiParam({
    name: 'district',
    description: 'District name',
    example: 'Accra Metropolis',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved schools in the district',
    type: [SchoolDto],
  })
  async getSchoolsByDistrict(
    @Param('district') district: string,
  ): Promise<SchoolDto[]> {
    try {
      return await this.educationService.getSchoolsByDistrict(district);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        `Failed to retrieve schools in district: ${district}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/category/:category')
  @ApiOperation({
    summary: 'Get schools by category',
    description: 'Retrieve all schools of a specific type/category',
  })
  @ApiParam({
    name: 'category',
    description: 'School category',
    enum: SchoolCategory,
    example: SchoolCategory.SHS,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved schools in the category',
    type: [SchoolDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category',
  })
  async getSchoolsByCategory(
    @Param('category') category: string,
  ): Promise<SchoolDto[]> {
    try {
      // Validate category
      if (!Object.values(SchoolCategory).includes(category as SchoolCategory)) {
        throw new HttpException(
          `Invalid category: ${category}. Valid categories are: ${Object.values(SchoolCategory).join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.educationService.getSchoolsByCategory(
        category as SchoolCategory,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve schools in category: ${category}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('schools/grade/:grade')
  @ApiOperation({
    summary: 'Get schools by grade',
    description: 'Retrieve all schools with a specific grade/rating (A-D)',
  })
  @ApiParam({
    name: 'grade',
    description: 'School grade',
    enum: SchoolGrade,
    example: SchoolGrade.A,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved schools with the specified grade',
    type: [SchoolDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid grade',
  })
  async getSchoolsByGrade(@Param('grade') grade: string): Promise<SchoolDto[]> {
    try {
      // Validate grade
      if (!Object.values(SchoolGrade).includes(grade as SchoolGrade)) {
        throw new HttpException(
          `Invalid grade: ${grade}. Valid grades are: ${Object.values(SchoolGrade).join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.educationService.getSchoolsByGrade(
        grade as SchoolGrade,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve schools with grade: ${grade}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
