// Fetch Status from Ghana API

export async function checkService(
  url: string,
  method: string = 'GET',
  body: any = null,
) {
  if (body) {
    console.log(url, method, JSON.stringify(body))
  }

  const start = Date.now()

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : null,
    })
    const time = Date.now() - start

    if (method === 'POST') {
      const data = await res.json()
      console.log('POST response:', data)
    }

    if (!res.ok) {
      return { status: 'down', responseTime: time, httpStatus: res.status }
    }

    return { status: 'operational', responseTime: time, httpStatus: res.status }
  } catch (err) {
    return { status: 'down', responseTime: null, httpStatus: null }
  }
}
