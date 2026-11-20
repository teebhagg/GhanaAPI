import { Github } from "lucide-react";
import { Link } from "react-router-dom";

import { CommandPalette } from "@/components/shell/command-palette";
import { MenuSheet } from "@/components/shell/menu-sheet";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { StatusDot } from "@/components/ui/status-dot";
import { useApiStatus } from "@/hooks/use-api-status";
import { externalLinks } from "@/lib/sections";

export function TopBar() {
  const status = useApiStatus();

  return (
    <header className="sticky top-0 z-40 px-4 py-3 md:px-8">
      {/* Progressive blur extends below the bar so content fades out beneath it */}
      <ProgressiveBlur className="-z-10 h-[calc(100%+2.5rem)] top-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+2.5rem)] bg-gradient-to-b from-background/85 via-background/40 to-transparent"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-full pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img
            src="/ghana-api.jpeg"
            alt=""
            className="h-10 w-10 rounded-full object-cover shadow-[var(--shadow-soft)]"
          />
          <span className="text-lg font-bold tracking-tight">GhanaAPI</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <StatusDot status={status} className="mr-1 hidden whitespace-nowrap md:inline-flex" />
          <CommandPalette />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex">
            <a
              href={externalLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
          <MenuSheet />
        </div>
      </div>
    </header>
  );
}
