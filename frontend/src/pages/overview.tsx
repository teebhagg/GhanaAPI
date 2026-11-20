import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Database, Globe2, Layers, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { BentoGrid } from "@/components/overview/bento-grid";
import { SEO, defaultStructuredData } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { StatCard } from "@/components/ui/stat-card";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { externalLinks } from "@/lib/sections";

function HeroBackdrop() {
  const reduce = useReducedMotion();
  const drift = (x: number, y: number, d: number) =>
    reduce
      ? {}
      : {
          animate: { x: [0, x, 0], y: [0, y, 0] },
          transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
      <motion.div
        className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
        {...drift(40, 30, 14)}
      />
      <motion.div
        className="absolute -right-10 top-10 h-64 w-64 rounded-full bg-success/25 blur-3xl"
        {...drift(-30, 40, 17)}
      />
      <motion.div
        className="absolute bottom-[-4rem] left-1/3 h-56 w-56 rounded-full bg-destructive/20 blur-3xl"
        {...drift(30, -30, 19)}
      />
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-12">
      <SEO structuredData={defaultStructuredData} />

      <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-border/60 bg-card px-6 py-16 text-center shadow-[var(--shadow-soft)] md:px-16 md:py-24">
        <HeroBackdrop />
        <motion.div
          className="relative mx-auto max-w-2xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show">
          <motion.p
            variants={fadeUp}
            className="text-lg font-bold tracking-tight md:text-xl">
            <DiaTextReveal
              text={[
                "Free and open source",
                "Built for Ghana",
                "Ready for your next app",
              ]}
              colors={["#ce1126", "#fcd116", "#00a859", "#fcd116", "#ce1126"]}
              duration={1.8}
              repeat
              repeatDelay={1.8}
            />
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Open data for Ghana, ready to use
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg text-muted-foreground md:text-xl">
            Addresses, banks, markets, exchange rates, transport and schools in
            one friendly API. Explore it here, then build with it.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/addresses">
                Start exploring <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href={externalLinks.playground}
                target="_blank"
                rel="noopener noreferrer">
                API playground
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard value="6" label="Data areas to explore" icon={Layers} />
        <StatCard value="REST + JSON" label="Simple to integrate" icon={Zap} />
        <StatCard value="Open" label="Free for everyone" icon={Globe2} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Database className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">What you can explore</h2>
        </div>
        <BentoGrid />
      </section>
    </div>
  );
}
