import { ApiProperty } from '@nestjs/swagger';

export class StandardizedAddressDto {
  @ApiProperty({ required: false }) digitalCode?: string;
  @ApiProperty() addressLine1: string;
  @ApiProperty({ required: false }) addressLine2?: string;
  @ApiProperty({ required: false }) postalCode?: string;
}
