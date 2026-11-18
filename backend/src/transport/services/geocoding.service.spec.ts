import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { escapeOverpassRegex, GeocodingService } from './geocoding.service';

jest.mock('../../common/overpass/overpass-client');
const mockedQuery = queryOverpass as jest.MockedFunction<typeof queryOverpass>;

describe('escapeOverpassRegex', () => {
  it('escapes quotes and regex metacharacters so the text cannot end the string', () => {
    const escaped = escapeOverpassRegex('a"](0,0,0,0);node(1);out;//');

    expect(escaped).not.toMatch(/(^|[^\\])"/);
    expect(escaped).toContain('\\"');
    expect(escaped).toContain('\\(');
  });

  it('leaves ordinary place names alone', () => {
    expect(escapeOverpassRegex('Cape Coast')).toBe('Cape Coast');
  });
});

describe('GeocodingService (Overpass fallback)', () => {
  let service: GeocodingService;
  const httpService = { get: jest.fn(), post: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new GeocodingService(
      httpService as unknown as HttpService,
      { get: jest.fn() } as unknown as ConfigService,
    );
    // Nominatim fails so the Overpass fallback runs.
    httpService.get.mockImplementation(() => {
      throw new Error('nominatim down');
    });
  });

  it('uses the shared Overpass client, never POSTs, and escapes the name', async () => {
    mockedQuery.mockResolvedValue({
      elements: [
        { lat: 6.69, lon: -1.62, tags: { name: 'Kumasi', place: 'city' } },
      ],
    });

    const result = await service.geocodeLocation('Ku"masi');

    expect(result.coordinates).toEqual([6.69, -1.62]);
    expect(httpService.post).not.toHaveBeenCalled();
    const query = mockedQuery.mock.calls[0][0];
    expect(query).toContain('Ku\\"masi');
    expect(query).not.toContain('Ku"masi');
  });
});
