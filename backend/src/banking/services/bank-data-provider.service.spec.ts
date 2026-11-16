import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BankDataProviderService } from './bank-data-provider.service';

jest.mock('axios');

const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

const OSM_OK = { data: { elements: [] } } as any;
const XML_ERROR_200 = {
  data: '<?xml version="1.0"?><html><title>OSM3S Response</title></html>',
} as any;

describe('BankDataProviderService (no placeholder data)', () => {
  let service: BankDataProviderService;

  beforeEach(() => {
    mockedGet.mockReset();
    service = new BankDataProviderService(
      {} as HttpService,
      {} as ConfigService,
    );
  });

  it('sends the Overpass query as GET, not POST', async () => {
    mockedGet.mockResolvedValue(OSM_OK);

    await service.getATMs().catch(() => undefined);

    expect(mockedGet).toHaveBeenCalledWith(
      'https://overpass-api.de/api/interpreter',
      expect.objectContaining({ params: { data: expect.any(String) } }),
    );
  });

  it('throws 503 for banks when every Overpass endpoint fails', async () => {
    mockedGet.mockRejectedValue(new Error('Overpass down'));

    await expect(service.getBanks()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws 503 for ATMs when every Overpass endpoint fails', async () => {
    mockedGet.mockRejectedValue(new Error('Overpass down'));

    await expect(service.getATMs()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('treats an HTTP 200 XML error page as a failure, not as data', async () => {
    mockedGet.mockResolvedValue(XML_ERROR_200);

    await expect(service.getATMs()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects a JSON response whose remark reports a runtime error', async () => {
    const ATM = {
      type: 'node',
      id: 3,
      lat: 5.6,
      lon: -0.2,
      tags: { amenity: 'atm', name: 'Real ATM' },
    };
    mockedGet
      .mockResolvedValueOnce({
        data: {
          elements: [{ ...ATM, id: 99 }],
          remark: 'runtime error: Query timed out in "query" at line 4.',
        },
      } as any)
      .mockResolvedValueOnce({ data: { elements: [ATM] } } as any);

    const atms = await service.getATMs();

    expect(atms).toHaveLength(1); // the partial result from instance 1 was discarded
    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      'https://lz4.overpass-api.de/api/interpreter',
      expect.anything(),
    );
  });

  it('queries ATMs by the Ghana area, not by an addr:country tag', async () => {
    mockedGet.mockResolvedValue(OSM_OK);

    await service.getATMs().catch(() => undefined);

    const query = (mockedGet.mock.calls[0][1] as any).params.data as string;
    expect(query).toContain('area["name"="Ghana"]');
    expect(query).toContain('(area.searchArea)');
    expect(query).not.toContain('addr:country');
  });

  it('never uses the Swiss-only instance', async () => {
    mockedGet.mockRejectedValue(new Error('down'));

    await service.getATMs().catch(() => undefined);

    const urls = mockedGet.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('overpass.osm.ch'))).toBe(false);
  });

  it('falls back to the second endpoint when the first fails', async () => {
    mockedGet
      .mockRejectedValueOnce(new Error('406'))
      .mockResolvedValueOnce({
        data: {
          elements: [
            {
              type: 'node',
              id: 1,
              lat: 5.6,
              lon: -0.2,
              tags: { amenity: 'atm', name: 'Test ATM' },
            },
          ],
        },
      } as any);

    const atms = await service.getATMs();

    expect(atms).toHaveLength(1);
    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      'https://lz4.overpass-api.de/api/interpreter',
      expect.anything(),
    );
  });

  it('fails fast without contacting Overpass during the backoff window', async () => {
    const now = 1_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    mockedGet.mockRejectedValue(new Error('Overpass down'));
    await expect(service.getBanks()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    const callsAfterFailure = mockedGet.mock.calls.length;

    nowSpy.mockReturnValue(now + 5 * 60 * 1000); // still inside 10 minutes
    await expect(service.getBanks()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mockedGet.mock.calls.length).toBe(callsAfterFailure);
    nowSpy.mockRestore();
  });

  it('retries Overpass once the backoff window has passed', async () => {
    const now = 1_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    mockedGet.mockRejectedValue(new Error('Overpass down'));
    await expect(service.getATMs()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    const callsAfterFailure = mockedGet.mock.calls.length;

    nowSpy.mockReturnValue(now + 10 * 60 * 1000 + 1);
    mockedGet.mockResolvedValue(OSM_OK);
    await expect(service.getATMs()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    ); // OSM_OK has no ATMs, so 503 again, but Overpass was contacted
    expect(mockedGet.mock.calls.length).toBeGreaterThan(callsAfterFailure);
    nowSpy.mockRestore();
  });

  describe('concurrent callers and last-good data', () => {
    const BANK_ELEMENT = {
      type: 'node',
      id: 7,
      lat: 5.6,
      lon: -0.2,
      tags: { amenity: 'bank', name: 'Test Bank' },
    };

    it('50 simultaneous callers share one Overpass request', async () => {
      let release!: (value: unknown) => void;
      mockedGet.mockReturnValue(
        new Promise((resolve) => {
          release = resolve;
        }) as any,
      );

      const calls = Array.from({ length: 50 }, () => service.getBanks());
      release({ data: { elements: [BANK_ELEMENT] } });
      const results = await Promise.all(calls);

      expect(mockedGet).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(50);
      expect(results.every((r) => r === results[0])).toBe(true);
      expect(results[0]).toHaveLength(1);
    });

    it('50 simultaneous callers all get a 503 from one failed attempt', async () => {
      mockedGet.mockRejectedValue(new Error('Overpass down'));

      const results = await Promise.allSettled(
        Array.from({ length: 50 }, () => service.getBanks()),
      );

      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      expect(
        results.every(
          (r) =>
            r.status === 'rejected' &&
            r.reason instanceof ServiceUnavailableException,
        ),
      ).toBe(true);
      // One attempt = each of the 3 instances tried once, not once per caller
      expect(mockedGet).toHaveBeenCalledTimes(3);
    });

    it('serves the last good data when a refresh fails after expiry', async () => {
      const t0 = 5_000_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);
      mockedGet.mockResolvedValue({ data: { elements: [BANK_ELEMENT] } } as any);
      const first = await service.getBanks();
      expect(service.getFreshness().banks.stale).toBe(false);

      nowSpy.mockReturnValue(t0 + 25 * 60 * 60 * 1000); // past the 24h life
      mockedGet.mockRejectedValue(new Error('Overpass down'));
      const second = await service.getBanks();

      expect(second).toBe(first);
      expect(service.getFreshness().banks.stale).toBe(true);
      expect(service.getFreshness().banks.asOf).toBe(new Date(t0).toISOString());
      nowSpy.mockRestore();
    });

    it('returns stale data immediately without waiting for the refresh', async () => {
      const t0 = 5_000_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);
      mockedGet.mockResolvedValue({ data: { elements: [BANK_ELEMENT] } } as any);
      const first = await service.getBanks();

      nowSpy.mockReturnValue(t0 + 25 * 60 * 60 * 1000);
      mockedGet.mockReturnValue(new Promise(() => undefined) as any); // never settles
      const second = await service.getBanks(); // must not hang

      expect(second).toBe(first);
      nowSpy.mockRestore();
    });

    it('keeps ATM and bank caches independent', async () => {
      mockedGet.mockResolvedValue({
        data: {
          elements: [
            { ...BANK_ELEMENT, tags: { amenity: 'atm', name: 'Test ATM' } },
          ],
        },
      } as any);

      await service.getATMs();
      const callsAfterATMs = mockedGet.mock.calls.length;
      await service.getATMs(); // served from its own cache entry

      expect(mockedGet.mock.calls.length).toBe(callsAfterATMs);
    });
  });

  it('throws 503 when Overpass answers but returns no ATMs', async () => {
    mockedGet.mockResolvedValue(OSM_OK);

    await expect(service.getATMs()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  describe('database snapshot (survives restart)', () => {
    const BANK = {
      type: 'node',
      id: 9,
      lat: 5.6,
      lon: -0.2,
      tags: { amenity: 'bank', name: 'Saved Bank' },
    };

    const makePrisma = () => ({
      bankSnapshot: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    });

    it('saves a snapshot after a successful fetch', async () => {
      const prisma = makePrisma();
      const svc = new BankDataProviderService({} as any, {} as any, prisma as any);
      mockedGet.mockResolvedValue({ data: { elements: [BANK] } } as any);

      await svc.getBanks();
      await new Promise((r) => setImmediate(r));

      expect(prisma.bankSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'banks' },
          create: expect.objectContaining({ key: 'banks', payload: expect.any(Array) }),
        }),
      );
    });

    it('restores a snapshot on start, so the first request needs no Overpass call', async () => {
      const prisma = makePrisma();
      prisma.bankSnapshot.findUnique.mockImplementation(async ({ where }: any) =>
        where.key === 'banks'
          ? { key: 'banks', payload: [{ id: 'x', name: 'Saved Bank', type: 'bank' }], fetchedAt: new Date() }
          : null,
      );
      const svc = new BankDataProviderService({} as any, {} as any, prisma as any);

      await svc.onModuleInit();
      const banks = await svc.getBanks();

      expect(banks[0].name).toBe('Saved Bank');
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('turns restored lastChecked strings back into Dates', async () => {
      const prisma = makePrisma();
      prisma.bankSnapshot.findUnique.mockImplementation(async ({ where }: any) =>
        where.key === 'atms'
          ? { key: 'atms', payload: [{ id: 'a', name: 'ATM', lastChecked: '2026-11-15T10:00:00.000Z' }], fetchedAt: new Date() }
          : null,
      );
      const svc = new BankDataProviderService({} as any, {} as any, prisma as any);

      await svc.onModuleInit();
      const atms = await svc.getATMs();

      expect(atms[0].lastChecked).toBeInstanceOf(Date);
    });

    it('a restored snapshot older than 24h is served as stale and refreshed on the next request', async () => {
      const prisma = makePrisma();
      prisma.bankSnapshot.findUnique.mockImplementation(async ({ where }: any) =>
        where.key === 'banks'
          ? { key: 'banks', payload: [{ id: 'x', name: 'Old Bank', type: 'bank' }], fetchedAt: new Date(Date.now() - 25 * 3600 * 1000) }
          : null,
      );
      const svc = new BankDataProviderService({} as any, {} as any, prisma as any);
      await svc.onModuleInit();
      mockedGet.mockResolvedValue({ data: { elements: [BANK] } } as any);

      const banks = await svc.getBanks();

      expect(banks[0].name).toBe('Old Bank'); // served immediately
      expect(svc.getFreshness().banks.stale).toBe(true);
      await new Promise((r) => setImmediate(r));
      expect(mockedGet).toHaveBeenCalled(); // refresh started
    });

    it('the daily refresh contacts Overpass for both datasets', async () => {
      const svc = new BankDataProviderService({} as any, {} as any, makePrisma() as any);
      mockedGet.mockResolvedValue({ data: { elements: [BANK] } } as any);

      await svc.refreshAll();

      // One request for banks, one for ATMs. The mock returns no ATMs, which is an outage, not a failover trigger.
      expect(mockedGet).toHaveBeenCalledTimes(2);
    });

    it('a failing database does not break the banking data path', async () => {
      const prisma = makePrisma();
      prisma.bankSnapshot.upsert.mockRejectedValue(new Error('db down'));
      prisma.bankSnapshot.findUnique.mockRejectedValue(new Error('db down'));
      const svc = new BankDataProviderService({} as any, {} as any, prisma as any);
      mockedGet.mockResolvedValue({ data: { elements: [BANK] } } as any);

      await svc.onModuleInit();
      const banks = await svc.getBanks();
      await new Promise((r) => setImmediate(r));

      expect(banks).toHaveLength(1);
    });
  });
});
