import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type AddressDto } from "@/lib/api";
import { motion } from "framer-motion";
import { Mail, MapPin, Navigation, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

function AddressCard({ item }: { item: AddressDto }) {
  return (
    <div className="p-6 border rounded-3xl bg-background hover:bg-accent/30 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base">{item.addressLine1}</div>
          {item.addressLine2 && (
            <div className="text-sm text-muted-foreground mt-1">
              {item.addressLine2}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </div>
            {item.postalCode && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {item.postalCode}
              </div>
            )}
          </div>
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
        alert("Permission denied. Please allow location access in your browser settings.");
        break;
      case 2: // POSITION_UNAVAILABLE
        alert("Location information is unavailable. Please try again later.");
        break;
      case 3: // TIMEOUT
        alert("Location request timed out. Please try again.");
        break;
      default:
        alert("Unable to get your current location. Please check your browser permissions.");
    }
  } else {
    alert("Unable to get your current location. Please check your browser permissions.");
  }
}

export function AddressesPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressDto[]>([]);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);
  const validLatLng = useMemo(
    () => !isNaN(Number(lat)) && !isNaN(Number(lng)),
    [lat, lng]
  );

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.searchAddresses(q.trim());
      setItems(res);
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

  async function onReverse(e: React.FormEvent) {
    e.preventDefault();
    if (!validLatLng) return;
    setLoading(true);
    try {
      const res = await api.reverseGeocode(Number(lat), Number(lng));
      setItems(res ? [res] : []);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    setItems([]);
  }

  function clearReverse() {
    setLat("");
    setLng("");
    setItems([]);
  }

  function clearAll() {
    setQ("");
    setLat("");
    setLng("");
    setItems([]);
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}>
          <div className="p-8 border rounded-3xl bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Search Addresses</h3>
                <p className="text-sm text-muted-foreground">
                  Find addresses and digital codes
                </p>
              </div>
            </div>
            <form onSubmit={onSearch} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">
                  Search Query
                </label>
                <Input
                  placeholder="Enter address, landmark, or area (e.g., Accra, Osu, Ring Road)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!q || loading}>
                  <Search className="w-4 h-4" />
                  {loading ? "Searching..." : "Search Addresses"}
                </Button>
                <Button
                  type="button"
                  size={"icon"}
                  variant="outline"
                  onClick={clearSearch}
                  disabled={!q && items.length === 0}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="p-8 border rounded-3xl bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Reverse Geocode</h3>
                <p className="text-sm text-muted-foreground">
                  Get the nearest address from coordinates
                </p>
              </div>
            </div>
            <form onSubmit={onReverse} className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">
                  Coordinates
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}>
                  <MapPin className="w-4 h-4" />
                  {locationLoading ? "Getting..." : "Use My Location"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Latitude
                  </label>
                  <Input
                    placeholder="e.g., 5.5600"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Longitude
                  </label>
                  <Input
                    placeholder="e.g., -0.2057"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!validLatLng || loading}>
                  <Navigation className="w-4 h-4" />
                  {loading ? "Looking up..." : "Find Address"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size={"icon"}
                  onClick={clearReverse}
                  disabled={!lat && !lng && items.length === 0}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.05 } },
        }}>
        {items.map((it, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <AddressCard item={it} />
          </motion.div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm opacity-70">
            No results yet. Try searching or reverse geocoding.
          </div>
        )}
      </motion.div>

      {(q || lat || lng || items.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center">
          <Button
            variant="outline"
            size={"icon"}
            onClick={clearAll}
            className="flex items-center gap-2">
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
