import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bitcoin,
  BookOpen,
  Check,
  Copy,
  DollarSign,
  GraduationCap,
  Landmark,
  Map,
  MapPinned,
  Route,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import styles from "./index.module.css";

const BASE = "https://api.ghana-api.dev/api/v1";

const services: {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}[] = [
  {
    icon: MapPinned,
    title: "Addresses",
    description: "Search addresses and reverse-geocode coordinates across Ghana.",
    to: "/docs/api/addresses",
  },
  {
    icon: Banknote,
    title: "Banking & ATMs",
    description: "Find banks and ATMs by name, region, city or distance.",
    to: "/docs/api/banking",
  },
  {
    icon: DollarSign,
    title: "Exchange rates",
    description: "Live GHS rates, conversion and history from Bank of Ghana.",
    to: "/docs/api/exchange-rates",
  },
  {
    icon: Bitcoin,
    title: "Crypto prices",
    description: "Cryptocurrency prices in USD and GHS with caching and fallbacks.",
    to: "/docs/api/crypto",
  },
  {
    icon: Landmark,
    title: "Stock market",
    description: "Ghana Stock Exchange prices, sectors and market summaries.",
    to: "/docs/api/stock-market",
  },
  {
    icon: Route,
    title: "Transport",
    description: "Route planning, stops, fuel prices and travel cost estimates.",
    to: "/docs/api/transport",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "National school directory with filters and statistics.",
    to: "/docs/api/education",
  },
  {
    icon: Map,
    title: "Locations",
    description: "Regions, districts and administrative metadata.",
    to: "/docs/api/locations",
  },
];

type Cmd = { comment: string; url: string; output?: boolean };

const commands: Cmd[] = [
  {
    comment: "Current USD rate against the cedi",
    url: `${BASE}/exchange-rates/current?currencies=USD`,
    output: true,
  },
  { comment: "Search addresses in Accra", url: `${BASE}/addresses/search?q=Accra` },
  {
    comment: "Nearest address to a coordinate",
    url: `${BASE}/addresses/lookup?lat=5.6037&lng=-0.187`,
  },
  {
    comment: "Grade A schools in Ashanti",
    url: `${BASE}/education/schools/search?region=Ashanti&grade=A`,
  },
  { comment: "All regions", url: `${BASE}/locations/regions` },
];

const copyText = commands
  .map((c) => `# ${c.comment}\ncurl "${c.url}"`)
  .join("\n\n");

function Url({ url }: { url: string }) {
  const [path, query] = url.split("?");
  return (
    <span className={styles.tUrl}>
      "<span className={styles.tBase}>{BASE}</span>
      <span className={styles.tPath}>{path.slice(BASE.length)}</span>
      {query && (
        <>
          ?
          {query.split("&").map((kv, i) => {
            const [k, v] = kv.split("=");
            return (
              <span key={kv}>
                {i > 0 && "&"}
                <span className={styles.tKey}>{k}</span>=
                <span className={styles.tVal}>{v}</span>
              </span>
            );
          })}
        </>
      )}
      "
    </span>
  );
}

function Terminal() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.termBar}>
        <span className={styles.termDots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.termTitle}>~/ghana-api: zsh</span>
        <button type="button" className={styles.copyBtn} onClick={copy} aria-label="Copy commands">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className={styles.termBody}>
        {commands.map((c, i) => (
          <div key={c.url} className={styles.cmd} style={{ "--i": i } as React.CSSProperties}>
            <div className={styles.tComment}># {c.comment}</div>
            <div>
              <span className={styles.tPrompt}>$</span>
              <span className={styles.tCurl}>curl</span> <Url url={c.url} />
            </div>
            {c.output && (
              <div className={styles.out}>
                <span className={styles.outHead}>200 OK</span>
                {"[{ "}
                <span className={styles.jKey}>"targetCurrency"</span>:{" "}
                <span className={styles.jStr}>"USD"</span>,{" "}
                <span className={styles.jKey}>"rate"</span>:{" "}
                <span className={styles.jNum}>0.0849</span>,{" "}
                <span className={styles.jKey}>"provider"</span>:{" "}
                <span className={styles.jStr}>"bank-of-ghana"</span>
                {" }]"}
              </div>
            )}
          </div>
        ))}
        <div className={styles.cmd} style={{ "--i": commands.length } as React.CSSProperties}>
          <span className={styles.tPrompt}>$</span>
          <span className={styles.cursor} />
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <span className={styles.pill}>
            <span className={styles.dot} />
            Free and open source
          </span>
          <Heading as="h1" className={styles.title}>
            Open data for Ghana, ready to use
          </Heading>
          <p className={styles.subtitle}>
            One friendly REST API for addresses, banks, markets, exchange rates,
            transport and schools. No key needed to get started.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              Get started <ArrowRight size={18} />
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://api.ghana-api.dev/docs">
              API playground <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={styles.stats}>
            <div>
              <strong>35+</strong>
              <span>Endpoints</span>
            </div>
            <div>
              <strong>8</strong>
              <span>Services</span>
            </div>
            <div>
              <strong>16</strong>
              <span>Regions</span>
            </div>
          </div>
        </div>

        <Terminal />
      </div>
    </header>
  );
}

function Services() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <Heading as="h2">What you can build with</Heading>
        <p>Eight services that share the same conventions and response shapes.</p>
      </div>
      <div className={styles.grid}>
        {services.map(({ icon: Icon, title, description, to }) => (
          <Link key={to} to={to} className={styles.card}>
            <span className={styles.iconChip}>
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className={styles.cardLink}>
              Read the docs <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className={styles.cta}>
      <BookOpen size={28} />
      <Heading as="h2">Help shape Ghana's open data</Heading>
      <p>
        Contribute code, improve the docs or add a new data source. Every pull
        request helps developers across the country.
      </p>
      <div className={styles.buttons}>
        <Link className="button button--primary button--lg" to="/docs/contributing/overview">
          Start contributing
        </Link>
        <Link className="button button--secondary button--lg" to="/docs/api/overview">
          Read the API overview
        </Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="GhanaAPI: open data for Ghana"
      description="A free REST API for Ghanaian addresses, banks, exchange rates, stocks, transport, education and location data.">
      <Hero />
      <main>
        <Services />
        <Cta />
      </main>
    </Layout>
  );
}
