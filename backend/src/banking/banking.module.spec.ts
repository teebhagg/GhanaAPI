import { Test } from '@nestjs/testing';
import { BankingController } from './banking.controller';
import { BankingModule } from './banking.module';
import { BankDataProviderService } from './services/bank-data-provider.service';

describe('BankingModule', () => {
  it('compiles with the real providers, including the freshness interceptor', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BankingModule],
    }).compile();

    expect(moduleRef.get(BankingController)).toBeDefined();
    expect(moduleRef.get(BankDataProviderService).getFreshness()).toEqual({
      banks: { asOf: null, stale: false },
      atms: { asOf: null, stale: false },
    });
  });
});
