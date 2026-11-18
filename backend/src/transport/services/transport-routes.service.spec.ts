import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { TransportRoutesService } from './transport-routes.service';

jest.mock('../../common/overpass/overpass-client');
const mockedQuery = queryOverpass as jest.MockedFunction<typeof queryOverpass>;

describe('TransportRoutesService (Overpass)', () => {
  const httpService = { get: jest.fn(), post: jest.fn() };
  let service: TransportRoutesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TransportRoutesService(
      httpService as unknown as HttpService,
      { get: jest.fn() } as unknown as ConfigService,
    );
  });

  it('gets routes through the shared Overpass client and never POSTs', async () => {
    mockedQuery.mockResolvedValue({
      elements: [
        {
          type: 'relation',
          id: 1,
          tags: { route: 'bus', name: 'Circle - Madina' },
          members: [],
        },
      ],
    });

    const routes = await service.getPublicTransportRoutes('kumasi');

    expect(routes[0].name).toBe('Circle - Madina');
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    const [query, timeout] = mockedQuery.mock.calls[0];
    expect(query).toContain('6.6000,-1.8000,6.8000,-1.4000'); // Kumasi bbox
    expect(query).not.toContain('5.4000,-0.4000'); // not the Accra bbox
    expect(timeout).toBe(30_000);
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('falls back to GTFS when Overpass fails', async () => {
    mockedQuery.mockRejectedValue(new Error('Overpass down'));
    const config = {
      get: jest.fn().mockReturnValue('https://gtfs.example/feed'),
    };
    const gtfsService = new TransportRoutesService(
      httpService as unknown as HttpService,
      config as unknown as ConfigService,
    );
    httpService.get.mockReturnValue(
      of({
        data: 'route_id,agency_id,route_short_name,route_long_name,route_type\n1,a,N1,Circle - Madina,3',
      }),
    );

    const routes = await gtfsService.getPublicTransportRoutes('accra');

    expect(httpService.get).toHaveBeenCalledWith(
      'https://gtfs.example/feed/routes.txt',
      expect.anything(),
    );
    expect(routes).toHaveLength(1);
    expect(routes[0].id).toBe('1');
  });

  it('returns 503 when every provider fails', async () => {
    mockedQuery.mockRejectedValue(new Error('Overpass down'));

    await expect(
      service.getPublicTransportRoutes('accra'),
    ).rejects.toMatchObject({ status: 503 });
    expect(httpService.post).not.toHaveBeenCalled();
  });
});
