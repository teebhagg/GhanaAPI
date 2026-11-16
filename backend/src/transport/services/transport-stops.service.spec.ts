import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
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

    expect(stops).toHaveLength(2);
    expect(stops[0]).toMatchObject({ name: 'Circle', coordinates: [5.6, -0.2] });
    expect(mockedQuery.mock.calls[0][0]).toContain('6.6000,-1.8000,6.8000,-1.4000');
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

    await expect(service.getTransportStops('accra', injection)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('accepts an allowed stop type and puts it in the query', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await service.getTransportStops('accra', 'platform');

    expect(mockedQuery.mock.calls[0][0]).toContain('["public_transport"="platform"]');
  });

  it('keeps cache keys bounded: unknown cities share the default city entry', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);

    await service.getTransportStops('atlantis');
    await service.getTransportStops('narnia');
    await service.getTransportStops('accra');

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
    await expect(service.getTransportStops('accra')).resolves.toHaveLength(2);
  });

  it('keeps serving the last good stops when a later refresh fails', async () => {
    mockedQuery.mockResolvedValue(ELEMENTS);
    const first = await service.getTransportStops('accra');

    now += 25 * 60 * 60 * 1000; // past the 24 hour freshness
    mockedQuery.mockRejectedValue(new Error('down'));
    const second = await service.getTransportStops('accra');

    expect(second).toBe(first);
  });
});
