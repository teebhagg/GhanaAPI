import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { AlertCircle, RotateCcw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDataPoint = {
  date: string;
  month: string;
  fullDate: Date;
  rate: number;
  originalRate?: number;
  provider: string;
};

const MONTHS_OPTIONS = [
  { label: "2 Months", value: 2 },
  { label: "3 Months", value: 3 },
  { label: "4 Months", value: 4 },
  { label: "5 Months", value: 5 },
  { label: "6 Months", value: 6 },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "NGN", "CHF", "JPY", "CNY"];

export function ExchangeRateHistoryChart() {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [months, setMonths] = useState(3);
  const [showInverted, setShowInverted] = useState(false);
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistoricalData() {
      if (!selectedCurrency) return;

      setLoading(true);
      setError(null);

      try {
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        const data = await api.getHistoricalRates(
          selectedCurrency,
          fromDate,
          toDate
        );

        // Sort by date and format for chart
        const sortedData = [...data]
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          })
          .map((rate) => {
            const date = new Date(rate.date);
            return {
              date: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              month: date.toLocaleDateString("en-US", {
                month: "short",
              }),
              fullDate: date,
              rate: Number(rate.rate),
              originalRate: Number(rate.rate),
              provider: rate.provider,
            };
          });

        setHistoricalData(sortedData);
      } catch (err) {
        console.error("Failed to fetch historical rates:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load historical data"
        );
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalData();
  }, [selectedCurrency, months]);

  // Transform data based on inversion
  const displayData = showInverted
    ? historicalData.map((d) => ({
        ...d,
        rate:
          (d.originalRate || d.rate) > 0 ? 1 / (d.originalRate || d.rate) : 0,
      }))
    : historicalData;

  // Calculate statistics based on displayed data
  const stats =
    displayData.length > 0
      ? {
          min: Math.min(...displayData.map((d) => d.rate)),
          max: Math.max(...displayData.map((d) => d.rate)),
          average:
            displayData.reduce((sum, d) => sum + d.rate, 0) /
            displayData.length,
          current: displayData[displayData.length - 1]?.rate || 0,
          change:
            displayData.length > 1
              ? displayData[displayData.length - 1].rate - displayData[0].rate
              : 0,
        }
      : null;

  const changePercent = stats
    ? stats.change !== 0 && displayData.length > 1
      ? ((stats.change / displayData[0].rate) * 100).toFixed(2)
      : "0.00"
    : "0.00";

  const isPositive = stats ? stats.change >= 0 : false;

  return (
    <Card className="w-full rounded-3xl shadow-none border">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-semibold">
            Exchange Rate History
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(months)}
              onValueChange={(v) => setMonths(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInverted(!showInverted)}
              className="text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reverse
            </Button>
          </div>
        </div>
        <CardDescription>
          Historical exchange rates for{" "}
          {showInverted ? `GHS/${selectedCurrency}` : `${selectedCurrency}/GHS`}{" "}
          over the last {months} {months === 1 ? "month" : "months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-sm text-muted-foreground">
              Loading chart data...
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-[400px] gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {!loading && !error && historicalData.length === 0 && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-sm text-muted-foreground">
              No historical data available for the selected period
            </div>
          </div>
        )}

        {!loading && !error && displayData.length > 0 && (
          <div className="space-y-6">
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    Current Rate
                  </div>
                  <div className="text-2xl font-semibold">
                    {stats.current.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {showInverted
                      ? `1 ${selectedCurrency} = ${stats.current.toFixed(
                          4
                        )} GHS`
                      : `1 GHS = ${stats.current.toFixed(
                          4
                        )} ${selectedCurrency}`}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    {isPositive ? "↑ Gain" : "↓ Loss"}
                  </div>
                  <div
                    className={`text-2xl font-semibold ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}>
                    {isPositive ? "+" : ""}
                    {stats.change.toFixed(4)} ({changePercent}%)
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    Average Rate
                  </div>
                  <div className="text-2xl font-semibold">
                    {stats.average.toFixed(4)}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    Range (Min - Max)
                  </div>
                  <div className="text-sm font-semibold">
                    {stats.min.toFixed(4)} - {stats.max.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={displayData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          isPositive ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"
                        }
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          isPositive ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"
                        }
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(_value, index) => {
                      // Show only month, and only when the month changes
                      const dataPoint = displayData[index];
                      if (!dataPoint) return "";

                      // Show month only if it's the first occurrence or different from previous
                      if (index === 0) return dataPoint.month;
                      const prevMonth = displayData[index - 1]?.month;
                      return dataPoint.month !== prevMonth
                        ? dataPoint.month
                        : "";
                    }}
                    interval={0}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => {
                      // Format based on the magnitude of the value
                      if (value === 0) return "0";
                      if (value < 0.001) return value.toExponential(2);
                      if (value < 1) return value.toFixed(4);
                      if (value < 10) return value.toFixed(3);
                      if (value < 100) return value.toFixed(2);
                      return value.toFixed(1);
                    }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Date:
                                </span>
                                <span className="text-xs font-medium">
                                  {data.fullDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Rate:
                                </span>
                                <span className="text-xs font-semibold">
                                  {showInverted
                                    ? `1 ${selectedCurrency} = ${data.rate.toFixed(
                                        6
                                      )} GHS`
                                    : `1 GHS = ${data.rate.toFixed(
                                        6
                                      )} ${selectedCurrency}`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Provider:
                                </span>
                                <span className="text-xs font-medium">
                                  {data.provider}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={isPositive ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
                    strokeWidth={2}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>
                Showing {displayData.length} data points from{" "}
                {displayData[0]?.fullDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                to{" "}
                {displayData[
                  displayData.length - 1
                ]?.fullDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
