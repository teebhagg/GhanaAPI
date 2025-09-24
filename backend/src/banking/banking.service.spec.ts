import { Test, TestingModule } from '@nestjs/testing';
import { BankingService } from './banking.service';
import { BankSearchQueryDto } from './dto/bank-search.dto';
import { ATMLocation, Bank } from './entities/bank.entity';
import { BankDataProviderService } from './services/bank-data-provider.service';

describe('BankingService', () => {
  let service: BankingService;
  let bankDataProvider: BankDataProviderService;

  const mockBankDataProvider = {
    getBanks: jest.fn(),
    getATMs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankingService,
        {
          provide: BankDataProviderService,
          useValue: mockBankDataProvider,
        },
      ],
    }).compile();

    service = module.get<BankingService>(BankingService);
    bankDataProvider = module.get<BankDataProviderService>(
      BankDataProviderService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBanks', () => {
    const mockBanks: Bank[] = [
      {
        id: 'gcb-1',
        name: 'GCB Bank Limited',
        type: 'bank',
        code: 'GCB',
        address: 'Thorpe Road, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.6037,
        longitude: -0.187,
      },
      {
        id: 'ecobank-1',
        name: 'Ecobank Ghana',
        type: 'bank',
        address: 'Independence Avenue, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.56,
        longitude: -0.2057,
      },
    ];

    const mockATMs: ATMLocation[] = [
      {
        id: 'atm-1',
        name: 'GCB ATM',
        bank: 'GCB Bank',
        address: 'Circle, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.5719,
        longitude: -0.231,
        is24Hours: true,
        services: ['Cash Withdrawal', 'Balance Inquiry'],
        network: ['Visa', 'MasterCard', 'GhIPSS'],
      },
    ];

    it('should search banks by name', async () => {
      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue(mockATMs);

      const query: BankSearchQueryDto = {
        q: 'GCB',
        type: 'bank',
      };

      const result = await service.searchBanks(query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('GCB');
    });

    it('should search banks by location', async () => {
      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue(mockATMs);

      const query: BankSearchQueryDto = {
        lat: 5.6037,
        lng: -0.187,
        radius: 5,
        type: 'both',
      };

      const result = await service.searchBanks(query);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.searchParams.location).toBeDefined();
    });

    it('should filter by type', async () => {
      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue(mockATMs);

      const query: BankSearchQueryDto = {
        type: 'atm',
      };

      const result = await service.searchBanks(query);

      expect(result.success).toBe(true);
      // Should include ATMs from both sources
      expect(result.data.some((item) => item.type === 'atm')).toBe(true);
    });

    it('should apply limit', async () => {
      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue(mockATMs);

      const query: BankSearchQueryDto = {
        limit: 1,
        type: 'both',
      };

      const result = await service.searchBanks(query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getAllBanks', () => {
    it('should return all banks excluding ATMs', async () => {
      const mockBanks: Bank[] = [
        {
          id: 'bank-1',
          name: 'Bank 1',
          type: 'bank',
          address: 'Address 1',
          city: 'City 1',
          region: 'Region 1',
          latitude: 5.0,
          longitude: -1.0,
        },
        {
          id: 'atm-1',
          name: 'ATM 1',
          type: 'atm',
          address: 'Address 2',
          city: 'City 2',
          region: 'Region 2',
          latitude: 6.0,
          longitude: -2.0,
        },
      ];

      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);

      const result = await service.getAllBanks();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('bank');
    });
  });

  describe('getAllATMs', () => {
    it('should return all ATMs from both sources', async () => {
      const mockBanks: Bank[] = [
        {
          id: 'atm-bank-1',
          name: 'ATM from Bank Source',
          type: 'atm',
          address: 'Address 1',
          city: 'City 1',
          region: 'Region 1',
          latitude: 5.0,
          longitude: -1.0,
        },
      ];

      const mockATMs: ATMLocation[] = [
        {
          id: 'atm-2',
          name: 'Standalone ATM',
          bank: 'Some Bank',
          address: 'Address 2',
          city: 'City 2',
          region: 'Region 2',
          latitude: 6.0,
          longitude: -2.0,
          is24Hours: true,
          services: ['Cash Withdrawal'],
          network: ['GhIPSS'],
        },
      ];

      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue(mockATMs);

      const result = await service.getAllATMs();

      expect(result).toHaveLength(2);
      expect(result.every((atm) => atm.type === 'atm')).toBe(true);
    });
  });

  describe('getBanksByRegion', () => {
    it('should filter banks by region', async () => {
      const mockBanks: Bank[] = [
        {
          id: 'bank-1',
          name: 'Bank 1',
          type: 'bank',
          address: 'Address 1',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.0,
          longitude: -1.0,
        },
        {
          id: 'bank-2',
          name: 'Bank 2',
          type: 'bank',
          address: 'Address 2',
          city: 'Kumasi',
          region: 'Ashanti',
          latitude: 6.0,
          longitude: -2.0,
        },
      ];

      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);

      const result = await service.getBanksByRegion('Greater Accra');

      expect(result).toHaveLength(1);
      expect(result[0].region).toBe('Greater Accra');
    });
  });

  describe('getBanksByCity', () => {
    it('should filter banks by city', async () => {
      const mockBanks: Bank[] = [
        {
          id: 'bank-1',
          name: 'Bank 1',
          type: 'bank',
          address: 'Address 1',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.0,
          longitude: -1.0,
        },
        {
          id: 'bank-2',
          name: 'Bank 2',
          type: 'bank',
          address: 'Address 2',
          city: 'Kumasi',
          region: 'Ashanti',
          latitude: 6.0,
          longitude: -2.0,
        },
      ];

      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);

      const result = await service.getBanksByCity('Accra');

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Accra');
    });
  });

  describe('getNearestBanks', () => {
    it('should return nearest banks sorted by distance', async () => {
      const mockBanks: Bank[] = [
        {
          id: 'bank-1',
          name: 'Close Bank',
          type: 'bank',
          address: 'Address 1',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.604, // Very close to search point
          longitude: -0.1875,
        },
        {
          id: 'bank-2',
          name: 'Far Bank',
          type: 'bank',
          address: 'Address 2',
          city: 'Accra',
          region: 'Greater Accra',
          latitude: 5.7, // Further from search point
          longitude: -0.3,
        },
      ];

      mockBankDataProvider.getBanks.mockResolvedValue(mockBanks);
      mockBankDataProvider.getATMs.mockResolvedValue([]);

      const result = await service.getNearestBanks(5.6037, -0.187, 20, 10);

      expect(result).toHaveLength(2);
      expect(result[0].distance).toBeLessThan(result[1].distance!);
    });
  });
});
