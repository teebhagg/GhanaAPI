import { ExchangeRatesPanel } from "@/components/exchange-rates-panel";
import { FeaturePage } from "@/components/feature-page";

export function ExchangePage() {
  return (
    <FeaturePage
      title="Currency Exchange & Rates"
      description="Retrieve real-time forex rates, compute conversions, and compare historical trends for major currency pairs."
    >
      <ExchangeRatesPanel />
    </FeaturePage>
  );
}
