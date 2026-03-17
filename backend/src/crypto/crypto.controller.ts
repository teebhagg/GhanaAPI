import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';

@ApiTags('Crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get()
  @ApiOperation({
    summary: 'Get real-time cryptocurrency prices converted to GHS',
    description: 'Fetches real-time prices via CoinGecko and converts USD prices to GHS using the internal exchange rate service.',
  })
  @ApiQuery({
    name: 'ids',
    required: false,
    description: 'Comma-separated list of cryptocurrency IDs (e.g. bitcoin,ethereum,solana). Defaults to bitcoin,ethereum',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cryptocurrency prices in USD and GHS',
  })
  async getCryptoPrices(@Query('ids') idsString?: string) {
    let ids = ['bitcoin', 'ethereum'];
    if (idsString) {
      ids = idsString.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
    }
    return this.cryptoService.getCryptoPrices(ids);
  }
}
