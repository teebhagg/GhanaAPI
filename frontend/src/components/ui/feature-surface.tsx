import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Rounded icon tile used across feature panels. */
export function IconChip({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground",
        size === "md" ? "size-12" : "size-10",
        className,
      )}>
      <Icon className={size === "md" ? "size-5" : "size-4"} />
    </span>
  );
}

/** Small pill for metadata such as codes, counts and categories. */
export function Chip({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}>
      {Icon && <Icon className="size-3.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Panel container: soft rounded surface with an icon header. */
export function FeatureSurface({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-6 rounded-[2rem] border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] md:p-8",
        className,
      )}>
      <header className="flex items-start gap-4">
        <IconChip icon={icon} />
        <div className="min-w-0 space-y-1 pt-0.5">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
