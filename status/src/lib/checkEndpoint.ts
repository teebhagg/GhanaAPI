import { createServerFn } from '@tanstack/react-start'
import { GHANA_API_ENDPOINTS } from './endpoints'
import { checkService } from './fetchStatus'

// Runs on the server (no CORS). The client sends only an endpoint name, never a URL.
export const checkEndpoint = createServerFn({ method: 'POST' })
  .validator((name: string) => name)
  .handler(async ({ data: name }) => {
    const ep = GHANA_API_ENDPOINTS.find((e) => e.name === name)
    if (!ep) throw new Error('Unknown endpoint')
    return checkService(ep.endpoint, ep.method, ep.body)
  })
