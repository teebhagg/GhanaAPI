import {
  ArrowRight,
  Banknote,
  BookText,
  Building2,
  DollarSign,
  Landmark,
  MapPinned,
  Route,
} from "lucide-react";
import { Link } from "react-router-dom";

import { SEO, defaultStructuredData } from "@/components/seo";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    name: "Address Intelligence",
    description:
      "Validate, geocode, and normalize addresses with datasets covering all 261 districts.",
    to: "/addresses",
    cta: "Explore addresses",
    Icon: MapPinned,
    className: "md:col-span-1 md:row-span-2",
    background: (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl transition-all duration-300 group-hover:bg-primary/30" />
        <div className="absolute top-6 right-6 rounded-2xl border border-primary/20 bg-background/80 px-4 py-3 text-left text-xs font-mono text-primary/80 shadow-sm">
          <p>GET /addresses/search</p>
          <p className="text-muted-foreground">q=Kwabre East&nbsp;District</p>
        </div>
      </div>
    ),
  },
  {
    name: "Banking Coverage",
    description:
      "Surface institutions, ATM availability, and service metadata for every banking agent.",
    to: "/banking",
    cta: "Open banking data",
    Icon: Banknote,
    className: "md:col-span-1 md:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-6">
        <div className="h-28 w-28 rounded-full bg-emerald-200/40 blur-2xl transition-all duration-300 group-hover:bg-emerald-200/60" />
      </div>
    ),
  },
  {
    name: "Market Pulse",
    description:
      "Monitor Ghana Stock Exchange listings with quotes, market caps, and trading volumes.",
    to: "/stocks",
    cta: "View stock data",
    Icon: Landmark,
    className: "md:col-span-1 md:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-36 rounded-full bg-amber-200/40 blur-2xl transition-all duration-300 group-hover:bg-amber-200/60" />
      </div>
    ),
  },
  {
    name: "Regional Atlas",
    description:
      "Navigate Ghana's regional hierarchy with boundaries, populations, and locality stats.",
    to: "/locations",
    cta: "Browse regions",
    Icon: Building2,
    className: "md:col-span-2 md:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-200/40 blur-2xl transition-all duration-300 group-hover:bg-cyan-200/60" />
      </div>
    ),
  },
  {
    name: "Forex Benchmarks",
    description:
      "Stream daily FX rates and conversions across the top traded currency pairs.",
    to: "/exchange",
    cta: "Check FX rates",
    Icon: DollarSign,
    className: "lg:col-span-2 lg:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-6">
        <div className="h-20 w-32 rounded-full bg-sky-200/40 blur-2xl transition-all duration-300 group-hover:bg-sky-200/60" />
      </div>
    ),
  },
  {
    name: "Transport Planner",
    description:
      "Plot routes, inspect stops, and price journeys with Ghana's multimodal transport feed.",
    to: "/transport",
    cta: "Plan transport",
    Icon: Route,
    className: "lg:col-span-1 lg:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-purple-200/40 blur-3xl transition-all duration-300 group-hover:bg-purple-200/60" />
        <div className="absolute right-6 top-6 rounded-full border border-purple-300/40 bg-background/70 px-3 py-1 text-xs uppercase tracking-wide text-purple-800/70">
          GTFS feeds
        </div>
      </div>
    ),
  },
  {
    name: "API Reference",
    description:
      "Track documentation updates, SDK releases, and schema changes for every module.",
    to: "/docs",
    cta: "Read docs",
    Icon: BookText,
    className: "md:col-span-1 md:row-span-1",
    background: (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-20 w-36 rounded-xl border border-dashed border-neutral-300/60 bg-neutral-100/40 text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition-all duration-300 group-hover:border-neutral-400">
          <div className="flex h-full w-full items-center justify-center">
            docs.wip
          </div>
        </div>
      </div>
    ),
  },
];

export function OverviewPage() {
  return (
    <div className="space-y-10">
      <SEO structuredData={defaultStructuredData} />
      <div className="space-y-4 text-center md:text-left">
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Build with trusted Ghana data APIs
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Choose a capability to deep dive via the dock or jump straight in
              below.
            </p>
          </div>
          <Link
            to="/docs"
            className="hidden items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80 md:flex">
            View documentation updates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <BentoGrid className="sm:auto-rows-[18rem] md:auto-rows-[20rem] lg:auto-rows-[22rem]">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
