import { ApiProperty } from '@nestjs/swagger';

/** Shape of `GET /api/v1/status` (see AppService.getStatus) */
export class StatusResponseDto {
  @ApiProperty({ example: true }) success: boolean;
  @ApiProperty({
    enum: ['healthy', 'degraded', 'unhealthy'],
    example: 'healthy',
  })
  status: 'healthy' | 'degraded' | 'unhealthy';
  @ApiProperty({ example: '2026-11-19T10:00:00.000Z' }) timestamp: string;
  @ApiProperty({
    description: 'The build answering the request',
    example: {
      version: '0.5.5',
      commit: 'abc1234',
      instance: null,
      startedAt: '2026-11-19T09:00:00.000Z',
      uptimeSeconds: 3600,
    },
  })
  build: Record<string, unknown>;
  @ApiProperty({
    description: 'Database and per-service health',
    example: { database: 'healthy', services: { exchangeRates: 'healthy' } },
  })
  health: Record<string, unknown>;
  @ApiProperty({ description: 'Per-module statistics and last failures' })
  statistics: Record<string, unknown>;
}

/** Result of `POST /api/v1/exchange-rates/convert` */
export class ConversionResultDto {
  @ApiProperty({ example: 'GHS' }) from: string;
  @ApiProperty({ example: 'USD' }) to: string;
  @ApiProperty({ example: 100 }) amount: number;
  @ApiProperty({ description: 'Units of `to` per 1 `from`', example: 0.0854 })
  rate: number;
  @ApiProperty({ example: 8.54 }) result: number;
  @ApiProperty({ example: 'bank-of-ghana' }) provider: string;
  @ApiProperty({ format: 'date-time' }) timestamp: string;
}

/** Result of `GET /api/v1/education/schools/statistics` */
export class EducationStatisticsDto {
  @ApiProperty({ example: 990 }) totalSchools: number;
  @ApiProperty({ example: { SHS: 956, UNIVERSITY: 34 } }) byCategory: Record<
    string,
    number
  >;
  @ApiProperty({ example: { A: 93, B: 260, C: 603, UNGRADED: 34 } })
  byGrade: Record<string, number>;
  @ApiProperty({ example: { 'Greater Accra': 120 } }) byRegion: Record<
    string,
    number
  >;
}
