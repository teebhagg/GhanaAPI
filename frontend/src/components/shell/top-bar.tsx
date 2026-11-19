import { Github } from "lucide-react";
import { Link } from "react-router-dom";

import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { externalLinks } from "@/lib/sections";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav />
      <Link
        to="/"
        className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
        <img
          src="/ghana-api.jpeg"
          alt=""
          className="h-7 w-7 rounded-sm object-cover"
        />
        <span className="font-mono text-sm font-semibold tracking-tight">
          ghana-api
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <CommandPalette />
        <Button variant="ghost" size="icon" asChild>
          <a
            href={externalLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository">
            <Github className="h-4 w-4" />
          </a>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
