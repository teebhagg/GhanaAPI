import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Clock,
  CreditCard,
  Globe,
  Mail,
  MapPin,
  Landmark,
  MapPinned,
  Navigation,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip, FeatureSurface } from "@/components/ui/feature-surface";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type BankDto, type BankSearchQuery } from "@/lib/api";
import { fadeUp, staggerContainer } from "@/lib/motion";

const PAGE_SIZE = 24;
const MAX_RADIUS_KM = 50;

type Kind = "bank" | "atm";

/** Backend distances are kilometres. */
function formatDistance(km?: number) {
  if (km === undefined || !Number.isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

function BankCard({ item }: { item: BankDto }) {
  const isBank = item.type === "bank";
  const distance = formatDistance(item.distance);
  const services = item.services ?? [];
  const hasContact = Boolean(item.phone || item.email || item.website);

  return (
    <motion.article
      variants={fadeUp}
      className="group flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
            isBank
              ? "bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground"
              : "bg-success/15 text-success"
          }`}>
          {isBank ? <Building2 className="size-4" /> : <CreditCard className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{item.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {item.branchInfo?.branchCode
              ? `${item.code ? `${item.code} · ` : ""}Branch ${item.branchInfo.branchCode}`
              : item.code}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip className={isBank ? "" : "bg-success/15 text-success"}>
          {isBank ? "Bank" : "ATM"}
        </Chip>
        {item.branchInfo?.isHeadOffice && <Chip>Head office</Chip>}
        {item.branchInfo?.is24Hours && <Chip>Open 24/7</Chip>}
        {distance && <Chip icon={Navigation}>{distance}</Chip>}
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary-ink" />
          <span className="min-w-0">
            {[item.address, item.city].filter(Boolean).join(", ")}
            {item.region && (
              <span className="block text-xs opacity-75">{item.region}</span>
            )}
          </span>
        </p>
        {item.operatingHours && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 shrink-0" />
            <span className="truncate">{item.operatingHours}</span>
          </p>
        )}
      </div>

      {hasContact && (
        <div className="flex flex-wrap gap-2 text-xs">
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Phone className="size-3.5" />
              {item.phone}
            </a>
          )}
          {item.email && (
            <a
              href={`mailto:${item.email}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{item.email}</span>
            </a>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Globe className="size-3.5" />
              Website
            </a>
          )}
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {services.slice(0, 3).map((service) => (
            <Chip key={service}>{service}</Chip>
          ))}
          {services.length > 3 && <Chip>+{services.length - 3} more</Chip>}
        </div>
      )}
    </motion.article>
  );
}

function handleGeolocationError(error: unknown) {
  console.error("Error getting location:", error);
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as GeolocationPositionError).code
      : undefined;
  const message =
    code === 1
      ? "Permission denied. Please allow location access in your browser settings."
      : code === 2
        ? "Location information is unavailable. Please try again later."
        : code === 3
          ? "Location request timed out. Please try again."
          : "Unable to get your current location. Please check your browser permissions.";
  alert(message);
}

export function BankingPanel() {
  const [kind, setKind] = useState<Kind>("bank");
  const [searchQuery, setSearchQuery] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("5");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [items, setItems] = useState<BankDto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const validLatLng = useMemo(
    () => lat !== "" && lng !== "" && !isNaN(Number(lat)) && !isNaN(Number(lng)),
    [lat, lng]
  );
  const radiusKm = Math.min(Math.max(Number(radius) || 0, 0.1), MAX_RADIUS_KM);

  async function run<T>(
    request: () => Promise<T>,
    onOk: (res: T) => void,
    fallbackMessage: string
  ) {
    setLoading(true);
    setError(null);
    setShowAll(false);
    try {
      onOk(await request());
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(null);
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  }

  function onTextSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query: BankSearchQuery = { q: searchQuery.trim(), type: kind, limit: 20 };
    void run(
      () => api.searchBanks(query),
      (res) => {
        setItems(res.data);
        setTotal(res.total);
      },
      "Search failed. Please try again."
    );
  }

  function onNearbySearch(e: React.FormEvent) {
    e.preventDefault();
    if (!validLatLng) return;
    const query: BankSearchQuery = {
      lat: Number(lat),
      lng: Number(lng),
      radius: radiusKm,
      type: kind,
      limit: 20,
    };
    void run(
      () => api.searchBanks(query),
      (res) => {
        setItems(res.data);
        setTotal(res.total);
      },
      "Nearby search failed. Please try again."
    );
  }

  function onRegionSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!region.trim()) return;
    void run(
      () => api.getBanksByRegion(region.trim(), kind),
      (res) => {
        setItems(res);
        setTotal(res.length);
      },
      "Region search failed. Please try again."
    );
  }

  function onCitySearch(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    void run(
      () => api.getBanksByCity(city.trim(), kind),
      (res) => {
        setItems(res);
        setTotal(res.length);
      },
      "City search failed. Please try again."
    );
  }

  async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return null;
    }
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      );
      setLat(position.coords.latitude.toFixed(6));
      setLng(position.coords.longitude.toFixed(6));
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (err) {
      handleGeolocationError(err);
      return null;
    } finally {
      setLocationLoading(false);
    }
  }

  function clearAll() {
    setSearchQuery("");
    setLat("");
    setLng("");
    setRadius("5");
    setRegion("");
    setCity("");
    setItems([]);
    setTotal(null);
    setSearched(false);
    setError(null);
    setShowAll(false);
  }

  const visible = showAll ? items : items.slice(0, PAGE_SIZE);
  const noun = kind === "bank" ? "bank" : "ATM";
  const nounPlural = kind === "bank" ? "banks" : "ATMs";

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            <TabsTrigger value="bank" className="gap-2">
              <Building2 className="size-4" />
              Banks
            </TabsTrigger>
            <TabsTrigger value="atm" className="gap-2">
              <CreditCard className="size-4" />
              ATMs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div className="h-full" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <FeatureSurface className="h-full" icon={Search} title="Search by name" description={`Find a ${noun} by its name, code or area.`}>
            <form onSubmit={onTextSearch} className="flex flex-col gap-3">
              <Input aria-label="Search by name" className="h-12 px-5" placeholder="Ecobank, GCB, Osu…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Button type="submit" size="lg" disabled={loading || !searchQuery.trim()}>
                <Search className="size-4" />
                {loading ? "Searching…" : `Search ${nounPlural}`}
              </Button>
            </form>
          </FeatureSurface>
        </motion.div>

        <motion.div className="h-full" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: 0.06 }}>
          <FeatureSurface className="h-full" icon={Navigation} title="Find nearby" description={`Within up to ${MAX_RADIUS_KM} km of a point.`}>
            <form onSubmit={onNearbySearch} className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <Input aria-label="Latitude" className="h-12 px-4" placeholder="Lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
                <Input aria-label="Longitude" className="h-12 px-4" placeholder="Lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
                <Input aria-label="Radius in kilometres" className="h-12 px-4" placeholder="km" inputMode="decimal" value={radius} onChange={(e) => setRadius(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" disabled={loading || !validLatLng}>
                  <Navigation className="size-4" />
                  {loading ? "Searching…" : "Find nearby"}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={getCurrentLocation} disabled={locationLoading}>
                  <MapPin className="size-4" />
                  {locationLoading ? "Getting…" : "Use my location"}
                </Button>
              </div>
            </form>
          </FeatureSurface>
        </motion.div>

        <motion.div className="h-full" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <FeatureSurface className="h-full" icon={MapPinned} title="Browse by region" description="All banks or ATMs in a region.">
            <form onSubmit={onRegionSearch} className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label="Region name" className="h-12 flex-1 px-5" placeholder="Greater Accra" value={region} onChange={(e) => setRegion(e.target.value)} />
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading || !region.trim()}>
                Browse
              </Button>
            </form>
          </FeatureSurface>
        </motion.div>

        <motion.div className="h-full" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: 0.06 }}>
          <FeatureSurface className="h-full" icon={Landmark} title="Browse by city" description="All banks or ATMs in a city or town.">
            <form onSubmit={onCitySearch} className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label="City name" className="h-12 flex-1 px-5" placeholder="Accra, Kumasi" value={city} onChange={(e) => setCity(e.target.value)} />
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading || !city.trim()}>
                Browse
              </Button>
            </form>
          </FeatureSurface>
        </motion.div>
      </div>

      {(loading || error || items.length > 0 || searched) && (
      <section aria-live="polite" className="space-y-4">
        {!loading && items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">
              {total ?? items.length} {total === 1 ? noun : nounPlural} found
            </h2>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-4" />
              Clear all
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState compact icon={AlertTriangle} title="Bank data is unavailable" description={`${error.replace(/[.\s]+$/, "")}. Please try again in a few minutes.`} />
        ) : items.length > 0 ? (
          <>
            <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
              {visible.map((item) => (
                <BankCard key={item.id} item={item} />
              ))}
            </motion.div>
            {!showAll && items.length > PAGE_SIZE && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowAll(true)}>
                  Show all {items.length} results
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            compact
            icon={Search}
            title={`No ${nounPlural} found`}
            description="Try a wider radius or a different name."
          />
        )}
      </section>
      )}

    </div>
  );
}
