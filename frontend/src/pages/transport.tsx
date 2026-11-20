import { EnhancedTransportExplorer } from "@/components/enhanced-transport-explorer";
import { FeaturePage } from "@/components/feature-page";

export function TransportPage() {
  return (
    <FeaturePage
      endpoint="/transport/directions?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244"
      title="Transport & Logistics Services"
      description="Plan intercity travel, inspect transit stops, and analyze journey times with multimodal routing tools."
    >
      <EnhancedTransportExplorer />
    </FeaturePage>
  );
}
