import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  XCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Badge } from './ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

interface StatusCardProps {
  name: string
  description: string
  url: string
  status: 'operational' | 'down'
  responseTime?: number | null
  httpStatus?: number | null
  isLoading?: boolean
}

export function StatusCard({
  name,
  description,
  url,
  status,
  responseTime,
  httpStatus,
  isLoading = false,
}: StatusCardProps) {
  const isOperational = status === 'operational'

  return (
    <Card
      className={cn(
        'relative transition-all duration-300 hover:shadow-lg',
        isLoading && 'opacity-60',
        isOperational
          ? 'border-green-200/50 hover:border-green-300/50 dark:border-green-900/30'
          : 'border-red-200/50 hover:border-red-300/50 dark:border-red-900/30',
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{name}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {description}
            </CardDescription>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          ) : isOperational ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isLoading ? (
            <>
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            </>
          ) : (
            <>
              <Badge
                variant={isOperational ? 'default' : 'destructive'}
                className="text-xs"
              >
                {isOperational ? 'Operational' : 'Down'}
              </Badge>
              {responseTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  {responseTime}ms
                </Badge>
              )}
              {httpStatus && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="mr-1 h-3 w-3" />
                  {httpStatus}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 truncate rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          <span className="truncate font-mono">{url}</span>
          {!isLoading && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 transition-colors hover:text-primary"
              aria-label={`Open ${name} endpoint`}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
