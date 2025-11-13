import { useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";

import { AppDockLayout } from "@/components/app-dock-layout";
import { RouteSEO } from "@/components/route-seo";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AddressesPage } from "@/pages/addresses";
import { BankingPage } from "@/pages/banking";
import { DocsFeaturePage } from "@/pages/docs";
import { EducationPage } from "@/pages/education";
import { ExchangePage } from "@/pages/exchange";
import { OverviewPage } from "@/pages/overview";
import { StocksPage } from "@/pages/stocks";
import { TransportPage } from "@/pages/transport";

import "./App.css";
import { Footer } from "./components/footer";
import { Navbar } from "./components/navbar";

function RouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <RouteScrollReset />
      <RouteSEO />
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route element={<AppDockLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="banking" element={<BankingPage />} />
          <Route path="stocks" element={<StocksPage />} />
          <Route path="exchange" element={<ExchangePage />} />
          <Route path="transport" element={<TransportPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="docs" element={<DocsFeaturePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
