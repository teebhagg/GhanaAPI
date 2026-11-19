import { GHANA_API_ENDPOINTS } from '../lib/endpoints'
import type { Entry } from '../lib/useStatuses'

export function StatusStrip({
  entries,
  run,
}: {
  entries: Record<string, Entry>
  run: number
}) {
  return (
    <div className="strip" aria-hidden="true">
      {GHANA_API_ENDPOINTS.map((ep) => {
        const e = entries[ep.name]
        const state = !e ? 'pending' : e.status
        return (
          <span
            key={ep.name}
            title={`${ep.name}: ${state === 'pending' ? 'checking' : state}`}
            data-state={state}
            data-stale={e && e.run !== run ? '' : undefined}
          />
        )
      })}
    </div>
  )
}
