import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, Fuel, Route as RouteIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { FuelPricesCard } from "./fuel-prices";
import { NearbyStopsCard, type NearbyStopsCardRef } from "./nearby-stops";
import { TransportExplorer } from "./transport-explorer";

export function EnhancedTransportExplorer() {
  const [activeTab, setActiveTab] = useState("directions");
  const nearbyStopsRef = useRef<NearbyStopsCardRef>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Trigger getCurrentLocationAndSearch when tab changes to "stops" and ref is set
  useEffect(() => {
    if (activeTab === "stops" && nearbyStopsRef.current) {
      nearbyStopsRef.current.getCurrentLocationAndSearch();
    }
  }, [activeTab]);

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="directions" className="flex items-center gap-2">
            <RouteIcon className="h-4 w-4" />
            Route Directions
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Fuel Prices
          </TabsTrigger>
          <TabsTrigger value="stops" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Nearby Stops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directions" className="mt-6">
          <TransportExplorer />
        </TabsContent>

        <TabsContent value="fuel" className="mt-6">
          <FuelPricesCard />
        </TabsContent>

        <TabsContent value="stops" className="mt-6">
          <NearbyStopsCard ref={nearbyStopsRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
