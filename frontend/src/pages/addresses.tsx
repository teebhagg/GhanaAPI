import { AddressesPanel } from "@/components/addresses-panel";
import { FeaturePage } from "@/components/feature-page";

export function AddressesPage() {
  return (
    <FeaturePage
      title="Address Lookup & Validation"
      description="Perform geocoding, validation, and metadata enrichment across Ghana's addressing datasets with advanced search and pagination."
    >
      <AddressesPanel />
    </FeaturePage>
  );
}
