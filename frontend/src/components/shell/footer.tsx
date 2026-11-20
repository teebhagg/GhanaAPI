import { ArrowUpRight, Github, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { externalLinks, sections } from "@/lib/sections";

const developerLinks = [
  ["API playground", externalLinks.playground],
  ["Documentation", externalLinks.docs],
  ["README", externalLinks.readme],
  ["Report an issue", externalLinks.issues],
] as const;

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

const linkClass =
  "group inline-flex items-center gap-1 rounded-full text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Footer() {
  return (
    <footer className="px-4 pb-6 md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-[var(--shadow-soft)]">
        {/* Ghana flag stripe */}
        <div aria-hidden className="flex h-1.5 w-full">
          <span className="flex-1 bg-destructive" />
          <span className="flex-1 bg-primary" />
          <span className="flex-1 bg-success" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-success/10 blur-3xl"
        />

        <div className="relative grid gap-10 p-8 md:grid-cols-[1.4fr_1fr_1fr] md:p-12">
          <div className="space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 rounded-full">
              <img
                src="/ghana-api.jpeg"
                alt=""
                className="h-12 w-12 rounded-full object-cover shadow-[var(--shadow-soft)]"
              />
              <span className="text-2xl font-extrabold tracking-tight">GhanaAPI</span>
            </Link>
            <p className="max-w-sm text-muted-foreground">
              Open data for Ghana, ready to use. Addresses, banks, markets,
              exchange rates, transport and schools in one friendly API.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={externalLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] active:scale-[0.97]">
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
              <a
                href={externalLinks.email}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] active:scale-[0.97]">
                <Mail className="h-4 w-4" />
                Say hello
              </a>
            </div>
          </div>

          <Column title="Explore">
            {sections.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </Column>

          <Column title="Developers">
            {developerLinks.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}>
                  {label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </Column>
        </div>

        <div className="relative flex flex-col gap-3 border-t border-border/60 px-8 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-12 md:pr-24">
          <p>
            © {new Date().getFullYear()} GhanaAPI. Made with care in Ghana. MIT
            licensed.
          </p>
          <div className="flex gap-4">
            <a className="hover:text-foreground" href={externalLinks.privacy}>
              Privacy
            </a>
            <a className="hover:text-foreground" href={externalLinks.terms}>
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
