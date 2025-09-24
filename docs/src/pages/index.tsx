import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <div className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.badge}>
              <span>🚀 Version 0.3.0</span>
            </div>
            <Heading as="h1" className={styles.heroTitle}>
              Ghana API
            </Heading>
            <p className={styles.heroSubtitle}>
              The definitive REST API for Ghanaian services. Access
              comprehensive data for addresses, banking facilities, exchange
              rates, transport & logistics, and administrative information with
              our reliable, developer-friendly platform.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>18</span>
                <span className={styles.statLabel}>API Endpoints</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>4</span>
                <span className={styles.statLabel}>Currencies</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>16</span>
                <span className={styles.statLabel}>Regions</span>
              </div>
            </div>
            <div className={styles.heroButtons}>
              <Link
                className={clsx(
                  "button button--primary button--lg",
                  styles.primaryButton
                )}
                to="/docs/intro">
                🚀 Get Started
              </Link>
              <Link
                className={clsx(
                  "button button--outline button--lg",
                  styles.secondaryButton
                )}
                to="/docs/api/overview">
                📚 View Documentation
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot}></span>
                <span className={styles.codeDot}></span>
                <span className={styles.codeDot}></span>
                <span className={styles.codeTitle}>api-example.js</span>
              </div>
              <pre className={styles.codeContent}>
                <code>{`// Get exchange rates
const rates = await fetch(
  'https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD'
);

// Search addresses
const addresses = await fetch(
  'https://api.ghana-api.dev/v1/addresses/search?q=Accra'
);

// Find nearby banks and ATMs
const banks = await fetch(
  'https://api.ghana-api.dev/v1/banking/nearby?lat=5.6037&lng=-0.187'
);

// Calculate route
const route = await fetch(
  'https://api.ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244'
);

// Get fuel prices
const fuel = await fetch(
  'https://api.ghana-api.dev/v1/transport/fuel-prices'
);

// Get regions
const regions = await fetch(
  'https://api.ghana-api.dev/v1/locations/regions'
);

// Reverse geocoding
const location = await fetch(
  'https://api.ghana-api.dev/v1/addresses/reverse?lat=5.6037&lng=-0.1870'
);

// Currency conversion
const conversion = await fetch(
  'https://api.ghana-api.dev/v1/exchange-rates/convert?from=USD&to=GHS&amount=100'
);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What We Offer</h2>
          <p className={styles.sectionSubtitle}>
            Comprehensive APIs designed specifically for Ghanaian developers and
            businesses
          </p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🏠</div>
            <h3>Address Services</h3>
            <p>
              Search and validate Ghana Post Digital Addresses with precise
              geocoding capabilities
            </p>
            <Link to="/docs/api/addresses" className={styles.featureLink}>
              Learn More →
            </Link>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🏦</div>
            <h3>Banking & ATM Locator</h3>
            <p>
              Find banks and ATMs across Ghana with location-based search and
              real-time facility information
            </p>
            <Link to="/docs/api/banking" className={styles.featureLink}>
              Learn More →
            </Link>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💱</div>
            <h3>Exchange Rates</h3>
            <p>
              Real-time currency exchange rates from Bank of Ghana and multiple
              providers
            </p>
            <Link to="/docs/api/exchange-rates" className={styles.featureLink}>
              Learn More →
            </Link>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚗</div>
            <h3>Transport & Logistics</h3>
            <p>
              Route planning, transport stops, fuel prices, and travel cost
              estimation for major Ghanaian cities
            </p>
            <Link to="/docs/api/transport" className={styles.featureLink}>
              Learn More →
            </Link>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>�🗺️</div>
            <h3>Location Data</h3>
            <p>
              Comprehensive administrative and geographic information for all
              Ghanaian regions
            </p>
            <Link to="/docs/api/locations" className={styles.featureLink}>
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <h2>Ready to Get Started?</h2>
          <p>
            Join thousands of developers building amazing applications with
            Ghana API
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className={clsx(
                "button button--primary button--lg",
                styles.ctaPrimaryButton
              )}
              to="/docs/contributing/overview">
              Start Building Now
            </Link>
            <Link
              className={clsx(
                "button button--outline button--lg",
                styles.ctaSecondaryButton
              )}
              href="https://github.com/teebhagg/GhanaAPI">
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Ghana API - Address Services, Banking, Exchange Rates, Transport & Location Data"
      description="Comprehensive APIs for Ghana including address validation, bank & ATM locator, real-time exchange rates, transport & logistics, and administrative location data. Free to use with reliable data from Bank of Ghana and official sources.">
      <HomepageHeader />
      <main className={styles.main}>
        <FeaturesSection />
        <CTASection />
      </main>
    </Layout>
  );
}
