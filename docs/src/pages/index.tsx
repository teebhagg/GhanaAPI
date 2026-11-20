import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bitcoin,
  BookOpen,
  DollarSign,
  GraduationCap,
  Landmark,
  Map,
  MapPinned,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

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

const example = `# Current USD rate against the cedi
curl "${BASE}/exchange-rates/current?currencies=USD"

# Search addresses in Accra
curl "${BASE}/addresses/search?q=Accra"

# Nearest address to a coordinate
curl "${BASE}/addresses/lookup?lat=5.6037&lng=-0.187"

# Grade A schools in Ashanti
curl "${BASE}/education/schools/search?region=Ashanti&grade=A"

# All regions
curl "${BASE}/locations/regions"`;

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

        <div className={styles.codeCard}>
          <div className={styles.codeHead}>
            <span className={styles.codeDots}>
              <i />
              <i />
              <i />
            </span>
            <span>Try it in your terminal</span>
          </div>
          <pre className={styles.code}>
            <code>{example}</code>
          </pre>
        </div>
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
