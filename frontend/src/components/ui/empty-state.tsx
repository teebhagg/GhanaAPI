import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  compact = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        cn(
          "flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-border bg-card/60 px-6 text-center",
          compact ? "py-8" : "py-14",
        ),
        className,
      )}>
      <span className="flex size-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
