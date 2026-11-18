import { Logger } from '@nestjs/common';
import axios from 'axios';
import { describeFailure } from '../health/upstream-failure';
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
      .mockResolvedValueOnce({
        data: '<?xml version="1.0"?><html></html>',
      } as any)
      .mockResolvedValueOnce({ data: { elements: [{ id: 2 }] } } as any);

    const result = await queryOverpass('q');

    expect(result.elements).toEqual([{ id: 2 }]);
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('rejects JSON whose remark reports a runtime error', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          elements: [{ id: 9 }],
          remark: 'runtime error: Query timed out',
        },
      } as any)
      .mockResolvedValueOnce({ data: { elements: [{ id: 3 }] } } as any);

    const result = await queryOverpass('q');

    expect(result.elements).toEqual([{ id: 3 }]);
  });

  describe('a runtime error remark from the server', () => {
    const REMARK = 'runtime error: failed /internal/data?token=secret123';
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    });

    afterEach(() => warn.mockRestore());

    it('should publish a fixed phrase and keep the remark in the log only', async () => {
      mockedGet.mockResolvedValue({
        data: { elements: [], remark: REMARK },
      } as any);

      const error = await queryOverpass('q').catch((e: unknown) => e);

      expect(describeFailure(error)).toBe(
        'Overpass runtime error on z.overpass-api.de',
      );
      expect(describeFailure(error)).not.toMatch(/internal|secret123|token/);
      expect(warn.mock.calls.flat().join(' ')).toContain('secret123');
    });

    it.each([
      [
        'runtime error: Query timed out in "query" at line 4.',
        'query timed out',
      ],
      [
        'runtime error: Query run out of memory using 2048 MB.',
        'out of memory',
      ],
      ['runtime error: something else', 'runtime error'],
    ])('should describe %p as %p', async (remark, phrase) => {
      mockedGet.mockResolvedValue({ data: { elements: [], remark } } as any);

      const error = await queryOverpass('q').catch((e: unknown) => e);

      expect(describeFailure(error)).toBe(
        `Overpass ${phrase} on z.overpass-api.de`,
      );
    });
  });

  it('throws the last error when every instance fails', async () => {
    mockedGet.mockRejectedValue(new Error('down'));

    await expect(queryOverpass('q')).rejects.toThrow('down');
    expect(mockedGet).toHaveBeenCalledTimes(OVERPASS_ENDPOINTS.length);
  });

  it('never includes the Swiss-only instance', () => {
    expect(OVERPASS_ENDPOINTS.some((e) => e.includes('overpass.osm.ch'))).toBe(
      false,
    );
  });
});
