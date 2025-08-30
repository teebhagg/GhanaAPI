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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type NearbyStop, type NearbyStopsQuery } from "@/lib/api";
import { calculateCircleRadius } from "@/lib/map-utils";
import { Bus, Locate, MapPin, Navigation } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";

export interface NearbyStopsCardRef {
  getCurrentLocationAndSearch: () => void;
}

// Circle radius calculation is now handled by MapUtils.calculateCircleRadius()

export const NearbyStopsCard = forwardRef<NearbyStopsCardRef>((_, ref) => {
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(
    null
  );
  const [searchRadius, setSearchRadius] = useState(1000);
  const mapRef = useRef<MapRef>(null);

  const [query, setQuery] = useState<NearbyStopsQuery>({
    lat: 5.6037, // Default to Accra
    lng: -0.187,
    radius: 1000,
    type: undefined,
  });

  const searchNearbyStops = async (searchQuery: NearbyStopsQuery) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getNearbyStops(searchQuery);
      if (response.success) {
        setStops(response.data);
        setSearchCenter(response.center);
        setSearchRadius(response.radius);

        // Fit map to show all stops
        setTimeout(() => {
          if (mapRef.current && response.data.length > 0) {
            const bounds = response.data.reduce(
              (acc, stop) => {
                acc.minLng = Math.min(acc.minLng, stop.coordinates[1]);
                acc.maxLng = Math.max(acc.maxLng, stop.coordinates[1]);
                acc.minLat = Math.min(acc.minLat, stop.coordinates[0]);
                acc.maxLat = Math.max(acc.maxLat, stop.coordinates[0]);
                return acc;
              },
              {
                minLng: response.center[1],
                maxLng: response.center[1],
                minLat: response.center[0],
                maxLat: response.center[0],
              }
            );

            mapRef.current.fitBounds(
              [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
              { padding: 50 }
            );
          }
        }, 100);
      } else {
        throw new Error("Failed to fetch nearby stops");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setStops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchNearbyStops(query);
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newQuery = {
            ...query,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setQuery(newQuery);
          searchNearbyStops(newQuery);
        },
        (error) => {
          setError("Failed to get current location: " + error.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  };

  // Expose the getCurrentLocation method to parent component
  useImperativeHandle(
    ref,
    () => ({
      getCurrentLocationAndSearch: getCurrentLocation,
    }),
    [query]
  );

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const getStopTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "bus_stop":
        return "bg-blue-100 text-blue-800";
      case "platform":
        return "bg-green-100 text-green-800";
      case "station":
        return "bg-purple-100 text-purple-800";
      case "halt":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Auto-loading of nearby stops is intentionally disabled on mount to avoid unnecessary location requests and API calls
  // when the tab is not active. Instead, the parent component is expected to trigger loading by calling the
  // getCurrentLocationAndSearch method exposed via the ref (using useImperativeHandle) when the tab becomes active.
  
  return (
    <Card className="w-full rounded-3xl shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5" />
          Nearby Transport Stops
        </CardTitle>
        <CardDescription>
          Find bus stops, stations, and other transport stops near you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={query.lat}
              onChange={(e) =>
                setQuery({ ...query, lat: parseFloat(e.target.value) || 0 })
              }
              placeholder="5.6037"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={query.lng}
              onChange={(e) =>
                setQuery({ ...query, lng: parseFloat(e.target.value) || 0 })
              }
              placeholder="-0.187"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters)</Label>
            <Input
              id="radius"
              type="number"
              value={query.radius || ""}
              onChange={(e) =>
                setQuery({
                  ...query,
                  radius: parseInt(e.target.value) || undefined,
                })
              }
              placeholder="1000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stop-type">Stop Type</Label>
            <Select
              value={query.type || "all"}
              onValueChange={(value) =>
                setQuery({
                  ...query,
                  type: value === "all" ? undefined : value,
                })
              }>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="bus_stop">Bus Stop</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
                <SelectItem value="station">Station</SelectItem>
                <SelectItem value="halt">Halt</SelectItem>
                <SelectItem value="tram_stop">Tram Stop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSearch} disabled={loading}>
            <MapPin className="h-4 w-4 mr-2" />
            Search Stops
          </Button>
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={loading}>
            <Locate
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Use My Location
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {searchCenter && (
          <div className="text-sm text-muted-foreground">
            Found {stops.length} stops within {formatDistance(searchRadius)} of
            ({searchCenter[0].toFixed(4)}, {searchCenter[1].toFixed(4)})
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Stops List */}
        {!loading && stops.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stops List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stops.map((stop, index) => (
                <div
                  key={stop.id || index}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {stop.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={getStopTypeColor(stop.type)}>
                          {stop.type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(stop.distance)} away
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {stop.coordinates[0].toFixed(6)},{" "}
                        {stop.coordinates[1].toFixed(6)}
                      </div>
                      {stop.routes && stop.routes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Routes:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {stop.routes.slice(0, 3).map((route, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs">
                                {route}
                              </Badge>
                            ))}
                            {stop.routes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{stop.routes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Navigation className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Map View
              </h4>
              <div className="h-96 rounded-lg overflow-hidden border">
                {searchCenter ? (
                  <Map
                    ref={mapRef}
                    initialViewState={{
                      longitude: searchCenter[1],
                      latitude: searchCenter[0],
                      zoom: 14,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                    attributionControl={false}>
                    {/* Search Center Marker */}
                    <Marker
                      longitude={searchCenter[1]}
                      latitude={searchCenter[0]}
                      anchor="bottom">
                      <div className="relative">
                        <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45 border-r border-b border-white"></div>
                      </div>
                    </Marker>

                    {/* Search Radius Circle */}
                    <Source
                      id="search-radius"
                      type="geojson"
                      data={{
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: [searchCenter[1], searchCenter[0]],
                        },
                        properties: {},
                      }}>
                      <Layer
                        id="search-radius-circle"
                        type="circle"
                        paint={{
                          // Calculate circle radius for map visualization
                          // This scales the search radius (in meters) to appropriate map pixels
                          // while ensuring the circle doesn't become too large visually
                          "circle-radius": calculateCircleRadius(searchRadius),
                          "circle-color": "#3b82f6",
                          "circle-opacity": 0.1,
                          "circle-stroke-color": "#3b82f6",
                          "circle-stroke-width": 2,
                          "circle-stroke-opacity": 0.3,
                        }}
                      />
                    </Source>

                    {/* Stop Markers */}
                    {stops.map((stop, index) => (
                      <Marker
                        key={stop.id || index}
                        longitude={stop.coordinates[1]}
                        latitude={stop.coordinates[0]}
                        anchor="bottom">
                        <div className="relative group cursor-pointer">
                          <div
                            className={`w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                              stop.type === "bus_stop"
                                ? "bg-green-500"
                                : stop.type === "platform"
                                ? "bg-purple-500"
                                : stop.type === "station"
                                ? "bg-orange-500"
                                : "bg-gray-500"
                            }`}>
                            <Bus className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div
                            className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rotate-45 border-r border-b border-white ${
                              stop.type === "bus_stop"
                                ? "bg-green-500"
                                : stop.type === "platform"
                                ? "bg-purple-500"
                                : stop.type === "station"
                                ? "bg-orange-500"
                                : "bg-gray-500"
                            }`}></div>

                          {/* Tooltip */}
                          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {stop.name}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </Marker>
                    ))}
                  </Map>
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted/30">
                    <p className="text-muted-foreground">
                      Map will appear when stops are found
                    </p>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Search center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Bus stops</span>
                  <div className="w-3 h-3 bg-purple-500 rounded-full ml-2"></div>
                  <span>Platforms</span>
                  <div className="w-3 h-3 bg-orange-500 rounded-full ml-2"></div>
                  <span>Stations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && stops.length === 0 && !error && searchCenter && (
          <div className="text-center py-8 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transport stops found in this area.</p>
            <p className="text-sm">
              Try increasing the search radius or searching a different
              location.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NearbyStopsCard.displayName = "NearbyStopsCard";
