import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SEO, defaultStructuredData } from "@/components/seo";
import { EndpointChip } from "@/components/ui/panel-header";
import { StatusDot } from "@/components/ui/status-dot";
import { useApiStatus } from "@/hooks/use-api-status";
import { externalLinks, sections } from "@/lib/sections";

export function OverviewPage() {
  const status = useApiStatus();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <SEO structuredData={defaultStructuredData} />

      <header className="space-y-4 border-b pb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            GhanaAPI
          </h1>
          <StatusDot status={status} showLabel />
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Open REST APIs for Ghana: addresses, banking, markets, exchange rates,
          transport and education. Try each one here, or call it directly.
        </p>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Base URL
          </p>
          <code className="inline-block rounded-md border bg-card px-2.5 py-1 font-mono text-sm">
            {externalLinks.apiBase}
          </code>
        </div>
      </header>

      <section aria-labelledby="endpoints-heading" className="space-y-3">
        <h2
          id="endpoints-heading"
          className="text-sm font-medium text-muted-foreground">
          Endpoints
        </h2>
        <ul className="divide-y rounded-md border bg-card">
          {sections.map(({ to, label, description, endpoint, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group grid items-center gap-x-6 gap-y-2 px-4 py-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[10rem_1fr_auto]">
                <span className="flex items-center gap-2.5 font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  {label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
                <span className="flex items-center gap-3">
                  <span className="hidden font-mono text-xs text-muted-foreground lg:inline">
                    {endpoint}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Quick start</h2>
        <EndpointChip path="/exchange-rates/current" />
        <p className="text-sm text-muted-foreground">
          Full reference in the{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={externalLinks.playground}
            target="_blank"
            rel="noopener noreferrer">
            API playground
          </a>{" "}
          and{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={externalLinks.docs}
            target="_blank"
            rel="noopener noreferrer">
            documentation
          </a>
          .
        </p>
      </section>
    </div>
  );
}
