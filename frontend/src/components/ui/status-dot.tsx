import type { ApiStatus } from "@/hooks/use-api-status";
import { cn } from "@/lib/utils";

const styles: Record<ApiStatus, { dot: string; label: string }> = {
  ok: { dot: "bg-success", label: "All systems go" },
  down: { dot: "bg-destructive", label: "Having trouble" },
  unknown: { dot: "bg-muted-foreground/50", label: "Status unknown" },
};

export function StatusDot({
  status,
  showLabel = true,
  className,
}: {
  status: ApiStatus;
  showLabel?: boolean;
  className?: string;
}) {
  const { dot, label } = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      title={label}>
      <span
        role="img"
        aria-label={label}
        className={cn("h-2 w-2 rounded-full", dot)}
      />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
