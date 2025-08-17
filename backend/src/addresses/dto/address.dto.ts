import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty() digitalCode: string;
  @ApiProperty() addressLine1: string;
  @ApiProperty({ required: false }) addressLine2?: string;
  @ApiProperty() latitude: number;
  @ApiProperty() longitude: number;
  @ApiProperty({ required: false }) postalCode?: string;
}
