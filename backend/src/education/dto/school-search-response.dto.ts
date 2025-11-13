import { ApiProperty } from '@nestjs/swagger';
import { SchoolDto } from './school.dto';

export class SchoolSearchResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of schools matching the search criteria',
    type: [SchoolDto],
  })
  data: SchoolDto[];

  @ApiProperty({
    description: 'Total number of results returned',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Pagination information',
    example: { limit: 20, offset: 0, hasMore: true },
  })
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };

  @ApiProperty({
    description: 'Search parameters used',
    example: {
      region: 'Greater Accra',
      category: 'SHS',
      grade: 'A',
    },
  })
  searchParams: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-11-11T10:00:00Z',
  })
  timestamp: string;
}
