import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class FindOneCryptoDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  id: string;
}

