import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'

interface StatusStatsProps {
  total: number
  operational: number
  down: number
  lastChecked: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Always show full timestamp for clarity
  const timeStr = date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })

  if (diffMins < 1) {
    return `Just now • ${timeStr}`
  } else if (diffMins < 60) {
    return `${diffMins}m ago • ${timeStr}`
  } else if (diffHours < 24) {
    return `${diffHours}h ago • ${timeStr}`
  } else if (diffDays < 7) {
    return `${diffDays}d ago • ${dateStr} ${timeStr}`
  } else {
    return `${dateStr} ${timeStr}`
  }
}

export function StatusStats({
  total,
  operational,
  down,
  lastChecked,
}: StatusStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Endpoints</CardDescription>
          <CardTitle className="text-3xl">{total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-green-200/50 dark:border-green-900/30">
        <CardHeader className="pb-3">
          <CardDescription>Operational</CardDescription>
          <CardTitle className="text-3xl text-green-600 dark:text-green-500">
            {operational}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-red-200/50 dark:border-red-900/30">
        <CardHeader className="pb-3">
          <CardDescription>Down</CardDescription>
          <CardTitle className="text-3xl text-red-600 dark:text-red-500">
            {down}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Last Checked</CardDescription>
          <CardTitle className="text-base font-semibold text-foreground">
            {formatDate(lastChecked)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
