import type { Entry } from '../lib/useStatuses'

interface ServiceRowProps {
  name: string
  description: string
  url: string
  entry: Entry | undefined
  stale: boolean
}

export function ServiceRow({
  name,
  description,
  url,
  entry,
  stale,
}: ServiceRowProps) {
  const state = !entry ? 'pending' : entry.status
  const label =
    state === 'pending'
      ? 'Checking'
      : state === 'operational'
        ? 'Operational'
        : 'Down'
  const slow =
    entry?.status === 'operational' && (entry.responseTime ?? 0) > 1500

  return (
    <li className="row" data-state={state} data-stale={stale ? '' : undefined}>
      <span className="dot" role="img" aria-label={label} />
      <div className="min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="row-name"
        >
          {name}
        </a>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="meta tabular" aria-live="off">
        {!entry ? (
          <span className="skeleton h-4 w-14" />
        ) : (
          <span
            key={`${entry.run}-${entry.status}-${entry.responseTime}`}
            className="reveal"
            data-slow={slow ? '' : undefined}
          >
            {entry.status === 'down'
              ? `Down${entry.httpStatus ? ` · ${entry.httpStatus}` : ''}`
              : `${entry.responseTime} ms`}
          </span>
        )}
      </div>
    </li>
  )
}
