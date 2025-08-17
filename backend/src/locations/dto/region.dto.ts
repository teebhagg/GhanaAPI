import { ApiProperty } from '@nestjs/swagger';

export class RegionDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
}
