import { ExternalLink } from "lucide-react";

import { NavList } from "@/components/shell/nav-list";
import { StatusDot } from "@/components/ui/status-dot";
import { useApiStatus } from "@/hooks/use-api-status";
import { externalLinks } from "@/lib/sections";

export function SideRail() {
  const status = useApiStatus();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col justify-between overflow-y-auto border-r px-3 py-6 md:flex">
      <NavList />
      <div className="space-y-3 px-3 text-xs text-muted-foreground">
        <StatusDot status={status} showLabel />
        <a
          href={externalLinks.playground}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground">
          API playground <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={externalLinks.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground">
          Documentation <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}
