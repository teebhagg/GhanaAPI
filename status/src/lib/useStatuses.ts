import { useCallback, useEffect, useRef, useState } from 'react'
import { checkEndpoint } from './checkEndpoint'
import { GHANA_API_ENDPOINTS } from './endpoints'
import type { ServiceResult } from './fetchStatus'

export const REFRESH_MS = 10 * 60 * 1000

export type Entry = ServiceResult & { run: number }

export function useStatuses() {
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [run, setRun] = useState(0)
  const [checking, setChecking] = useState(true)
  const [checkedAt, setCheckedAt] = useState<number | null>(null)
  const runRef = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++runRef.current
    setRun(id)
    setChecking(true)
    await Promise.all(
      GHANA_API_ENDPOINTS.map(async (ep) => {
        let result: ServiceResult
        try {
          result = await checkEndpoint({ data: ep.name })
        } catch {
          result = { status: 'down', responseTime: null, httpStatus: null }
        }
        if (runRef.current !== id) return
        setEntries((prev) => ({ ...prev, [ep.name]: { ...result, run: id } }))
      }),
    )
    if (runRef.current !== id) return
    setCheckedAt(Date.now())
    setChecking(false)
  }, [])

  // First check on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Schedule the next automatic check after each completed run
  useEffect(() => {
    if (checkedAt === null) return
    const t = setTimeout(refresh, REFRESH_MS)
    return () => clearTimeout(t)
  }, [checkedAt, refresh])

  return { entries, run, checking, checkedAt, refresh }
}
