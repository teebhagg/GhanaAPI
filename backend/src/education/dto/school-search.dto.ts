import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SchoolCategory, SchoolGrade } from '../entities/school.entity';

export class SchoolSearchDto {
  @ApiPropertyOptional({
    description: 'Search by school name (partial match)',
    example: 'Achimota',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by region',
    example: 'Greater Accra',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Filter by district',
    example: 'Accra Metropolis',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Filter by school category',
    enum: SchoolCategory,
    example: SchoolCategory.SHS,
  })
  @IsOptional()
  @IsEnum(SchoolCategory)
  category?: SchoolCategory;

  @ApiPropertyOptional({
    description: 'Filter by school grade/rating',
    enum: SchoolGrade,
    example: SchoolGrade.A,
  })
  @IsOptional()
  @IsEnum(SchoolGrade)
  grade?: SchoolGrade;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
