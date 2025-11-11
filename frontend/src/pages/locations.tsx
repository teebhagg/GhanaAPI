import { LocationsPanel } from "@/components/locations-panel";
import { FeaturePage } from "@/components/feature-page";

export function LocationsPage() {
  return (
    <FeaturePage
      title="Regions & Districts"
      description="Browse Ghana's administrative hierarchy with detailed metadata for regions, districts, and localities."
    >
      <LocationsPanel />
    </FeaturePage>
  );
}
