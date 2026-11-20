import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeftRight, Calculator, Coins, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip, FeatureSurface } from "@/components/ui/feature-surface";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type ConversionResult, type ExchangeRateDto } from "@/lib/api";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ExchangeRateHistoryChart } from "./exchange-rate-history-chart";

const CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN"];
const TARGETS = CURRENCIES.filter((c) => c !== "GHS");

function RateCard({ rate, inverted }: { rate: ExchangeRateDto; inverted: boolean }) {
  const base = inverted ? rate.targetCurrency : rate.baseCurrency;
  const target = inverted ? rate.baseCurrency : rate.targetCurrency;
  const value = inverted ? 1 / rate.rate : rate.rate;
  return (
    <motion.article
      variants={fadeUp}
      className="flex flex-col gap-3 rounded-3xl bg-accent/50 p-5 transition-colors duration-300 hover:bg-accent/70">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-card text-xs font-bold text-accent-foreground">
            {target}
          </span>
          1 {base} =
        </span>
        <Chip className="bg-card/70">{rate.provider}</Chip>
      </div>
      <p className="text-3xl font-bold tracking-tight tabular-nums">
        {value.toFixed(4)}
        <span className="ml-2 text-base font-semibold text-muted-foreground">{target}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Updated {new Date(rate.timestamp).toLocaleString()}
      </p>
    </motion.article>
  );
}

export function ExchangeRatesPanel() {
  const [selected, setSelected] = useState<string[]>(TARGETS);
  const [rates, setRates] = useState<ExchangeRateDto[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [inverted, setInverted] = useState(false);

  const [from, setFrom] = useState("GHS");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);
  const convertId = useRef(0);
  const [convertError, setConvertError] = useState<string | null>(null);

  useEffect(() => {
    if (selected.length === 0) {
      setRates([]);
      setRatesError(null);
      setRatesLoading(false);
      return;
    }
    let active = true;
    setRatesLoading(true);
    setRatesError(null);
    api
      .getCurrentRates(selected)
      .then((res) => active && setRates(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.error("Failed to load exchange rates:", err);
        if (active) {
          setRates([]);
          setRatesError(err instanceof Error ? err.message : "Failed to load rates");
        }
      })
      .finally(() => active && setRatesLoading(false));
    return () => {
      active = false;
    };
  }, [selected]);

  const toggle = (c: string) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function onConvert(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!isFinite(amt) || amount.trim() === "") return;
    const id = ++convertId.current;
    setConverting(true);
    setConvertError(null);
    try {
      const res = await api.convertCurrency({ from, to, amount: amt });
      if (id === convertId.current) setResult(res);
    } catch (err) {
      console.error("Failed to convert currency:", err);
      if (id !== convertId.current) return;
      setConvertError(err instanceof Error ? err.message : "Failed to convert currency");
      setResult(null);
    } finally {
      if (id === convertId.current) setConverting(false);
    }
  }

  function swap() {
    convertId.current++;
    setConverting(false);
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  function resetConverter() {
    convertId.current++;
    setConverting(false);
    setFrom("GHS");
    setTo("USD");
    setAmount("100");
    setResult(null);
    setConvertError(null);
  }

  return (
    <div className="space-y-8">
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <FeatureSurface
          icon={Coins}
          title="Live exchange rates"
          description="Ghanaian cedi (GHS) against major currencies.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Currencies">
              {TARGETS.map((c) => {
                const on = selected.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(c)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
                      on
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}>
                    {c}
                  </button>
                );
              })}
            </div>
            <Button variant="outline" onClick={() => setInverted((v) => !v)} aria-pressed={inverted}>
              <ArrowLeftRight className="size-4" />
              {inverted ? "Showing X → GHS" : "Showing GHS → X"}
            </Button>
          </div>

          {ratesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TARGETS.map((c) => (
                <Skeleton key={c} className="h-36 rounded-3xl" />
              ))}
            </div>
          ) : ratesError ? (
            <EmptyState compact icon={AlertTriangle} title="Rates are unavailable" description={`${ratesError.replace(/[.\s]+$/, "")}. Please try again in a few minutes.`} />
          ) : rates.length === 0 ? (
            <EmptyState compact icon={Coins} title="No currencies selected" description="Pick one or more currencies above to see rates." />
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show">
              {rates.map((r) => (
                <RateCard key={`${r.baseCurrency}-${r.targetCurrency}`} rate={r} inverted={inverted} />
              ))}
            </motion.div>
          )}
        </FeatureSurface>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <FeatureSurface
          icon={Calculator}
          title="Currency converter"
          description="Convert an amount using live exchange rates.">
          <form onSubmit={onConvert} className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_1fr] md:items-end">
              <div className="space-y-2">
                <label className="text-sm font-semibold">From</label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="h-12 w-full px-5" aria-label="From currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Swap currencies" className="size-12 justify-self-center" onClick={swap}>
                <ArrowLeftRight className="size-4" />
              </Button>
              <div className="space-y-2">
                <label className="text-sm font-semibold">To</label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="h-12 w-full px-5" aria-label="To currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-semibold">Amount</label>
                <Input id="amount" className="h-12 px-5" inputMode="decimal" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg" disabled={converting}>
                <Calculator className="size-4" />
                {converting ? "Converting…" : "Convert"}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={resetConverter}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>
          </form>

          {convertError && (
            <EmptyState compact icon={AlertTriangle} title="Couldn't convert" description={convertError} />
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-accent p-6 text-accent-foreground">
              <p className="text-sm font-medium opacity-80">
                {result.amount.toLocaleString()} {result.from} =
              </p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                {result.result.toLocaleString(undefined, { maximumFractionDigits: 4 })} {result.to}
              </p>
              <p className="mt-2 text-xs opacity-75">
                Rate {result.rate.toFixed(6)} · {result.provider} · {new Date(result.timestamp).toLocaleString()}
              </p>
            </motion.div>
          )}
        </FeatureSurface>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <ExchangeRateHistoryChart />
      </motion.div>
    </div>
  );
}
