import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;
/** The largest offset the database accepts without an error */
export const MAX_OFFSET = Number.MAX_SAFE_INTEGER;

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: `Number of results per page (1 to ${MAX_PAGE_SIZE})`,
    example: DEFAULT_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    example: 0,
    default: 0,
    minimum: 0,
    maximum: MAX_OFFSET,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsInt()
  @Min(0)
  @Max(MAX_OFFSET)
  offset: number = 0;
}
