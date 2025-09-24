import { ApiProperty } from '@nestjs/swagger';

export class BankDto {
  @ApiProperty({
    description: 'Unique identifier for the bank',
    example: 'gcb-bank-01',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the bank',
    example: 'GCB Bank Limited',
  })
  name: string;

  @ApiProperty({
    description: 'Type of banking facility',
    example: 'bank',
    enum: ['bank', 'atm'],
  })
  type: 'bank' | 'atm';

  @ApiProperty({
    description: 'Bank code or abbreviation',
    example: 'GCB',
  })
  code?: string;

  @ApiProperty({
    description: 'Physical address',
    example: 'Thorpe Road, Accra',
  })
  address: string;

  @ApiProperty({
    description: 'City location',
    example: 'Accra',
  })
  city: string;

  @ApiProperty({
    description: 'Region where the bank is located',
    example: 'Greater Accra',
  })
  region: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 5.6037,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.187,
  })
  longitude: number;

  @ApiProperty({
    description: 'Phone number',
    required: false,
    example: '+233302664910',
  })
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    required: false,
    example: 'info@gcbbank.com.gh',
  })
  email?: string;

  @ApiProperty({
    description: 'Website URL',
    required: false,
    example: 'https://gcbbank.com.gh',
  })
  website?: string;

  @ApiProperty({
    description: 'Operating hours',
    required: false,
    example: 'Mon-Fri: 8:00-17:00, Sat: 8:00-13:00',
  })
  operatingHours?: string;

  @ApiProperty({
    description: 'Available services',
    required: false,
    example: ['ATM', 'Cash Deposit', 'Foreign Exchange', 'Loans'],
  })
  services?: string[];

  @ApiProperty({
    description: 'Distance from search point (if location-based search)',
    required: false,
    example: 2.5,
  })
  distance?: number;

  @ApiProperty({
    description: 'Additional branch information',
    required: false,
  })
  branchInfo?: {
    branchCode?: string;
    isHeadOffice?: boolean;
    hasATM?: boolean;
    is24Hours?: boolean;
  };
}
