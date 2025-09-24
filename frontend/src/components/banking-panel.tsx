import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type BankDto, type BankSearchQuery } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  CreditCard,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

function BankCard({ item }: { item: BankDto }) {
  const distanceText = item.distance
    ? item.distance < 1000
      ? `${Math.round(item.distance)}m away`
      : `${(item.distance / 1000).toFixed(1)}km away`
    : null;

  return (
    <div className="p-6 border rounded-3xl bg-background hover:bg-accent/30 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            item.type === "bank"
              ? "bg-blue-500/10 group-hover:bg-blue-500/20"
              : "bg-green-500/10 group-hover:bg-green-500/20"
          }`}>
          {item.type === "bank" ? (
            <Building2 className="w-5 h-5 text-blue-500" />
          ) : (
            <CreditCard className="w-5 h-5 text-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-base">{item.name}</div>
              {item.code && (
                <div className="text-sm text-muted-foreground">
                  {item.code}{" "}
                  {item.branchInfo?.branchCode &&
                    `(${item.branchInfo.branchCode})`}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Badge
                variant={item.type === "bank" ? "default" : "secondary"}
                className="text-xs">
                {item.type.toUpperCase()}
              </Badge>
              {item.branchInfo?.isHeadOffice && (
                <Badge variant="outline" className="text-xs">
                  Head Office
                </Badge>
              )}
              {item.branchInfo?.is24Hours && (
                <Badge variant="outline" className="text-xs text-green-600">
                  24/7
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              {item.address}, {item.city}
            </div>
            <div className="text-xs opacity-75">
              {item.region} • {item.latitude.toFixed(5)},{" "}
              {item.longitude.toFixed(5)}
              {distanceText && ` • ${distanceText}`}
            </div>
          </div>

          {(item.phone ||
            item.email ||
            item.website ||
            item.operatingHours) && (
            <div className="mt-3 space-y-1">
              {item.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <a
                    href={`tel:${item.phone}`}
                    className="hover:text-primary transition-colors">
                    {item.phone}
                  </a>
                </div>
              )}
              {item.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <a
                    href={`mailto:${item.email}`}
                    className="hover:text-primary transition-colors">
                    {item.email}
                  </a>
                </div>
              )}
              {item.website && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors">
                    Visit Website
                  </a>
                </div>
              )}
              {item.operatingHours && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.operatingHours}
                </div>
              )}
            </div>
          )}

          {item.services && item.services.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {item.services.slice(0, 3).map((service: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {item.services.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.services.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function handleGeolocationError(error: unknown) {
  console.error("Error getting location:", error);
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as GeolocationPositionError).code === "number"
  ) {
    switch ((error as GeolocationPositionError).code) {
      case 1: // PERMISSION_DENIED
        alert(
          "Permission denied. Please allow location access in your browser settings."
        );
        break;
      case 2: // POSITION_UNAVAILABLE
        alert("Location information is unavailable. Please try again later.");
        break;
      case 3: // TIMEOUT
        alert("Location request timed out. Please try again.");
        break;
      default:
        alert(
          "Unable to get your current location. Please check your browser permissions."
        );
    }
  } else {
    alert(
      "Unable to get your current location. Please check your browser permissions."
    );
  }
}

export function BankingPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BankDto[]>([]);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [radius, setRadius] = useState<string>("50");
    const [filterType, setFilterType] = useState<'bank' | 'atm'>('bank');
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const validLatLng = useMemo(
    () => !isNaN(Number(lat)) && !isNaN(Number(lng)),
    [lat, lng]
  );

  async function onTextSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const query: BankSearchQuery = {
        q: searchQuery.trim(),
        type: filterType,
        limit: 20,
      };
      const res = await api.searchBanks(query);
      setItems(res.data);
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search banks. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      setLat(position.coords.latitude.toFixed(6));
      setLng(position.coords.longitude.toFixed(6));
    } catch (error) {
      handleGeolocationError(error);
    } finally {
      setLocationLoading(false);
    }
  }

  async function onLocationSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!validLatLng) return;
    setLoading(true);
    try {
      const query: BankSearchQuery = {
        lat: Number(lat),
        lng: Number(lng),
        radius: Number(radius),
        type: filterType,
        limit: 20,
      };
      const res = await api.searchBanks(query);
      setItems(res.data);
    } catch (error) {
      console.error("Location search error:", error);
      alert("Failed to search nearby banks. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onRegionSearch() {
    if (!selectedRegion) return;
    setLoading(true);
    try {
      const res = await api.getBanksByRegion(selectedRegion, filterType);
      console.log(res);
      // Backend returns BankDto[] directly
      setItems(res);
    } catch (error) {
      console.error("Region search error:", error);
      alert("Failed to search banks by region. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onCitySearch() {
    if (!selectedCity) return;
    setLoading(true);
    try {
      const res = await api.getBanksByCity(selectedCity, filterType);
      // Backend returns BankDto[] directly
      setItems(res);
    } catch (error) {
      console.error("City search error:", error);
      alert("Failed to search banks by city. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearTextSearch() {
    setSearchQuery("");
    setItems([]);
  }

  function clearLocationSearch() {
    setLat("");
    setLng("");
    setRadius("50");
    setItems([]);
  }

  function clearRegionCity() {
    setSelectedRegion("");
    setSelectedCity("");
    setItems([]);
  }

  function clearAll() {
    setSearchQuery("");
    setLat("");
    setLng("");
    setRadius("50");
    setSelectedRegion("");
    setSelectedCity("");
    setFilterType("bank");
    setItems([]);
  }

  return (
    <div className="space-y-8">
      {/* Filter Type Selection */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={filterType === "bank" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("bank")}>
          <Building2 className="w-4 h-4 mr-1" />
          Banks
        </Button>
        <Button
          variant={filterType === "atm" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("atm")}>
          <CreditCard className="w-4 h-4 mr-1" />
          ATMs
        </Button>
      </div>      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Search */}
        <motion.div
          className="p-6 border rounded-3xl bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search by Name
          </h3>
          <form onSubmit={onTextSearch} className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search banks, ATMs, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearTextSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="w-full">
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </motion.div>

        {/* Location Search */}
        <motion.div
          className="p-6 border rounded-3xl bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Find Nearby
          </h3>
          <form onSubmit={onLocationSearch} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <Input
                placeholder="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Search radius (meters)"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex-1">
                {locationLoading ? "Getting..." : "Use My Location"}
              </Button>
              {(lat || lng) && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearLocationSearch}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !validLatLng}
              className="w-full">
              {loading ? "Searching..." : "Find Nearby"}
            </Button>
          </form>
        </motion.div>

        {/* Region Search */}
        <motion.div
          className="p-6 border rounded-3xl bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Browse by Region
          </h3>
          <div className="space-y-4">
            <Input
              placeholder="Region name (e.g., Greater Accra)"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={onRegionSearch}
                disabled={loading || !selectedRegion}
                className="flex-1">
                {loading ? "Searching..." : "Browse Region"}
              </Button>
              {selectedRegion && (
                <Button variant="outline" size="icon" onClick={clearRegionCity}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* City Search */}
        <motion.div
          className="p-6 border rounded-3xl bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Browse by City
          </h3>
          <div className="space-y-4">
            <Input
              placeholder="City name (e.g., Accra, Kumasi)"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
            <Button
              onClick={onCitySearch}
              disabled={loading || !selectedCity}
              className="w-full">
              {loading ? "Searching..." : "Browse City"}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Results */}
      {items && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Found {items.length}{" "}
              {filterType === "bank"
                ? "banks"
                : "ATMs"}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground">
              Clear All
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-track-gray-100 border border-gray-200 rounded-lg p-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}>
                <BankCard item={item} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
