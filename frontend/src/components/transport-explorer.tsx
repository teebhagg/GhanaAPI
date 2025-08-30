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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  api,
  RouteProfile,
  type RouteDirectionsResponse,
  type RouteQuery,
} from "@/lib/api";
import {
  AlertCircle,
  Car,
  Clock,
  Fuel,
  MapPin,
  MapPinned,
  Navigation,
  RotateCcw,
  Route as RouteIcon,
  Zap,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";

const GHANA_BOUNDS = {
  north: 11.17,
  south: 4.74,
  east: 1.19,
  west: -3.26,
};

const INITIAL_VIEW_STATE = {
  longitude: -1.5,
  latitude: 7.5,
  zoom: 6.5,
};

// Sample locations in Ghana
const SAMPLE_LOCATIONS = [
  {
    name: "Kwame Nkrumah Circle, Accra",
    coordinates: [5.6037, -0.187] as [number, number],
  },
  {
    name: "Kumasi Central Market",
    coordinates: [6.6885, -1.6244] as [number, number],
  },
  {
    name: "Tamale Central Mosque",
    coordinates: [9.4034, -0.8424] as [number, number],
  },
  {
    name: "Cape Coast Castle",
    coordinates: [5.1053, -1.2466] as [number, number],
  },
  {
    name: "University of Ghana, Legon",
    coordinates: [5.6515, -0.187] as [number, number],
  },
];

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function TransportExplorer() {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteDirectionsResponse | null>(
    null
  );

  // Form state
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [routeProfile, setRouteProfile] = useState<RouteProfile>(
    RouteProfile.DRIVING_CAR
  );
  const includeInstructions = true;

  // Map interaction state
  const [startMarker, setStartMarker] = useState<[number, number] | null>(null);
  const [endMarker, setEndMarker] = useState<[number, number] | null>(null);
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lng, lat } = event.lngLat ?? {};
      if (typeof lng !== "number" || typeof lat !== "number") {
        setError("Invalid map click location");
        return;
      }

      // Check if coordinates are within Ghana bounds
      if (
        lng < GHANA_BOUNDS.west ||
        lng > GHANA_BOUNDS.east ||
        lat < GHANA_BOUNDS.south ||
        lat > GHANA_BOUNDS.north
      ) {
        setError("Please select a location within Ghana");
        return;
      }

      if (isSelectingStart) {
        setStartMarker([lat, lng]);
        setStartLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setIsSelectingStart(false);
        setError(null);
      } else if (isSelectingEnd) {
        setEndMarker([lat, lng]);
        setEndLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setIsSelectingEnd(false);
        setError(null);
      }
    },
    [isSelectingStart, isSelectingEnd]
  );

  const getRouteDirections = async () => {
    if (!startLocation || !endLocation) {
      setError("Please provide both start and end locations");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query: RouteQuery = {
        profile: routeProfile,
        instructions: includeInstructions,
        geometry: true,
      };

      // Parse coordinates or use location names
      if (startMarker) {
        query.start_lat = startMarker[0];
        query.start_lng = startMarker[1];
      } else {
        const coords = startLocation
          .split(",")
          .map((s) => parseFloat(s.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          query.start_lat = coords[0];
          query.start_lng = coords[1];
        } else {
          query.start_name = startLocation;
        }
      }

      if (endMarker) {
        query.end_lat = endMarker[0];
        query.end_lng = endMarker[1];
      } else {
        const coords = endLocation.split(",").map((s) => parseFloat(s.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          query.end_lat = coords[0];
          query.end_lng = coords[1];
        } else {
          query.end_name = endLocation;
        }
      }

      const result = await api.getRouteDirections(query);

      if (result.success && result.data) {
        setRouteData(result.data);

        // Update markers with actual coordinates
        setStartMarker(result.data.start.coordinates);
        setEndMarker(result.data.end.coordinates);

        // Fit map to route bounds
        if (result.data.geometry && result.data.geometry.length > 0) {
          const bounds = result.data.geometry.reduce(
            (acc: Bounds, [lat, lng]: [number, number]) => ({
              minLat: Math.min(acc.minLat, lat),
              maxLat: Math.max(acc.maxLat, lat),
              minLng: Math.min(acc.minLng, lng),
              maxLng: Math.max(acc.maxLng, lng),
            }),
            {
              minLat: Array.isArray(result.data.geometry[0]) && result.data.geometry[0].length === 2 ? result.data.geometry[0][0] : 0,
              maxLat: Array.isArray(result.data.geometry[0]) && result.data.geometry[0].length === 2 ? result.data.geometry[0][0] : 0,
              minLng: Array.isArray(result.data.geometry[0]) && result.data.geometry[0].length === 2 ? result.data.geometry[0][1] : 0,
              maxLng: Array.isArray(result.data.geometry[0]) && result.data.geometry[0].length === 2 ? result.data.geometry[0][1] : 0,
            } as Bounds
          );

          mapRef.current?.fitBounds(
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
            ],
            { padding: 50, duration: 1000 }
          );
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setStartMarker(null);
    setEndMarker(null);
    setStartLocation("");
    setEndLocation("");
    setError(null);
    setViewState(INITIAL_VIEW_STATE);
  };

  const handleSampleLocation = (
    location: (typeof SAMPLE_LOCATIONS)[0],
    isStart: boolean
  ) => {
    if (isStart) {
      setStartMarker(location.coordinates);
      setStartLocation(location.name);
    } else {
      setEndMarker(location.coordinates);
      setEndLocation(location.name);
    }
  };

  // Route line layer
  const routeLayer = {
    id: "route",
    type: "line" as const,
    paint: {
      "line-color": "#2563eb",
      "line-width": 4,
      "line-opacity": 0.8,
    },
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <Card className="rounded-3xl shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Route Directions
            </CardTitle>
            <CardDescription>
              Get turn-by-turn directions between locations in Ghana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Start Location */}
            <div className="space-y-2">
              <Label htmlFor="start-location">Start Location</Label>
              <div className="flex gap-2">
                <Input
                  id="start-location"
                  placeholder="Enter location or coordinates"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSelectingStart ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setIsSelectingStart(!isSelectingStart);
                          setIsSelectingEnd(false);
                        }}>
                        <MapPinned className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click map to select start location</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Sample Start Locations */}
              <div className="flex flex-wrap gap-2">
                {SAMPLE_LOCATIONS.slice(0, 3).map((location) => (
                  <Button
                    key={location.name}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSampleLocation(location, true)}>
                    {location.name.split(",")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* End Location */}
            <div className="space-y-2">
              <Label htmlFor="end-location">End Location</Label>
              <div className="flex gap-2">
                <Input
                  id="end-location"
                  placeholder="Enter location or coordinates"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSelectingEnd ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setIsSelectingEnd(!isSelectingEnd);
                          setIsSelectingStart(false);
                        }}>
                        <MapPinned className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click map to select end location</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Sample End Locations */}
              <div className="flex flex-wrap gap-2">
                {SAMPLE_LOCATIONS.slice(2, 5).map((location) => (
                  <Button
                    key={location.name}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSampleLocation(location, false)}>
                    {location.name.split(",")[0]}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Route Profile */}
            <div className="space-y-2">
              <Label>Transport Mode</Label>
              <Select
                value={routeProfile}
                onValueChange={(value) =>
                  setRouteProfile(value as RouteProfile)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RouteProfile.DRIVING_CAR}>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Driving (Car)
                    </div>
                  </SelectItem>
                  <SelectItem value={RouteProfile.DRIVING_HGV}>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Driving (Truck/HGV)
                    </div>
                  </SelectItem>
                  <SelectItem value={RouteProfile.FOOT_WALKING}>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Walking
                    </div>
                  </SelectItem>
                  <SelectItem value={RouteProfile.CYCLING_REGULAR}>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Cycling
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={getRouteDirections}
                disabled={loading || !startLocation || !endLocation}
                className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Getting Route...
                  </>
                ) : (
                  <>
                    <RouteIcon className="h-4 w-4 mr-2" />
                    Get Directions
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearRoute}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Selection Instructions */}
            {(isSelectingStart || isSelectingEnd) && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Click on the map to select{" "}
                  {isSelectingStart ? "start" : "end"} location
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card className="rounded-3xl shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : routeData ? (
              <div className="space-y-4">
                {/* Route Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RouteIcon className="h-4 w-4" />
                      Distance
                    </div>
                    <div className="text-xl font-semibold">
                      {formatDistance(routeData.distance)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Duration
                    </div>
                    <div className="text-xl font-semibold">
                      {formatDuration(routeData.duration)}
                    </div>
                  </div>
                </div>

                {/* Cost Estimation */}
                {routeData.estimated_cost && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Fuel className="h-4 w-4" />
                      Estimated Fuel Cost
                    </div>
                    <div className="text-lg font-semibold">
                      GH₵ {routeData.estimated_cost.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Route Details */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{routeData.profile}</Badge>
                    <span className="text-xs text-muted-foreground">
                      via {routeData.provider}
                    </span>
                  </div>

                  {routeData.start.name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">From:</span>{" "}
                      {routeData.start.name}
                    </div>
                  )}

                  {routeData.end.name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">To:</span>{" "}
                      {routeData.end.name}
                    </div>
                  )}
                </div>

                {/* Turn-by-turn Instructions */}
                {routeData.steps && routeData.steps.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Turn-by-turn Directions
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {routeData.steps.map((step, index) => (
                          <div key={index} className="flex gap-3 text-sm">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {step.instruction}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistance(step.distance)} •{" "}
                                {formatDuration(step.duration)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter start and end locations to get route directions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card className="rounded-3xl shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Route Map
          </CardTitle>
          <CardDescription>
            {isSelectingStart || isSelectingEnd
              ? `Click on the map to select ${
                  isSelectingStart ? "start" : "end"
                } location`
              : "View your route on the map or click on locations to select start/end points"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 w-full rounded-b-lg overflow-hidden">
            <Map
              ref={mapRef}
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              onClick={handleMapClick}
              style={{ width: "100%", height: "100%" }}
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              cursor={
                isSelectingStart || isSelectingEnd ? "crosshair" : "default"
              }>
              {/* Start Marker */}
              {startMarker && (
                <Marker
                  longitude={startMarker[1]}
                  latitude={startMarker[0]}
                  anchor="bottom">
                  <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                </Marker>
              )}

              {/* End Marker */}
              {endMarker && (
                <Marker
                  longitude={endMarker[1]}
                  latitude={endMarker[0]}
                  anchor="bottom">
                  <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                </Marker>
              )}

              {/* Route Line */}
              {routeData?.geometry && (
                <Source
                  id="route"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "LineString",
                      coordinates: routeData.geometry.map(([lat, lng]) => [
                        lng,
                        lat,
                      ]),
                    },
                  }}>
                  <Layer {...routeLayer} />
                </Source>
              )}
            </Map>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
