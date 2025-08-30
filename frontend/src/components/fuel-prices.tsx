import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, type FuelPrice } from "@/lib/api";
import { Building2, Clock, Fuel, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function FuelPricesCard() {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFuelPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getFuelPrices();
      if (response.success) {
        setFuelPrices(response.data);
      } else {
        throw new Error("Failed to fetch fuel prices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelPrices();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toFixed(2)}`;
  };

  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className="w-full rounded-3xl shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Fuel Prices in Ghana
          </CardTitle>
          <CardDescription>
            Current petrol, diesel, and LPG prices
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFuelPrices}
          disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !fuelPrices && (
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded-lg animate-pulse" />
            <div className="h-16 bg-muted rounded-lg animate-pulse" />
            <div className="h-16 bg-muted rounded-lg animate-pulse" />
          </div>
        )}

        {fuelPrices && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Petrol
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(fuelPrices.petrol, fuelPrices.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">per litre</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Fuel className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Diesel
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(fuelPrices.diesel, fuelPrices.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">per litre</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Fuel className="h-6 w-6 text-green-600" />
                </div>
              </div>

              {fuelPrices.lpg && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      LPG
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(fuelPrices.lpg, fuelPrices.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">per litre</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Fuel className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated: {formatLastUpdated(fuelPrices.lastUpdated)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Source: {fuelPrices.source}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
