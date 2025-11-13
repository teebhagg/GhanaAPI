import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  Gender,
  Residency,
  SchoolCategory,
  SchoolGrade,
} from '../entities/school.entity';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'Name of the educational institution',
    example: 'Achimota School',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category of the institution',
    enum: SchoolCategory,
    example: SchoolCategory.SHS,
  })
  @IsEnum(SchoolCategory)
  category: SchoolCategory;

  @ApiProperty({
    description: 'Region where the school is located',
    example: 'Greater Accra',
  })
  @IsString()
  region: string;

  @ApiProperty({
    description: 'District where the school is located',
    example: 'Accra Metropolis',
  })
  @IsString()
  district: string;

  @ApiPropertyOptional({
    description: 'Specific location or address',
    example: 'Achimota, Accra',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Common nickname or alias',
    example: 'Legon',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: 'School grade/rating (A-D)',
    enum: SchoolGrade,
    example: SchoolGrade.A,
  })
  @IsEnum(SchoolGrade)
  grade: SchoolGrade;

  @ApiProperty({
    description: 'Gender composition of the school',
    enum: Gender,
    example: Gender.MIXED,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Residency type',
    enum: Residency,
    example: Residency.DAY_BOARDING,
  })
  @IsEnum(Residency)
  residency: Residency;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'info@achimota.edu.gh',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Primary contact phone number',
    example: '+233 30 266 6962',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Official website URL',
    example: 'https://achimota.edu.gh',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Postal or box address',
    example: 'P. O. BOX LG 25, Legon, Ghana',
  })
  @IsOptional()
  @IsString()
  boxAddress?: string;

  @ApiPropertyOptional({
    description: 'Year the institution was founded',
    example: 1948,
  })
  @IsOptional()
  @IsInt()
  establishedYear?: number;

  @ApiPropertyOptional({
    description: 'Approximate student population',
    example: 38000,
  })
  @IsOptional()
  @IsInt()
  studentPopulation?: number;

  @ApiPropertyOptional({
    description: 'List of programs or courses offered',
    type: [String],
    example: ['Science', 'Arts', 'Business', 'Visual Arts'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  programsOffered?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { established: 1927, motto: 'Ut Omnes Unum Sint' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
