import { AddressesPanel } from "@/components/addresses-panel";
import { BankingPanel } from "@/components/banking-panel";
import { DocsPage } from "@/components/docs-page";
import { EnhancedTransportExplorer } from "@/components/enhanced-transport-explorer";
import { ExchangeRatesPanel } from "@/components/exchange-rates-panel";
import { Footer } from "@/components/footer";
import { LocationsPanel } from "@/components/locations-panel";
import { Navbar } from "@/components/navbar";
import { RouteSEO } from "@/components/route-seo";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SEO, defaultStructuredData } from "@/components/seo";
import { StockMarketPanel } from "@/components/stock-market-panel";
import { motion } from "framer-motion";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO structuredData={defaultStructuredData} />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <header className="flex flex-col gap-4 items-center text-center mb-16">
            <motion.h1
              className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              GhanaAPI Explorer
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-lg max-w-2xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>
              Explore Ghana's comprehensive API services for addresses, banking,
              locations, stock market data, transport directions, and real-time
              exchange rates
            </motion.p>
          </header>

          <div className="space-y-20">
            <motion.section
              id="addresses"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Address Lookup & Validation
                </h2>
                <p className="text-muted-foreground text-lg">
                  Search and validate addresses across Ghana with precise
                  geocoding
                </p>
              </div>
              <AddressesPanel />
            </motion.section>

            <motion.section
              id="banking"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Bank & ATM Locator</h2>
                <p className="text-muted-foreground text-lg">
                  Find banks and ATMs across Ghana with location-based search
                </p>
              </div>
              <BankingPanel />
            </motion.section>

            <motion.section
              id="stocks"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Ghana Stock Exchange
                </h2>
                <p className="text-muted-foreground text-lg">
                  Real-time stock market data from the Ghana Stock Exchange
                  (GSE)
                </p>
              </div>
              <StockMarketPanel />
            </motion.section>

            <motion.section
              id="locations"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Ghana Regions & Districts
                </h2>
                <p className="text-muted-foreground text-lg">
                  Explore administrative divisions and regional information
                </p>
              </div>
              <LocationsPanel />
            </motion.section>

            <motion.section
              id="fx"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Currency Exchange & Rates
                </h2>
                <p className="text-muted-foreground text-lg">
                  Get real-time exchange rates and convert currencies
                </p>
              </div>
              <ExchangeRatesPanel />
            </motion.section>

            <motion.section
              id="transport"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="scroll-mt-24">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  Transport & Logistics Services
                </h2>
                <p className="text-muted-foreground text-lg">
                  Get route directions, check fuel prices, and find nearby
                  transport stops
                </p>
              </div>
              <EnhancedTransportExplorer />
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <RouteSEO />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
        <Footer />
        <ScrollToTop />
      </div>
    </Router>
  );
}

export default App;
