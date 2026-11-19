import type { ApiStatus } from "@/hooks/use-api-status";
import { cn } from "@/lib/utils";

const styles: Record<ApiStatus, { dot: string; label: string }> = {
  ok: { dot: "bg-primary", label: "Operational" },
  down: { dot: "bg-destructive", label: "Degraded" },
  unknown: { dot: "bg-muted-foreground/40", label: "Status unknown" },
};

export function StatusDot({
  status,
  showLabel = false,
  className,
}: {
  status: ApiStatus;
  showLabel?: boolean;
  className?: string;
}) {
  const { dot, label } = styles[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs", className)}
      title={label}>
      <span
        role="img"
        aria-label={label}
        className={cn("h-2 w-2 rounded-full", dot)}
      />
      {showLabel && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
