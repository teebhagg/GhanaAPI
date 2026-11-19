import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;
/** The largest offset the database accepts without an error */
export const MAX_OFFSET = Number.MAX_SAFE_INTEGER;

/**
 * An empty or blank value (`?offset=`) would become 0 in the number
 * conversion and pass as a real value. Turn it into NaN so validation rejects it.
 */
const blankIsInvalid = ({
  obj,
  key,
  value,
}: {
  obj: Record<string, unknown>;
  key: string;
  value: unknown;
}): unknown => {
  const raw = obj[key];
  return typeof raw === 'string' && raw.trim() === '' ? NaN : value;
};

/** `limit` and `offset` for list endpoints. Bad values are a 400, never fixed silently. */
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
