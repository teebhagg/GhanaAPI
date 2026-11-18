import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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

    const routes = await service.getPublicTransportRoutes('accra');

    expect(routes[0].name).toBe('Circle - Madina');
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('falls through to the next provider when Overpass fails', async () => {
    mockedQuery.mockRejectedValue(new Error('Overpass down'));

    await expect(
      service.getPublicTransportRoutes('accra'),
    ).rejects.toMatchObject({ status: 503 });
    expect(httpService.post).not.toHaveBeenCalled();
  });
});
