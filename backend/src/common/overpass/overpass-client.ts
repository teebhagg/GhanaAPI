import { Logger } from '@nestjs/common';
import axios from 'axios';
import { safeMessage, UpstreamFailure } from '../health/upstream-failure';

/**
 * Official global Overpass instances, main host first. Do not add
 * country-specific instances such as overpass.osm.ch: it holds Swiss data
 * only and returns no results for Ghana.
 */
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

const USER_AGENT = 'GhanaAPI/1.0 (+https://ghana-api.dev)';
const logger = new Logger('OverpassClient');

/**
 * Run an Overpass QL query, trying each instance in turn.
 *
 * Sent as GET: overpass-api.de rejects POST with text/plain (406).
 * A 200 is not enough: an instance can return an XML error page, or JSON whose
 * remark reports a runtime error (timeout, out of memory) next to partial
 * elements. Both are rejected so the next instance is tried.
 */
export async function queryOverpass(
  query: string,
  timeoutMs = 100_000, // a cold city query took 55 s on a busy host
): Promise<{ elements: any[] }> {
  let lastError: unknown = new Error('No Overpass endpoint configured');

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.get(endpoint, {
        params: { data: query },
        headers: { 'User-Agent': USER_AGENT },
        timeout: timeoutMs,
      });
      const data = response.data;
      const remark: string =
        data && typeof data.remark === 'string' ? data.remark : '';
      if (/runtime error/i.test(remark)) {
        throw new UpstreamFailure(
          `Overpass runtime error from ${endpoint}: ${safeMessage(remark, 100)}`,
        );
      }
      if (data && typeof data === 'object' && Array.isArray(data.elements)) {
        return data;
      }
      throw new UpstreamFailure(`Non-JSON response from ${endpoint}`);
    } catch (error) {
      lastError = error;
      logger.warn(
        `Overpass endpoint ${endpoint} failed: ${(error as Error).message}`,
      );
    }
  }
  throw lastError;
}
