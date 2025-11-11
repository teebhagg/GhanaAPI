import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { AppDockLayout } from "@/components/app-dock-layout";
import { RouteSEO } from "@/components/route-seo";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AddressesPage } from "@/pages/addresses";
import { BankingPage } from "@/pages/banking";
import { DocsFeaturePage } from "@/pages/docs";
import { ExchangePage } from "@/pages/exchange";
import { LocationsPage } from "@/pages/locations";
import { OverviewPage } from "@/pages/overview";
import { StocksPage } from "@/pages/stocks";
import { TransportPage } from "@/pages/transport";

import "./App.css";
import { Footer } from "./components/footer";
import { Navbar } from "./components/navbar";

function App() {
  return (
    <Router>
      <RouteSEO />
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route element={<AppDockLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="banking" element={<BankingPage />} />
          <Route path="stocks" element={<StocksPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="exchange" element={<ExchangePage />} />
          <Route path="transport" element={<TransportPage />} />
          <Route path="docs" element={<DocsFeaturePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
