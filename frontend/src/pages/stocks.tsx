import { StockMarketPanel } from "@/components/stock-market-panel";
import { FeaturePage } from "@/components/feature-page";

export function StocksPage() {
  return (
    <FeaturePage
      title="Ghana Stock Exchange"
      description="Monitor live prices, volumes, and performance metrics for Ghana Stock Exchange listings and indices."
    >
      <StockMarketPanel />
    </FeaturePage>
  );
}
