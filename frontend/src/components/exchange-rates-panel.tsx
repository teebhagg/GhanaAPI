import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type ConversionResult, type ExchangeRateDto } from "@/lib/api";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const AVAILABLE_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN"];

export function ExchangeRatesPanel() {
  const [selectedCurrencies, setSelectedCurrencies] =
    useState<string[]>(AVAILABLE_CURRENCIES);
  const [rates, setRates] = useState<ExchangeRateDto[]>([]);
  const [originalRates, setOriginalRates] = useState<ExchangeRateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInverted, setShowInverted] = useState(false);

  const [from, setFrom] = useState("GHS");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<ConversionResult | null>(null);

  useEffect(() => {
    async function load() {
      if (selectedCurrencies.length === 0) {
        setRates([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await api.getCurrentRates(selectedCurrencies);
        // Ensure res is an array
        const ratesArr = Array.isArray(res) ? res : [];
        setRates(ratesArr);
        setOriginalRates(ratesArr);
      } catch (err) {
        console.error("Failed to load exchange rates:", err);
        setError(err instanceof Error ? err.message : "Failed to load rates");
        setRates([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCurrencies]);

  const handleCurrencyToggle = (currency: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(currency)
        ? prev.filter((c) => c !== currency)
        : [...prev, currency]
    );
  };

  const handleSelectAll = () => {
    setSelectedCurrencies(AVAILABLE_CURRENCIES);
  };

  const handleSelectNone = () => {
    setSelectedCurrencies([]);
  };

  const handleReverseRates = () => {
    setShowInverted((prev) => !prev);
  };

  async function onConvert(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!isFinite(amt)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.convertCurrency({ from, to, amount: amt });
      setResult(res);
    } catch (err) {
      console.error("Failed to convert currency:", err);
      setError(
        err instanceof Error ? err.message : "Failed to convert currency"
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function clearRates() {
    setSelectedCurrencies([]);
    setRates([]);
    setOriginalRates([]);
    setShowInverted(false);
  }

  function clearConverter() {
    setFrom("GHS");
    setTo("USD");
    setAmount("100");
    setResult(null);
    setError(null);
  }

  function clearAll() {
    clearRates();
    clearConverter();
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}>
        <div className="p-6 border rounded-3xl bg-background">
          <h3 className="font-semibold mb-2">Live Exchange Rates</h3>
          <p className="text-sm text-muted-foreground mb-4">
            View real-time exchange rates with Ghanaian Cedi (GHS) as the base
            currency
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Target Currencies
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs">
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNone}
                  className="text-xs">
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_CURRENCIES.map((currency) => (
                <div key={currency} className="flex items-center space-x-2">
                  <Checkbox
                    id={currency}
                    checked={selectedCurrencies.includes(currency)}
                    onCheckedChange={() => handleCurrencyToggle(currency)}
                  />
                  <label
                    htmlFor={currency}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    {currency}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReverseRates}
                  className="text-xs">
                  Reverse Rates (GHS ↔ Target)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearRates}
                  disabled={selectedCurrencies.length === 0}
                  className="text-xs">
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
          <motion.div
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}>
            {loading && (
              <div className="text-sm opacity-70">Loading rates...</div>
            )}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Error: {error}
              </div>
            )}
            {!loading && !error && rates.length === 0 && (
              <div className="text-sm opacity-70">No rates available.</div>
            )}
            {(() => {
              const displayRates = (showInverted ? originalRates : rates).map((r) => ({
                provider: r.provider,
                timestamp: r.timestamp,
                displayRate: showInverted ? 1 / r.rate : r.rate,
                baseCurrency: showInverted ? r.targetCurrency : r.baseCurrency,
                targetCurrency: showInverted ? r.baseCurrency : r.targetCurrency,
              }));
              return displayRates.map((rate, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}>
                  <div className="p-4 border rounded-3xl bg-background hover:bg-accent/50 transition-colors">
                    <div className="text-sm text-muted-foreground">
                      {rate.provider}
                    </div>
                    <div className="text-2xl font-semibold">
                      1 {rate.baseCurrency} = {rate.displayRate.toFixed(4)} {rate.targetCurrency}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(rate.timestamp).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ));
            })()}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}>
        <div className="p-6 border rounded-3xl bg-background">
          <h3 className="font-semibold mb-2">Currency Converter</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Convert amounts between different currencies using live exchange
            rates
          </p>
          <form onSubmit={onConvert} className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  From Currency
                </label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  To Currency
                </label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Amount
                </label>
                <Input
                  placeholder="e.g., 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Converting..." : "Convert Currency"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearConverter}
                disabled={
                  from === "GHS" && to === "USD" && amount === "100" && !result
                }>
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </form>
          {result && (
            <motion.div
              className="mt-4 p-4 rounded-3xl bg-muted/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}>
              <div className="text-sm font-medium">
                {result.amount} {result.from} → {result.result.toFixed(4)}{" "}
                {result.to}
              </div>
              <div className="text-xs opacity-70 mt-1">
                Rate: {result.rate.toFixed(6)} • Provider: {result.provider}
              </div>
              <div className="text-xs opacity-70">
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {(selectedCurrencies.length > 0 ||
        rates.length > 0 ||
        result ||
        from !== "GHS" ||
        to !== "USD" ||
        amount !== "100") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center">
          <Button
            variant="outline"
            onClick={clearAll}
            className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Clear All Exchange Data
          </Button>
        </motion.div>
      )}
    </div>
  );
}
