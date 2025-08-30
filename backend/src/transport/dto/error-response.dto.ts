import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: false,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to fetch transport data',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Detailed error information',
    example: 'Service temporarily unavailable',
  })
  @IsOptional()
  @IsString()
  error?: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: false,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Validation error details',
    example: [
      'lat must be a number',
      'coordinates are outside Ghana boundaries',
    ],
    type: [String],
  })
  errors: string[];
}
