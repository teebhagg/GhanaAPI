import { AddressesPanel } from "@/components/addresses-panel";
import { FeaturePage } from "@/components/feature-page";
import { LocationsPanel } from "@/components/locations-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddressesPage() {
  return (
    <FeaturePage
      title="Address & Region Explorer"
      description="Search and validate GhanaPost GPS addresses, then dive into regions and districts with authoritative datasets.">
      <Tabs defaultValue="addresses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="addresses">Address Lookup</TabsTrigger>
          <TabsTrigger value="regions">Regions & Districts</TabsTrigger>
        </TabsList>
        <TabsContent value="addresses">
          <AddressesPanel />
        </TabsContent>
        <TabsContent value="regions">
          <LocationsPanel />
        </TabsContent>
      </Tabs>
    </FeaturePage>
  );
}
