import { PartialType } from '@nestjs/mapped-types';
import { CreateCryptoDto } from './create-crypto.dto';

export class UpdateCryptoDto extends PartialType(CreateCryptoDto) {
  id: number;
}
