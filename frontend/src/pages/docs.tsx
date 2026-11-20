import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  Check,
  Copy,
  Github,
  Play,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FeaturePage } from "@/components/feature-page";
import { Chip, FeatureSurface, IconChip } from "@/components/ui/feature-surface";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { externalLinks } from "@/lib/sections";

const links = [
  {
    icon: Play,
    title: "API playground",
    description: "Try every endpoint live in the browser.",
    href: externalLinks.playground,
  },
  {
    icon: BookOpen,
    title: "Documentation site",
    description: "Guides and references for each service.",
    href: externalLinks.docs,
  },
  {
    icon: Github,
    title: "GitHub",
    description: "Browse the source, star it, or contribute.",
    href: externalLinks.github,
  },
  {
    icon: Bug,
    title: "Report an issue",
    description: "Found a bug or missing data? Tell us.",
    href: externalLinks.issues,
  },
];

const roadmap = [
  "REST and GraphQL endpoint references",
  "Authentication & rate-limit guides",
  "SDK examples for TypeScript and Python",
  "Data freshness and compliance notes",
];

const QUICK_START = `curl ${externalLinks.apiBase}/exchange-rates/current`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-muted/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-2 sm:pl-5">
      <code className="min-w-0 flex-1 break-all px-2 py-1 text-sm sm:overflow-x-auto sm:whitespace-nowrap sm:break-normal sm:px-0 sm:py-2">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy command"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)] transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function DocsFeaturePage() {
  return (
    <FeaturePage
      title="Documentation"
      description="Start building with GhanaAPI: try the live playground, read the guides, or make your first request in seconds.">
      <div className="space-y-8">
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show">
          {links.map(({ icon, title, description, href }) => (
            <motion.a
              key={title}
              variants={fadeUp}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <IconChip icon={icon} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </motion.a>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <FeatureSurface
            icon={Rocket}
            title="Make your first request"
            description="No key needed to get started. Paste this into your terminal.">
            <CodeBlock code={QUICK_START} />
            <p className="text-sm text-muted-foreground">
              Every response is JSON. The base URL is{" "}
              <span className="font-semibold text-foreground">{externalLinks.apiBase}</span>.
            </p>
          </FeatureSurface>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <section className="rounded-[2rem] bg-accent/50 p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight">Coming soon to the docs</h2>
              <Chip className="bg-card/70">In progress</Chip>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {roadmap.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-primary-ink">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </motion.div>
      </div>
    </FeaturePage>
  );
}
