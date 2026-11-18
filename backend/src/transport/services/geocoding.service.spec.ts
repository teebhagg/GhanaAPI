import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { GeocodingService, toOverpassNamePattern } from './geocoding.service';

jest.mock('../../common/overpass/overpass-client');
const mockedQuery = queryOverpass as jest.MockedFunction<typeof queryOverpass>;

describe('toOverpassNamePattern', () => {
  it('leaves no quote or backslash, so the text cannot end the string', () => {
    const pattern = toOverpassNamePattern('a"](0,0,0,0);node(1);out;//\\');

    expect(pattern).not.toContain('"');
    expect(pattern).not.toContain('\\');
    expect(pattern).toBe('a...0,0,0,0.;node.1.;out;//.');
  });

  it('still matches the original name as a regex', () => {
    const name = "St. Mary's (Old) [A+B]";
    expect(new RegExp(toOverpassNamePattern(name), 'i').test(name)).toBe(true);
  });

  it('leaves ordinary place names alone', () => {
    expect(toOverpassNamePattern('Cape Coast')).toBe('Cape Coast');
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

  it('uses the shared Overpass client with a short timeout, never POSTs, and neutralises the name', async () => {
    mockedQuery.mockResolvedValue({
      elements: [
        { lat: 6.69, lon: -1.62, tags: { name: 'Kumasi', place: 'city' } },
      ],
    });

    const result = await service.geocodeLocation('Ku"asi');

    expect(result.coordinates).toEqual([6.69, -1.62]);
    expect(httpService.post).not.toHaveBeenCalled();
    const query = mockedQuery.mock.calls[0][0];
    expect(query).toContain('Ku.asi');
    // The mocked place must be one the generated pattern really matches.
    expect(new RegExp('Ku.asi', 'i').test('Kumasi')).toBe(true);
    expect(query).not.toContain('Ku"asi');
    expect(mockedQuery.mock.calls[0][1]).toBe(8_000);
    // Overpass has no (country:XX) filter, so the query must use an area.
    expect(query).not.toContain('country:');
    expect(query).toContain(
      'area["ISO3166-1"="GH"][admin_level=2]->.searchArea;',
    );
    expect(query.match(/\(area\.searchArea\)/g)).toHaveLength(3);
  });

  it('accepts longitude 0 and uses the centre of ways and relations', async () => {
    mockedQuery.mockResolvedValueOnce({
      elements: [{ lat: 5.67, lon: 0, tags: { name: 'Tema', place: 'city' } }],
    });
    await expect(service.geocodeLocation('Tema')).resolves.toMatchObject({
      coordinates: [5.67, 0],
    });

    mockedQuery.mockResolvedValueOnce({
      elements: [
        { center: { lat: 5.5, lon: 0 }, tags: { name: 'Ada', place: 'town' } },
      ],
    });
    await expect(service.geocodeLocation('Ada')).resolves.toMatchObject({
      coordinates: [5.5, 0],
    });
  });

  it('returns 404 when the result has no usable coordinates', async () => {
    mockedQuery.mockResolvedValue({
      elements: [{ tags: { name: 'Nowhere', place: 'village' } }],
    });

    await expect(service.geocodeLocation('Nowhere')).rejects.toMatchObject({
      status: 404,
    });
  });
});
