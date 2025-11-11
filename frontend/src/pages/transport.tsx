import { EnhancedTransportExplorer } from "@/components/enhanced-transport-explorer";
import { FeaturePage } from "@/components/feature-page";

export function TransportPage() {
  return (
    <FeaturePage
      title="Transport & Logistics Services"
      description="Plan intercity travel, inspect transit stops, and analyze journey times with multimodal routing tools."
    >
      <EnhancedTransportExplorer />
    </FeaturePage>
  );
}
