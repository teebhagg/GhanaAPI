import { ApiProperty } from '@nestjs/swagger';
import { BankDto } from './bank.dto';

export class BankSearchResponseDto {
  @ApiProperty({
    description: 'Search success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of banks/ATMs found',
    type: [BankDto],
  })
  data: BankDto[];

  @ApiProperty({
    description: 'Total number of results found',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Search parameters used',
  })
  searchParams: {
    query?: string;
    location?: {
      lat: number;
      lng: number;
      radius: number;
    };
    type: string;
    limit: number;
  };

  @ApiProperty({
    description: 'Data source information',
    example: 'Bank of Ghana Directory + OpenStreetMap',
  })
  source: string;

  @ApiProperty({
    description: 'Timestamp of the search',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}
