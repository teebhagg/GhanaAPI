import { motion } from "framer-motion";
import { AlertTriangle, Compass, Landmark, MapPinned, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip, FeatureSurface } from "@/components/ui/feature-surface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { fadeUp, staggerContainer } from "@/lib/motion";

type Region = { code: string; label: string };
type District = {
  code: string;
  label: string;
  category: string;
  capital: string;
};

function DistrictCard({ district }: { district: District }) {
  return (
    <motion.article
      variants={fadeUp}
      className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{district.label}</h3>
        <Chip icon={Tag} className="shrink-0">
          {district.category}
        </Chip>
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
        <Landmark className="size-4 shrink-0 text-primary-ink" />
        <span className="truncate">
          Capital:{" "}
          <span className="font-medium text-foreground">{district.capital}</span>
        </span>
      </div>
    </motion.article>
  );
}

export function LocationsPanel() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [region, setRegion] = useState<string>("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (!region) return;
    // Ignore completions from regions the user has since moved away from.
    let active = true;
    setLoading(true);
    setError(null);
    setDistricts([]);
    api
      .getDistricts(region)
      .then((d) => active && setDistricts(d))
      .catch((err) => {
        console.error(err);
        if (active) setError(err instanceof Error ? err.message : "Failed to load districts");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [region]);

  function clearAll() {
    setRegion("");
    setDistricts([]);
    setError(null);
  }

  const regionLabel = regions.find((r) => r.code === region)?.label;

  return (
    <div className="space-y-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}>
        <FeatureSurface
          icon={MapPinned}
          title="Choose a region"
          description="See every district in a region, with its category and capital.">
          <div className="flex gap-2">
            <Select
              value={region}
              onValueChange={(v) => {
                // Clear immediately so the new heading never sits above the old
                // region's districts for a render.
                setDistricts([]);
                setError(null);
                setLoading(true);
                setRegion(v);
              }}>
              <SelectTrigger className="h-12 flex-1 rounded-full px-5">
                <SelectValue placeholder="Choose a region…" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {regions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              aria-label="Clear region"
              className="size-12"
              onClick={clearAll}
              disabled={!region && districts.length === 0}>
              <X className="size-4" />
            </Button>
          </div>
        </FeatureSurface>
      </motion.div>

      <section aria-live="polite" className="space-y-4">
        {regionLabel && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">{regionLabel}</h2>
            <Chip>{districts.length} districts</Chip>
          </div>
        )}

        {!region ? (
          <EmptyState
            icon={MapPinned}
            title="Pick a region"
            description="Its districts and capitals will appear here."
          />
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load districts"
            description={`${error.replace(/[.\s]+$/, "")}. Please try again.`}
          />
        ) : districts.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No districts found"
            description="This region has no district data yet."
          />
        ) : (
          <motion.div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="show">
            {districts.map((d, i) => (
              <DistrictCard key={`${d.code}-${i}`} district={d} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
