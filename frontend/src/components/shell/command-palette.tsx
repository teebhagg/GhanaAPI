import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { externalLinks, overviewSection, sections } from "@/lib/sections";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  hint: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => navigate(to);
    const ext = (url: string) => () => window.open(url, "_blank", "noopener");
    return [
      { label: overviewSection.label, hint: "/", run: go("/") },
      ...sections.map((s) => ({
        label: s.label,
        hint: s.endpoint,
        run: go(s.to),
      })),
      { label: "Documentation", hint: "docs", run: ext(externalLinks.docs) },
      {
        label: "API playground (Swagger)",
        hint: "/docs",
        run: ext(externalLinks.playground),
      },
      { label: "GitHub", hint: "repo", run: ext(externalLinks.github) },
    ];
  }, [navigate]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.hint.toLowerCase().includes(q),
        )
      : items;
  }, [items, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    item.run();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-10 gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open command palette">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded-full bg-muted px-2 text-[10px] font-semibold sm:inline">
          /
        </kbd>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setQuery("");
            setActive(0);
          }
        }}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search sections and links. Use arrow keys and Enter.
          </DialogDescription>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(results[active]);
              }
            }}
            placeholder="Go to…"
            aria-label="Search sections"
            className="w-full border-b bg-transparent px-6 py-4 text-base outline-none placeholder:text-muted-foreground"
          />
          <ul role="listbox" className="max-h-80 overflow-auto p-2">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches
              </li>
            )}
            {results.map((item, i) => (
              <li
                key={item.label}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium",
                  i === active && "bg-accent text-accent-foreground",
                )}>
                <span>{item.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {item.hint}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
