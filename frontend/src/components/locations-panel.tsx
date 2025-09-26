import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Region = { code: string; label: string };
type District = {
  code: string;
  label: string;
  category: string;
  capital: string;
};

export function LocationsPanel() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [region, setRegion] = useState<string>("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (!region) return;
    setLoading(true);
    api
      .getDistricts(region)
      .then(setDistricts)
      .finally(() => setLoading(false));
  }, [region]);

  function clearAll() {
    setRegion("");
    setDistricts([]);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}>
        <div className="p-6 border rounded-3xl bg-background">
          <h3 className="font-semibold mb-2">Ghana Regions & Districts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select a region to view all its districts and administrative
            information
          </p>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Choose Region
            </label>
            <div className="flex gap-2 flex-wrap">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a region to explore..." />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={clearAll}
                size="icon"
                disabled={!region && districts.length === 0}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.05 } },
        }}>
        {loading && (
          <div className="text-sm opacity-70">Loading districts...</div>
        )}
        {!loading && districts.length === 0 && (
          <div className="text-sm opacity-70">
            Select a region to view its districts.
          </div>
        )}
        {districts.map((d) => (
          <motion.div
            key={d.code}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}>
            <div className="p-4 border rounded-3xl bg-background hover:bg-accent/50 transition-colors">
              <div className="font-medium">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.category}</div>
              <div className="text-sm mt-1 text-muted-foreground">
                Capital: {d.capital}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
