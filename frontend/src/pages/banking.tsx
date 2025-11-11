import { BankingPanel } from "@/components/banking-panel";
import { FeaturePage } from "@/components/feature-page";

export function BankingPage() {
  return (
    <FeaturePage
      title="Bank & ATM Locator"
      description="Locate branches and ATMs nationwide with filters for institutions, services, and operational details."
    >
      <BankingPanel />
    </FeaturePage>
  );
}
