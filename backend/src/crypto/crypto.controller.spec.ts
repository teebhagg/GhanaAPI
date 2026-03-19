import { Test, TestingModule } from '@nestjs/testing';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';

describe('CryptoController', () => {
  let controller: CryptoController;
  let mockCryptoService: any;

  beforeEach(async () => {
    mockCryptoService = {
      getCryptoPrices: jest.fn().mockResolvedValue({
        source: 'coingecko',
        data: { bitcoin: { usd: 60000, ghs: 900000 } },
        timestamp: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoController],
      providers: [
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    controller = module.get<CryptoController>(CryptoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get crypto prices with default IDs', async () => {
    await controller.getCryptoPrices();
    expect(mockCryptoService.getCryptoPrices).toHaveBeenCalledWith(['bitcoin', 'ethereum']);
  });

  it('should get crypto prices with custom IDs', async () => {
    await controller.getCryptoPrices('solana, cardano');
    expect(mockCryptoService.getCryptoPrices).toHaveBeenCalledWith(['solana', 'cardano']);
  });
});
