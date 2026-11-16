import axios from 'axios';
import { OVERPASS_ENDPOINTS, queryOverpass } from './overpass-client';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe('queryOverpass', () => {
  beforeEach(() => mockedGet.mockReset());

  it('sends the query as a GET data parameter to the main instance', async () => {
    mockedGet.mockResolvedValue({ data: { elements: [{ id: 1 }] } } as any);

    const result = await queryOverpass('[out:json];node(1);out;');

    expect(result.elements).toHaveLength(1);
    expect(mockedGet).toHaveBeenCalledWith(
      OVERPASS_ENDPOINTS[0],
      expect.objectContaining({
        params: { data: '[out:json];node(1);out;' },
        headers: expect.objectContaining({ 'User-Agent': expect.any(String) }),
      }),
    );
  });

  it('tries the next instance when one fails', async () => {
    mockedGet
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce({ data: { elements: [] } } as any);

    await queryOverpass('q');

    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      OVERPASS_ENDPOINTS[1],
      expect.anything(),
    );
  });

  it('rejects an HTTP 200 XML error page and tries the next instance', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: '<?xml version="1.0"?><html></html>' } as any)
      .mockResolvedValueOnce({ data: { elements: [{ id: 2 }] } } as any);

    const result = await queryOverpass('q');

    expect(result.elements).toEqual([{ id: 2 }]);
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('rejects JSON whose remark reports a runtime error', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: { elements: [{ id: 9 }], remark: 'runtime error: Query timed out' },
      } as any)
      .mockResolvedValueOnce({ data: { elements: [{ id: 3 }] } } as any);

    const result = await queryOverpass('q');

    expect(result.elements).toEqual([{ id: 3 }]);
  });

  it('throws the last error when every instance fails', async () => {
    mockedGet.mockRejectedValue(new Error('down'));

    await expect(queryOverpass('q')).rejects.toThrow('down');
    expect(mockedGet).toHaveBeenCalledTimes(OVERPASS_ENDPOINTS.length);
  });

  it('never includes the Swiss-only instance', () => {
    expect(OVERPASS_ENDPOINTS.some((e) => e.includes('overpass.osm.ch'))).toBe(false);
  });
});
