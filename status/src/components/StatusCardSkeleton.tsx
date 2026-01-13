import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

export function StatusCardSkeleton() {
  return (
    <Card className="border-muted/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <CardTitle className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <CardDescription className="space-y-1">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardDescription>
          </div>
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-8 w-full animate-pulse rounded-md bg-muted/50" />
      </CardContent>
    </Card>
  )
}
