import { Activity, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface StatusHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  countdown: number
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

export function StatusHeader({
  onRefresh,
  isRefreshing,
  countdown,
}: StatusHeaderProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex md:flex-row flex-col md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              GhanaAPI Status
            </h1>
            <p className="mt-1 text-muted-foreground">
              Real-time status monitoring for all API endpoints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {countdown > 0 && (
            <div className="text-sm text-muted-foreground block">
              <span>Next refresh in </span>
              <span className="font-mono font-semibold text-foreground">
                {formatCountdown(countdown)}
              </span>
            </div>
          )}
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
