export type ServiceResult = {
  status: 'operational' | 'down'
  responseTime: number | null
  httpStatus: number | null
}

const TIMEOUT_MS = 10_000

export async function checkService(
  url: string,
  method: string = 'GET',
  body: unknown = null,
): Promise<ServiceResult> {
  const start = Date.now()

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : null,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const responseTime = Date.now() - start

    return {
      status: res.ok ? 'operational' : 'down',
      responseTime,
      httpStatus: res.status,
    }
  } catch {
    return { status: 'down', responseTime: null, httpStatus: null }
  }
}
