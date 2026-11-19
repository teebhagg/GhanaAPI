import { Outlet } from "react-router-dom";

import { SideRail } from "@/components/shell/side-rail";
import { TopBar } from "@/components/shell/top-bar";
import { externalLinks } from "@/lib/sections";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1">
        <SideRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-8 md:px-10">
            <Outlet />
          </main>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-4 text-xs text-muted-foreground md:px-10">
            <span>GhanaAPI · MIT licensed · open data for Ghana</span>
            <a
              href={externalLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground">
              github.com/teebhagg/GhanaAPI
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
