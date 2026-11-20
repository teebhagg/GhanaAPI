import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { externalLinks, overviewSection, sections } from "@/lib/sections";
import { cn } from "@/lib/utils";

const rows = [
  { ...overviewSection, description: "Start here for a tour of everything." },
  ...sections,
];

const resources = [
  { label: "API playground", description: "Try every endpoint live.", href: externalLinks.playground },
  { label: "Documentation", description: "Guides and references.", href: externalLinks.docs },
  { label: "GitHub", description: "Star the repo, open an issue.", href: externalLinks.github },
];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};
const item = {
  hidden: { opacity: 0, x: 36, scale: 0.96 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 140, damping: 22, mass: 1 },
  },
};

/** Hamburger that morphs into an X as the sheet opens. */
function MenuIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 h-[2px] w-full rounded-full bg-current transition-all duration-300";
  return (
    <span aria-hidden className="relative block h-3.5 w-[18px]">
      <span className={cn(bar, open ? "top-1.5 rotate-45" : "top-0")} />
      <span className={cn(bar, "top-1.5", open && "scale-x-0 opacity-0")} />
      <span className={cn(bar, open ? "top-1.5 -rotate-45" : "top-3")} />
    </span>
  );
}

/**
 * Text that rolls letter by letter: the outgoing word slides up and blurs
 * away while the incoming word rises into place, each letter slightly
 * staggered.
 */
function RollingLabel({ open }: { open: boolean }) {
  const letter = (ch: string, i: number, visible: boolean, dir: 1 | -1) => (
    <span
      key={i}
      aria-hidden
      className="inline-block transition-[transform,opacity,filter]"
      style={{
        transform: visible ? "translateY(0)" : `translateY(${dir * 110}%)`,
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0px)" : "blur(3px)",
        transitionDuration: `${DURATION_MS - 120}ms`,
        transitionTimingFunction: EASE,
        transitionDelay: `${i * 30}ms`,
      }}>
      {ch}
    </span>
  );

  return (
    <span className="relative inline-grid h-[1.4em] place-items-center overflow-hidden leading-[1.4]">
      <span className="col-start-1 row-start-1 flex">
        {"Menu".split("").map((c, i) => letter(c, i, !open, -1))}
      </span>
      <span className="col-start-1 row-start-1 flex">
        {"Close".split("").map((c, i) => letter(c, i, open, 1))}
      </span>
      <span className="sr-only">{open ? "Close" : "Menu"}</span>
    </span>
  );
}

// One duration + easing drives the sheet slide, the button's move, its colour
// change and the letter roll so they all land together.
const DURATION_MS = 500;
const EASE = "cubic-bezier(0.32,0.72,0,1)";

const MOBILE_EDGE = 24; // button inset from the right edge inside a full-bleed sheet
const FLOAT_EDGE = 36; // 12px sheet margin + 24px inner padding on larger screens

export function MenuSheet() {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && buttonRef.current) {
      // Slide the one shared button to sit neatly inside the sheet's corner.
      const { right } = buttonRef.current.getBoundingClientRect();
      const floating = window.matchMedia("(min-width: 640px)").matches;
      const edge = floating ? FLOAT_EDGE : MOBILE_EDGE;
      setShift({
        x: document.documentElement.clientWidth - edge - right,
        y: floating ? 12 : 0,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      {/* Keeps the header layout; the real button floats above the sheet. */}
      <span aria-hidden className="block h-11 w-11 shrink-0 md:w-24" />

      {createPortal(
        <div
          aria-live="off"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-7xl justify-end">
            <button
              ref={buttonRef}
              type="button"
              data-menu-button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={toggle}
              style={{
                pointerEvents: "auto",
                translate: open ? `${shift.x}px ${shift.y}px` : "0px 0px",
                transitionDuration: `${DURATION_MS}ms`,
                transitionTimingFunction: EASE,
              }}
              className={cn(
                "group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-[var(--shadow-soft)] transition-[translate,background-color,color,box-shadow,scale]",
                // Tablet and desktop: text-only pill, faint amber that turns red when open
                "md:w-24 md:border-transparent md:text-sm md:font-semibold md:tracking-wide md:shadow-none",
                open
                  ? "md:bg-destructive md:text-white md:hover:bg-destructive/90"
                  : "md:bg-primary/15 md:text-primary-ink md:hover:bg-primary/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]",
              )}>
              <span className="md:hidden">
                <MenuIcon open={open} />
              </span>
              <span className="hidden md:block">
                <RollingLabel open={open} />
              </span>
            </button>
          </div>
        </div>,
        document.body,
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showClose={false}
          onPointerDownOutside={(e) => {
            // The shared button toggles the sheet itself.
            if ((e.target as HTMLElement).closest("[data-menu-button]")) {
              e.preventDefault();
            }
          }}
          className="w-full gap-0 rounded-none border-0 p-0 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-500 data-[state=open]:duration-500 shadow-[var(--shadow-lift)] sm:inset-y-3 sm:right-3 sm:h-[calc(100%-1.5rem)] sm:w-[27rem] sm:max-w-none sm:rounded-[2rem] sm:border sm:border-border/60">
        {/* Scrolling list sits under both blurred edges */}
        <div className="h-full overflow-y-auto overscroll-contain rounded-[inherit] pb-24 pt-24">
          <motion.nav
            aria-label="Sections"
            variants={list}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2 px-4">
            {rows.map(({ to, label, description, icon: Icon }) => (
              <motion.div key={to} variants={item}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-4 rounded-3xl p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                        : "hover:bg-accent",
                    )
                  }>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{label}</span>
                    <span className="line-clamp-2 block text-sm opacity-70">
                      {description}
                    </span>
                  </span>
                </NavLink>
              </motion.div>
            ))}

            <motion.p
              variants={item}
              className="px-4 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resources
            </motion.p>
            {resources.map(({ label, description, href }) => (
              <motion.a
                key={href}
                variants={item}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-3xl p-4 transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
              </motion.a>
            ))}
          </motion.nav>
        </div>

        {/* Top edge: progressive blur + pinned title and close button */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 rounded-t-[inherit]">
          <ProgressiveBlur className="top-0 h-24 rounded-t-[inherit]" maxBlur={8} />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-24 rounded-t-[inherit] bg-gradient-to-b from-background/95 via-background/55 to-transparent"
          />
          <div className="pointer-events-auto relative flex h-11 items-center px-6 pr-36 pt-0 mt-3 mb-4">
            <SheetTitle className="text-xl font-bold">Explore GhanaAPI</SheetTitle>
            <SheetDescription className="sr-only">
              Choose a section to explore.
            </SheetDescription>
          </div>
        </div>

        {/* Bottom edge: progressive blur fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 rounded-b-[inherit]">
          <ProgressiveBlur position="bottom" className="bottom-0 h-24 rounded-b-[inherit]" maxBlur={8} />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 rounded-b-[inherit] bg-gradient-to-t from-background/95 via-background/55 to-transparent"
          />
        </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
