import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  AddressesIcon,
  BankingIcon,
  EducationIcon,
  ExchangeIcon,
  StocksIcon,
  TransportIcon,
} from "@/components/overview/animated-icons";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { sections } from "@/lib/sections";
import { cn } from "@/lib/utils";

const animatedIcons: Record<string, (p: { className?: string }) => ReactNode> = {
  "/addresses": AddressesIcon,
  "/banking": BankingIcon,
  "/stocks": StocksIcon,
  "/exchange": ExchangeIcon,
  "/transport": TransportIcon,
  "/education": EducationIcon,
};

const layout: Record<string, { span: string; tint: string; large?: boolean }> = {
  "/addresses": {
    span: "sm:col-span-2 lg:col-span-2 lg:row-span-2",
    tint: "from-primary/25 to-transparent",
    large: true,
  },
  "/banking": { span: "", tint: "from-success/15 to-transparent" },
  "/stocks": { span: "", tint: "from-primary/15 to-transparent" },
  "/exchange": {
    span: "sm:col-span-2 lg:col-span-2",
    tint: "from-destructive/10 to-transparent",
  },
  "/transport": {
    span: "sm:col-span-2 lg:col-span-2",
    tint: "from-success/20 to-transparent",
  },
  "/education": {
    span: "sm:col-span-2 lg:col-span-2",
    tint: "from-primary/20 to-transparent",
  },
};

export function BentoGrid() {
  return (
    <motion.ul
      className="grid auto-rows-[minmax(11rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}>
      {sections.map(({ to, label, description }) => {
        const cfg = layout[to] ?? { span: "", tint: "" };
        const Icon = animatedIcons[to];
        return (
          <motion.li key={to} variants={fadeUp} className={cn("min-w-0", cfg.span)}>
            <Link
              to={to}
              className="group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity group-hover:opacity-100",
                  cfg.tint,
                )}
              />
              <span
                className={cn(
                  "relative flex items-center justify-center rounded-3xl bg-background/80 text-accent-foreground shadow-[var(--shadow-soft)]",
                  cfg.large ? "h-20 w-20" : "h-14 w-14",
                )}>
                {Icon && <Icon className={cfg.large ? "h-10 w-10" : "h-7 w-7"} />}
              </span>
              <div className="relative space-y-1.5">
                <h3 className={cn("font-bold", cfg.large ? "text-2xl" : "text-lg")}>
                  {label}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
                <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-primary-ink">
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
