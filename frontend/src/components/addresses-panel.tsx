import { motion } from "framer-motion";
import {
  Compass,
  Hash,
  Mailbox,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip, FeatureSurface } from "@/components/ui/feature-surface";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AddressDto } from "@/lib/api";
import { fadeUp, staggerContainer } from "@/lib/motion";

const hasCoords = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

function AddressCard({ item }: { item: AddressDto }) {
  // Show the postal code only when it adds information beyond the digital code.
  const showPostal =
    Boolean(item.postalCode) && item.postalCode !== item.digitalCode;
  return (
    <motion.article
      variants={fadeUp}
      className="group flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-3 font-semibold leading-snug"
            title={item.addressLine1}>
            {item.addressLine1 || "Unnamed location"}
          </p>
          {item.addressLine2 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {item.addressLine2}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {item.digitalCode && <Chip icon={Hash}>{item.digitalCode}</Chip>}
        {hasCoords(item.latitude) && hasCoords(item.longitude) && (
          <Chip icon={Navigation}>
            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </Chip>
        )}
        {showPostal && <Chip icon={Mailbox}>{item.postalCode}</Chip>}
      </div>
    </motion.article>
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
  const [searched, setSearched] = useState(false);
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
      setSearched(true);
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
      setItems(Array.isArray(res) ? res : []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQ("");
    setItems([]);
    setSearched(false);
  }

  function clearReverse() {
    setLat("");
    setLng("");
    setItems([]);
    setSearched(false);
  }

  function clearAll() {
    setQ("");
    setLat("");
    setLng("");
    setItems([]);
    setSearched(false);
  }

  const hasAnything = Boolean(q || lat || lng || items.length > 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}>
          <FeatureSurface
            icon={Search}
            title="Search addresses"
            description="Look up by name, landmark or area.">
            <form onSubmit={onSearch} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label htmlFor="address-query" className="text-sm font-semibold">
                  Search query
                </label>
                <Input
                  id="address-query"
                  className="h-12 px-5"
                  placeholder="Accra, Osu, Ring Road…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 sm:flex-none"
                  disabled={!q.trim() || loading}>
                  <Search className="size-4" />
                  {loading ? "Searching…" : "Search addresses"}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Clear search"
                  className="size-12"
                  onClick={clearSearch}
                  disabled={!q && items.length === 0}>
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          </FeatureSurface>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}>
          <FeatureSurface
            icon={Navigation}
            title="Reverse geocode"
            description="Get the nearest address from coordinates.">
            <form onSubmit={onReverse} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="lat" className="text-sm font-semibold">
                    Latitude
                  </label>
                  <Input
                    id="lat"
                    className="h-12 px-5"
                    placeholder="5.5600"
                    inputMode="decimal"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lng" className="text-sm font-semibold">
                    Longitude
                  </label>
                  <Input
                    id="lng"
                    className="h-12 px-5"
                    placeholder="-0.2057"
                    inputMode="decimal"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 sm:flex-none"
                  disabled={!validLatLng || loading}>
                  <Navigation className="size-4" />
                  {loading ? "Looking up…" : "Find address"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}>
                  <MapPin className="size-4" />
                  {locationLoading ? "Getting…" : "Use my location"}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Clear coordinates"
                  className="size-12"
                  onClick={clearReverse}
                  disabled={!lat && !lng && items.length === 0}>
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          </FeatureSurface>
        </motion.div>
      </div>

      <section aria-live="polite" className="space-y-4">
        {items.length > 0 && !loading && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Results</h2>
            <Chip>
              {items.length} {items.length === 1 ? "match" : "matches"}
            </Chip>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <motion.div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="show">
            {items.map((it, idx) => (
              <AddressCard key={`${it.digitalCode || "addr"}-${idx}`} item={it} />
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={searched ? Compass : MapPin}
            title={searched ? "No addresses found" : "Ready when you are"}
            description={
              searched
                ? "Try a broader area or a different spelling."
                : "Search by name, or enter coordinates, to see matching addresses here."
            }
          />
        )}
      </section>

      {hasAnything && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={clearAll}>
            <X className="size-4" />
            Clear everything
          </Button>
        </div>
      )}
    </div>
  );
}
