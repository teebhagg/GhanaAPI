// /Users/mac/Documents/Projects/GhanaAPI/backend/src/modules/locations/dto/district.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DistrictDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiProperty() category: string;
  @ApiProperty() capital: string;
}
