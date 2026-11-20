import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import * as React from "react";

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
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_BASE } from "@/lib/api";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  status: string;
}

type ApiStock = Partial<Stock> & { symbol: string };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function formatMarketCap(marketCap: number) {
  if (marketCap >= 1e9) return `₵${(marketCap / 1e9).toFixed(1)}B`;
  if (marketCap >= 1e6) return `₵${(marketCap / 1e6).toFixed(1)}M`;
  if (marketCap > 0) return `₵${(marketCap / 1e3).toFixed(0)}K`;
  return "–";
}

function Change({ stock, compact = false }: { stock: Stock; compact?: boolean }) {
  const up = stock.change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tabular-nums",
        up ? "text-success" : "text-destructive"
      )}>
      <Icon className="size-4 shrink-0" />
      {up ? "+" : ""}
      {stock.changePercent.toFixed(2)}%
      {!compact && (
        <span className="text-xs font-medium opacity-75">
          ({up ? "+" : ""}₵{stock.change.toFixed(2)})
        </span>
      )}
    </span>
  );
}

function MoversCard({
  title,
  icon: Icon,
  stocks,
  tone,
}: {
  title: string;
  icon: typeof ArrowUpRight;
  stocks: Stock[];
  tone: "up" | "down";
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-2xl",
            tone === "up" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          )}>
          <Icon className="size-5" />
        </span>
        <h3 className="font-bold">{title}</h3>
      </div>
      {stocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to show right now.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {stocks.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold">{s.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{s.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">₵{s.price.toFixed(2)}</p>
                <Change stock={s} compact />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortHead({
  label,
  field,
  active,
  onSort,
  align = "left",
}: {
  label: string;
  field: keyof Stock;
  active: boolean;
  onSort: (f: keyof Stock) => void;
  align?: "left" | "right";
}) {
  return (
    <TableHead className={cn(align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-primary-ink"
        )}>
        {label}
        <ChevronDown className="size-3.5" />
      </button>
    </TableHead>
  );
}

export function StockMarketPanel() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [sector, setSector] = React.useState("all");
  const [sortField, setSortField] = React.useState<keyof Stock>("symbol");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const fetchStocks = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/stock-market/search?limit=50`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Failed to fetch stock data");
      }
      const data = await response.json();
      const list: ApiStock[] = Array.isArray(data?.data) ? data.data : [];
      setStocks(
        list.map((s) => ({
          id: s.symbol,
          symbol: s.symbol,
          name: s.name ?? s.symbol,
          price: num(s.price),
          change: num(s.change),
          changePercent: num(s.changePercent),
          volume: num(s.volume),
          marketCap: num(s.marketCap),
          sector: s.sector || "Other",
          status: s.status || "ACTIVE",
        }))
      );
      setError(null);
    } catch (err) {
      console.error("Error fetching stock data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stock data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  React.useEffect(() => setPage(1), [search, sector, perPage]);

  const sectors = React.useMemo(
    () => Array.from(new Set(stocks.map((s) => s.sector))).sort(),
    [stocks]
  );

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return stocks
      .filter(
        (s) =>
          (!q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) &&
          (sector === "all" || s.sector === sector)
      )
      .sort((a, b) => {
        const x = a[sortField];
        const y = b[sortField];
        const cmp =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [stocks, search, sector, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const start = (page - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);

  const gainers = React.useMemo(
    () => stocks.filter((s) => s.change > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 3),
    [stocks]
  );
  const losers = React.useMemo(
    () => stocks.filter((s) => s.change < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 3),
    [stocks]
  );
  const upCount = stocks.filter((s) => s.change > 0).length;
  const downCount = stocks.filter((s) => s.change < 0).length;
  const totalVolume = stocks.reduce((sum, s) => sum + s.volume, 0);

  const onSort = (field: keyof Stock) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    );
  }

  if (error && stocks.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Stock data is unavailable"
        description={`${error.replace(/[.\s]+$/, "")}. Please try again in a few minutes.`}
        className="py-16">
        <Button variant="outline" onClick={fetchStocks} disabled={refreshing}>
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          Try again
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={String(stocks.length)} label="Listed stocks" icon={BarChart3} />
        <StatCard value={`${upCount} up · ${downCount} down`} label="Today's movement" icon={Activity} />
        <StatCard value={totalVolume.toLocaleString()} label="Shares traded" icon={TrendingUp} />
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show">
        <motion.div variants={fadeUp}>
          <MoversCard title="Top gainers" icon={ArrowUpRight} stocks={gainers} tone="up" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MoversCard title="Top losers" icon={ArrowDownRight} stocks={losers} tone="down" />
        </motion.div>
      </motion.div>

      {error && stocks.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            Couldn't refresh stock data ({error.replace(/[.\s]+$/, "")}). The
            figures below may be out of date.
          </p>
        </div>
      )}

      <FeatureSurface
        icon={Activity}
        title="All listings"
        description="Real-time data from the Ghana Stock Exchange (GSE).">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search stocks"
              className="h-12 pl-11"
              placeholder="Search by symbol or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="h-12 w-full px-5 sm:w-56" aria-label="Sector">
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="lg" onClick={fetchStocks} disabled={refreshing}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <SortHead label="Stock" field="symbol" active={sortField === "symbol"} onSort={onSort} />
                  <SortHead label="Price" field="price" active={sortField === "price"} onSort={onSort} align="right" />
                  <SortHead label="Change" field="changePercent" active={sortField === "changePercent"} onSort={onSort} align="right" />
                  <SortHead label="Volume" field="volume" active={sortField === "volume"} onSort={onSort} align="right" />
                  <SortHead label="Market cap" field="marketCap" active={sortField === "marketCap"} onSort={onSort} align="right" />
                  <SortHead label="Sector" field="sector" active={sortField === "sector"} onSort={onSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length > 0 ? (
                  pageRows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-semibold">{s.symbol}</p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">{s.name}</p>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">₵{s.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right"><Change stock={s} /></TableCell>
                      <TableCell className="text-right tabular-nums">{s.volume.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMarketCap(s.marketCap)}</TableCell>
                      <TableCell><Chip>{s.sector}</Chip></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No stocks match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Show
            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="w-auto" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            per page · {rows.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-24 text-center text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </FeatureSurface>
    </div>
  );
}
