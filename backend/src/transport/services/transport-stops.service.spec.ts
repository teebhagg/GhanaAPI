import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { TransportStopsService } from './transport-stops.service';

jest.mock('../../common/overpass/overpass-client');
const mockedQuery = queryOverpass as jest.MockedFunction<typeof queryOverpass>;

const ELEMENTS = {
  elements: [
    {
      type: 'node',
      id: 1,
      lat: 5.6,
      lon: -0.2,
      tags: { name: 'Circle', public_transport: 'stop_position' },
    },
    {
      type: 'node',
      id: 3,
      lat: 5.62,
      lon: -0.22,
      tags: { name: 'Lapaz', public_transport: 'platform' },
    },
    {
      type: 'node',
      id: 2,
      lat: 5.61,
      lon: -0.21,
      tags: { name: 'Kaneshie', highway: 'bus_stop' },
    },
  ],
};

describe('TransportStopsService', () => {
  let service: TransportStopsService;
  let now: number;
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedQuery.mockReset();
    now = 10_000_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    service = new TransportStopsService(
      {} as HttpService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
    );
  });

  afterEach(() => nowSpy.mockRestore());

  it('returns parsed stops and queries the city bounding box', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    const stops = await service.getTransportStops('kumasi');

    expect(stops).toHaveLength(3);
    expect(stops[0]).toMatchObject({
      name: 'Circle',
      coordinates: [5.6, -0.2],
    });
    expect(mockedQuery.mock.calls[0][0]).toContain(
      '6.6000,-1.8000,6.8000,-1.4000',
    );
  });

  it('serves repeat requests from memory', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await service.getTransportStops('accra');
    await service.getTransportStops('accra');

    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('20 simultaneous requests share one Overpass query', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await Promise.all(
      Array.from({ length: 20 }, () => service.getTransportStops('accra')),
    );

    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('rejects a stop type that is not on the allowed list, before any query', async () => {
    const injection = 'stop_position"](0,0,0,0);node(1);out;//';

    await expect(
      service.getTransportStops('accra', injection),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('filters by stop type in code and never sends the type to Overpass', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    const platforms = await service.getTransportStops('accra', 'platform');
    const busStops = await service.getTransportStops('accra', 'bus_stop');
    const stations = await service.getTransportStops('accra', 'station');

    expect(platforms.map((s) => s.name)).toEqual(['Lapaz']);
    expect(busStops.map((s) => s.name)).toEqual(['Kaneshie']);
    expect(stations).toEqual([]);
    expect(mockedQuery.mock.calls[0][0]).not.toContain('"platform"]');
  });

  it('shares one Overpass query per city across all types', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await Promise.all([
      service.getTransportStops('accra'),
      service.getTransportStops('accra', 'platform'),
      service.getTransportStops('accra', 'bus_stop'),
      service.getTransportStops('accra', 'stop_position'),
    ]);

    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('does not treat an empty type filter result as an outage', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await expect(
      service.getTransportStops('accra', 'station'),
    ).resolves.toEqual([]);
  });

  it('rejects a city we have no data for instead of answering with Accra', async () => {
    await expect(service.getTransportStops('atlantis')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('accepts a known city in any letter case and shares its cache entry', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await service.getTransportStops('Kumasi');
    await service.getTransportStops('kumasi');

    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when Overpass fails and nothing is stored', async () => {
    mockedQuery.mockRejectedValue(new Error('all instances down'));

    await expect(service.getTransportStops('accra')).rejects.toMatchObject({
      status: 503,
    });
  });

  it('treats an empty Overpass answer as an outage and does not store it', async () => {
    mockedQuery.mockResolvedValue({ elements: [] });

    await expect(service.getTransportStops('accra')).rejects.toMatchObject({
      status: 503,
    });

    now += 11 * 60 * 1000; // past the 10 minute backoff
    mockedQuery.mockResolvedValue(ELEMENTS);
    await expect(service.getTransportStops('accra')).resolves.toHaveLength(3);
  });

  it('keeps serving the last good stops when a later refresh fails', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);
    const first = await service.getTransportStops('accra');

    now += 25 * 60 * 60 * 1000; // past the 24 hour freshness
    mockedQuery.mockRejectedValue(new Error('down'));
    const second = await service.getTransportStops('accra');

    expect(second).toBe(first);
  });

  describe('with a GTFS feed configured', () => {
    const GTFS_HEADER =
      'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon\n';
    let gtfsGet: jest.Mock;
    let gtfsService: TransportStopsService;

    beforeEach(() => {
      gtfsGet = jest.fn();
      gtfsService = new TransportStopsService(
        { get: gtfsGet } as unknown as HttpService,
        {
          get: jest.fn().mockReturnValue('https://gtfs.example'),
        } as unknown as ConfigService,
      );
      mockedQuery.mockRejectedValue(new Error('overpass down'));
    });

    it('does not cache a header-only feed as a successful answer', async () => {
      gtfsGet.mockReturnValue(of({ data: GTFS_HEADER }));

      await expect(
        gtfsService.getTransportStops('accra'),
      ).rejects.toMatchObject({ status: 503 });

      now += 11 * 60 * 1000; // past the 10 minute backoff
      mockedQuery.mockResolvedValue(ELEMENTS);
      await expect(
        gtfsService.getTransportStops('accra'),
      ).resolves.toHaveLength(3);
    });

    it('keeps the last good stops when a refresh only gets an empty feed', async () => {
      mockedQuery.mockResolvedValueOnce(ELEMENTS);
      const first = await gtfsService.getTransportStops('accra');

      now += 25 * 60 * 60 * 1000; // past the 24 hour freshness
      mockedQuery.mockRejectedValue(new Error('overpass down'));
      gtfsGet.mockReturnValue(of({ data: GTFS_HEADER }));

      expect(await gtfsService.getTransportStops('accra')).toBe(first);
    });
  });

  describe('getHealth', () => {
    it('is healthy before anything was requested', () => {
      expect(service.getHealth()).toMatchObject({
        status: 'healthy',
        asOf: null,
      });
    });

    it('is unhealthy when Overpass fails and no list is stored', async () => {
      mockedQuery.mockRejectedValue(new Error('down'));
      await service.getTransportStops('accra').catch(() => undefined);

      expect(service.getHealth().status).toBe('unhealthy');
    });

    it('is degraded when a refresh fails but the last good list is served', async () => {
      mockedQuery.mockResolvedValue(ELEMENTS);
      await service.getTransportStops('accra');
      now += 25 * 60 * 60 * 1000; // past the 24 hour freshness
      mockedQuery.mockRejectedValue(new Error('down'));
      await service.getTransportStops('accra');
      await new Promise((resolve) => setImmediate(resolve));

      expect(service.getHealth().status).toBe('degraded');
    });
  });

  describe('warm-up and retry', () => {
    const overpassStops = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 5.6,
          lon: -0.18,
          tags: { highway: 'bus_stop', name: 'A' },
        },
      ],
    };

    it('refreshes every allowed city once, one after another', async () => {
      mockedQuery.mockResolvedValue(overpassStops as any);

      await service.refreshAllCities();

      expect(mockedQuery).toHaveBeenCalledTimes(4);
    });

    it('retries a city after a failed first fetch within a minute', async () => {
      mockedQuery
        .mockRejectedValueOnce(new Error('502 at capacity'))
        .mockResolvedValue(overpassStops as any);

      await expect(service.getTransportStops('accra')).rejects.toMatchObject({
        status: 503,
      });

      now += 30 * 1000;
      await expect(service.getTransportStops('accra')).rejects.toMatchObject({
        status: 503,
      });
      expect(mockedQuery).toHaveBeenCalledTimes(1);

      now += 31 * 1000;
      await expect(service.getTransportStops('accra')).resolves.toHaveLength(1);
      expect(mockedQuery).toHaveBeenCalledTimes(2);
    });
  });
});
