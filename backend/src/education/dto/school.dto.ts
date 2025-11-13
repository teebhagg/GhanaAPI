import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Gender,
  Residency,
  SchoolCategory,
  SchoolGrade,
} from '../entities/school.entity';

export class SchoolDto {
  @ApiProperty({
    description: 'Unique identifier for the school',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the educational institution',
    example: 'Achimota School',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Common nickname or alias for the institution',
    example: 'Legon',
  })
  nickname?: string;

  @ApiProperty({
    description: 'Category of the institution',
    enum: SchoolCategory,
    example: SchoolCategory.SHS,
  })
  category: SchoolCategory;

  @ApiProperty({
    description: 'Region where the school is located',
    example: 'Greater Accra',
  })
  region: string;

  @ApiProperty({
    description: 'District where the school is located',
    example: 'Accra Metropolis',
  })
  district: string;

  @ApiPropertyOptional({
    description: 'Specific location or address',
    example: 'Achimota, Accra',
  })
  location?: string;

  @ApiProperty({
    description: 'School grade/rating (A-D)',
    enum: SchoolGrade,
    example: SchoolGrade.A,
  })
  grade: SchoolGrade;

  @ApiProperty({
    description: 'Gender composition of the school',
    enum: Gender,
    example: Gender.MIXED,
  })
  gender: Gender;

  @ApiProperty({
    description: 'Residency type',
    enum: Residency,
    example: Residency.DAY_BOARDING,
  })
  residency: Residency;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'info@achimota.edu.gh',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Primary contact phone number',
    example: '+233 30 266 6962',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Official website URL',
    example: 'https://achimota.edu.gh',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Postal or box address for the institution',
    example: 'P. O. BOX LG 25, Legon, Ghana',
  })
  boxAddress?: string;

  @ApiPropertyOptional({
    description: 'Year the institution was established',
    example: 1948,
  })
  establishedYear?: number;

  @ApiPropertyOptional({
    description: 'Approximate student population or enrollment',
    example: 38000,
  })
  studentPopulation?: number;

  @ApiProperty({
    description: 'List of programs or courses offered',
    type: [String],
    example: ['Science', 'Arts', 'Business', 'Visual Arts'],
  })
  programsOffered: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { established: 1927, motto: 'Ut Omnes Unum Sint' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-11T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-11T10:00:00Z',
  })
  updatedAt: Date;
}
