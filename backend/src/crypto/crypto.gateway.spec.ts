import { Test, TestingModule } from '@nestjs/testing';
import { CryptoGateway } from './crypto.gateway';
import { CryptoService } from './crypto.service';

describe('CryptoGateway', () => {
  let gateway: CryptoGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoGateway, CryptoService],
    }).compile();

    gateway = module.get<CryptoGateway>(CryptoGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
