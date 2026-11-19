import { NavLink } from "react-router-dom";

import { overviewSection, sections } from "@/lib/sections";
import { cn } from "@/lib/utils";

const all = [
  { ...overviewSection, endpoint: "" },
  ...sections.map(({ to, label, icon, endpoint }) => ({
    to,
    label,
    icon,
    endpoint,
  })),
];

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Sections" className="flex flex-col gap-0.5">
      {all.map(({ to, label, icon: Icon, endpoint }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2.5 border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              isActive
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{label}</span>
          {endpoint && (
            <span className="font-mono text-[11px] opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60">
              {endpoint}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
