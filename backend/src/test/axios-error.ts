/**
 * An error shaped like the ones axios raises (isAxiosError, code, config,
 * response). The failure helper recognises them by that flag, which the real
 * AxiosError class sets, so tests do not need the class itself.
 */
export function axiosError(
  message: string,
  fields: {
    url: string;
    baseURL?: string;
    code?: string;
    status?: number;
  },
): Error {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    code: fields.code,
    config: { url: fields.url, baseURL: fields.baseURL },
    response:
      fields.status === undefined ? undefined : { status: fields.status },
  });
}

/** An HTTP error response, e.g. httpError(502, 'https://host/path') */
export const httpError = (status: number, url: string): Error =>
  axiosError(`Request failed with status code ${status}`, { url, status });

/** A network error with no response, e.g. a timeout or DNS failure */
export const networkError = (
  code: string,
  message: string,
  url: string,
): Error => axiosError(message, { url, code });
