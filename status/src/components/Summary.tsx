import { useEffect, useState } from 'react'
import { REFRESH_MS } from '../lib/useStatuses'

interface SummaryProps {
  total: number
  done: number
  down: number
  checking: boolean
  checkedAt: number | null
  onRefresh: () => void
}

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function Summary({
  total,
  done,
  down,
  checking,
  checkedAt,
  onRefresh,
}: SummaryProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const firstLoad = checkedAt === null
  const tone = down === 0 ? 'up' : down === total ? 'down' : 'warn'
  const headline = firstLoad
    ? 'Checking endpoints'
    : down === 0
      ? 'All systems operational'
      : down === total
        ? 'Major outage'
        : `${total - down} of ${total} endpoints up`

  return (
    <section aria-live="polite">
      <h1
        className="text-[2rem] leading-tight font-semibold tracking-tight sm:text-4xl"
        data-tone={firstLoad ? 'pending' : tone}
      >
        <span className="headline-dot" aria-hidden="true" />
        {headline}
        {firstLoad && (
          <span className="text-muted-foreground tabular">
            {' '}
            {done}/{total}
          </span>
        )}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {firstLoad ? (
          <span className="skeleton h-4 w-48" />
        ) : (
          <span className="tabular">
            Checked{' '}
            {new Date(checkedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
            {checking ? (
              ''
            ) : (
              <> · next in {fmtCountdown(checkedAt + REFRESH_MS - now)}</>
            )}
          </span>
        )}
        <button
          type="button"
          className="press link-button"
          onClick={onRefresh}
          disabled={checking}
        >
          {checking && !firstLoad ? 'Checking…' : 'Check now'}
        </button>
      </div>
    </section>
  )
}
