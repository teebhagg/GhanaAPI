import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  value,
  label,
  icon: Icon,
  className,
}: {
  value: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]",
        className,
      )}>
      {Icon && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
