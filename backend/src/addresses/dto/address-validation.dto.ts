import { ApiProperty } from '@nestjs/swagger';

export class AddressValidationDto {
  @ApiProperty() isValid: boolean;
  @ApiProperty() digitalCode: string;
  @ApiProperty({ required: false }) formattedAddress?: string;
  @ApiProperty({ required: false, type: Object })
  coordinates?: { lat: number; lng: number };
}
