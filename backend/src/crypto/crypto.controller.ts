import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CryptoService } from './crypto.service';

@ApiTags('Crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @ApiOkResponse({
    description: 'Prices by coin id: USD and GHS',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          usd: { type: 'number', example: 65000 },
          ghs: { type: 'number', example: 740000 },
        },
      },
    },
  })
  @Get()
  @ApiOperation({
    summary: 'Get real-time cryptocurrency prices converted to GHS',
    description:
      'Fetches real-time prices via CoinGecko and converts USD prices to GHS using the internal exchange rate service.',
  })
  @ApiQuery({
    name: 'ids',
    required: false,
    description:
      'Comma-separated list of cryptocurrency IDs (e.g. bitcoin,ethereum,solana). Defaults to bitcoin,ethereum',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cryptocurrency prices in USD and GHS',
  })
  @ApiResponse({
    status: 503,
    description:
      'Upstream price or currency conversion is unavailable. No estimated prices are returned.',
  })
  async getCryptoPrices(@Query('ids') idsString?: string) {
    let ids = ['bitcoin', 'ethereum'];
    if (idsString) {
      ids = idsString
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }
    return this.cryptoService.getCryptoPrices(ids);
  }
}
