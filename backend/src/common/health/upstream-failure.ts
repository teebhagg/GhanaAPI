import { HttpException } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';

/**
 * A short, safe description of why an upstream call failed, for /status.
 *
 * /status is public, so nothing here may carry a secret: never a URL path or
 * query (some providers put an API key in the path), never a raw message from
 * an error we did not write. Hosts, status codes and error codes are enough to
 * tell a block from a timeout from a DNS problem.
 *
 * Free text only gets through an UpstreamFailure, which a developer creates on
 * purpose with static wording. Any other error is described by its type.
 */

const MAX_REASON_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 700;
const MAX_CAUSE_DEPTH = 5;

/**
 * A failure summarised in words that are safe to publish: static text written
 * in our own code, or a summary built from other safe descriptions. Throw it
 * for our own conditions ("No GTFS data available"), or attach it as the
 * `cause` of the error a service throws, so it survives the generic message on
 * top. Never put text from an upstream response or a library error in it.
 */
export class UpstreamFailure extends Error {
  constructor(
    public readonly summary: string,
    options?: { cause?: unknown },
  ) {
    super(summary, options);
    this.name = 'UpstreamFailure';
  }
}

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT']);
const DNS_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN']);

/** The host of a URL, or null. Path and query are dropped on purpose. */
function hostOf(url: unknown, baseUrl?: unknown): string | null {
  if (typeof url !== 'string' || url === '') return null;
  try {
    return new URL(url, typeof baseUrl === 'string' ? baseUrl : undefined).host;
  } catch {
    return null;
  }
}

/** Replace URLs in free text with their host and cut it to a sane length. */
export function safeMessage(message: string, max = MAX_REASON_LENGTH): string {
  const cleaned = message
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'<>)]+/gi, (url) => {
      const host = hostOf(url);
      return host ?? '<url>';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

type AxiosLike = {
  isAxiosError: true;
  code?: string;
  message?: string;
  response?: { status?: number };
  config?: { url?: unknown; baseURL?: unknown };
};

const isAxiosError = (error: unknown): error is AxiosLike =>
  typeof error === 'object' &&
  error !== null &&
  (error as { isAxiosError?: unknown }).isAxiosError === true;

function describeAxios(error: AxiosLike): string {
  const host = hostOf(error.config?.url, error.config?.baseURL);
  const where = host ? ` ${host}` : '';
  const status = error.response?.status;
  if (typeof status === 'number') {
    return host ? `HTTP ${status} from ${host}` : `HTTP ${status}`;
  }
  const code = error.code ?? '';
  if (TIMEOUT_CODES.has(code)) {
    const ms = /timeout of (\d+)ms/.exec(error.message ?? '')?.[1];
    return `timeout${ms ? ` after ${ms}ms` : ''} contacting${where || ' upstream'}`;
  }
  if (DNS_CODES.has(code)) {
    return `DNS lookup failed for${where || ' upstream'}`;
  }
  if (code) return `connection error ${code} contacting${where || ' upstream'}`;
  return `no response from${where || ' upstream'}`;
}

/** What to say about an error whose message we do not trust. */
function describeByType(error: Error): string {
  if (error instanceof HttpException) {
    const status = error.getStatus();
    return `${(STATUS_CODES[status] ?? 'error').toLowerCase()} (${status})`;
  }
  return `unexpected ${error.name || 'Error'}`;
}

/**
 * Describe the most useful error in a chain: walk `cause` until something we
 * can summarise safely turns up (an UpstreamFailure, an HTTP client error, a
 * timeout). An error with none of these is described by its type, never by its
 * message, because the message may hold a path, a query or a credential.
 */
export function describeFailure(error: unknown): string {
  let current: unknown = error;
  let fallback: string | null = null;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
    if (current instanceof UpstreamFailure) {
      return safeMessage(current.summary, MAX_SUMMARY_LENGTH);
    }
    if (isAxiosError(current)) return describeAxios(current);
    if (!(current instanceof Error)) break;
    // rxjs timeout() raises a TimeoutError with no URL
    if (current.name === 'TimeoutError') {
      return 'timeout: the request exceeded its time limit';
    }
    fallback ??= describeByType(current);
    current = (current as { cause?: unknown }).cause;
    if (current === undefined || current === null) break;
  }
  return fallback ?? 'unknown error';
}

/** Join per-source reasons: "overpass: HTTP 502 from ...; gtfs: ..." */
export function summariseSources(
  failures: Array<{ source: string; error: unknown }>,
): UpstreamFailure {
  const summary = failures
    .map(({ source, error }) => `${source}: ${describeFailure(error)}`)
    .join('; ');
  return new UpstreamFailure(safeMessage(summary, MAX_SUMMARY_LENGTH), {
    cause: failures[0]?.error,
  });
}
