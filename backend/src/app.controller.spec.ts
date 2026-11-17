import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BankDataProviderService } from './banking/services/bank-data-provider.service';
import { PrismaService } from './common/database/prisma.service';
import { CryptoService } from './crypto/crypto.service';
import { StockMarketService } from './stock-market/stock-market.service';
import { FuelPriceService } from './transport/services/fuel-price.service';
import { TransportStopsService } from './transport/services/transport-stops.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
      school: {
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      exchangeRateHistory: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findFirst: jest.fn(),
      },
    } as unknown as PrismaService;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        ...[
          BankDataProviderService,
          StockMarketService,
          TransportStopsService,
          FuelPriceService,
          CryptoService,
        ].map((provide) => ({
          provide,
          useValue: {
            getHealth: () => ({ status: 'healthy', asOf: null }),
          },
        })),
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return Ghana API welcome message', () => {
      expect(appController.getHello()).toBe(
        "Welcome to Ghana API - Your gateway to Ghana's data and services",
      );
    });
  });
});
