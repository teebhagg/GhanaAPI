import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import * as React from "react";

// Stock data interface
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

interface StockTableProps {
  stocks: Stock[];
  searchTerm: string;
  sectorFilter: string;
  onSearchChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  showPagination?: boolean;
}

function StockTable({
  stocks,
  searchTerm,
  sectorFilter,
  onSearchChange,
  onSectorChange,
  showPagination = true,
}: StockTableProps) {
  const [sortField, setSortField] = React.useState<keyof Stock>("symbol");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc"
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Get unique sectors for filter
  const sectors = React.useMemo(() => {
    return Array.from(new Set(stocks.map((stock) => stock.sector))).sort();
  }, [stocks]);

  // Filter and sort stocks
  const filteredAndSortedStocks = React.useMemo(() => {
    let filtered = stocks.filter((stock) => {
      const matchesSearch =
        searchTerm === "" ||
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSector =
        sectorFilter === "" ||
        sectorFilter === "all" ||
        stock.sector === sectorFilter;

      return matchesSearch && matchesSector;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [stocks, searchTerm, sectorFilter, sortField, sortDirection]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sectorFilter]);

  // Pagination calculations
  const totalItems = filteredAndSortedStocks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStocks = showPagination
    ? filteredAndSortedStocks.slice(startIndex, endIndex)
    : filteredAndSortedStocks;

  const handleSort = (field: keyof Stock) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) return `₵${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `₵${(marketCap / 1e6).toFixed(1)}M`;
    return `₵${(marketCap / 1e3).toFixed(0)}K`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stocks by symbol or name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sectorFilter} onValueChange={onSectorChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("symbol")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Stock
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("price")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Price (₵)
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("change")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Change
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("volume")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Volume
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("marketCap")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Market Cap
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("sector")}
                    className="h-auto p-0 font-semibold hover:bg-transparent">
                    Sector
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStocks.length > 0 ? (
                paginatedStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  return (
                    <TableRow key={stock.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {stock.symbol}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {stock.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₵{stock.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`font-mono flex items-center justify-end gap-1 text-sm ${
                            isPositive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <div className="flex flex-col text-right">
                            <span>
                              {isPositive ? "+" : ""}₵{stock.change.toFixed(2)}
                            </span>
                            <span className="text-xs">
                              ({isPositive ? "+" : ""}
                              {stock.changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {stock.volume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMarketCap(stock.marketCap)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {stock.sector}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No stocks found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {totalItems === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, totalItems)} of {totalItems} results
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-8">
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!showPagination && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedStocks.length} of {stocks.length} stocks
        </div>
      )}
    </div>
  );
}

export function StockMarketPanel() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sectorFilter, setSectorFilter] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchStocks = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        "http://localhost:3000/api/v1/stock-market/search?limit=50"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data = await response.json();

      // Transform the API response to match our interface
      const transformedStocks: Stock[] =
        data.data?.map((stock: any) => ({
          id: stock.symbol,
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          sector: stock.sector,
          status: stock.status || "ACTIVE",
        })) || [];

      setStocks(transformedStocks);
      setError(null);
    } catch (err) {
      console.error("Error fetching stock data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch stock data"
      );

      // Fallback to mock data for development
      //   const mockStocks: Stock[] = [
      //     {
      //       id: 'GCB',
      //       symbol: 'GCB',
      //       name: 'GCB Bank Limited',
      //       price: 4.25,
      //       change: 0.15,
      //       changePercent: 3.66,
      //       volume: 125000,
      //       marketCap: 2800000000,
      //       sector: 'Banking',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'TOTAL',
      //       symbol: 'TOTAL',
      //       name: 'Total Petroleum Ghana Ltd',
      //       price: 3.80,
      //       change: -0.05,
      //       changePercent: -1.30,
      //       volume: 85000,
      //       marketCap: 1200000000,
      //       sector: 'Energy',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'MTN',
      //       symbol: 'MTN',
      //       name: 'MTN Ghana',
      //       price: 0.95,
      //       change: 0.02,
      //       changePercent: 2.15,
      //       volume: 245000,
      //       marketCap: 3900000000,
      //       sector: 'Telecommunications',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'AADS',
      //       symbol: 'AADS',
      //       name: 'Ayrton Drug Manufacturing Ltd',
      //       price: 2.15,
      //       change: 0.08,
      //       changePercent: 3.86,
      //       volume: 45000,
      //       marketCap: 650000000,
      //       sector: 'Healthcare',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'FML',
      //       symbol: 'FML',
      //       name: 'Fan Milk Ltd',
      //       price: 5.60,
      //       change: -0.10,
      //       changePercent: -1.75,
      //       volume: 68000,
      //       marketCap: 890000000,
      //       sector: 'Consumer Goods',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'EGL',
      //       symbol: 'EGL',
      //       name: 'Enterprise Group Limited',
      //       price: 1.85,
      //       change: 0.05,
      //       changePercent: 2.78,
      //       volume: 95000,
      //       marketCap: 1450000000,
      //       sector: 'Insurance',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'CAL',
      //       symbol: 'CAL',
      //       name: 'CAL Bank Limited',
      //       price: 0.78,
      //       change: -0.02,
      //       changePercent: -2.50,
      //       volume: 156000,
      //       marketCap: 845000000,
      //       sector: 'Banking',
      //       status: 'ACTIVE'
      //     },
      //     {
      //       id: 'GOIL',
      //       symbol: 'GOIL',
      //       name: 'Ghana Oil Company Ltd',
      //       price: 2.45,
      //       change: 0.12,
      //       changePercent: 5.15,
      //       volume: 78000,
      //       marketCap: 1680000000,
      //       sector: 'Energy',
      //       status: 'ACTIVE'
      //     }
      //   ]
      //   setStocks(mockStocks)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ghana Stock Exchange
          </CardTitle>
          <CardDescription>
            Loading real-time stock market data...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching stock data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topGainers = stocks
    .filter((stock) => stock.change > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  const topLosers = stocks
    .filter((stock) => stock.change < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ghana Stock Exchange
            </CardTitle>
            <CardDescription>
              Real-time stock market data from the Ghana Stock Exchange (GSE)
              {error && (
                <span className="block text-amber-600 dark:text-amber-400 text-sm mt-1">
                  ⚠️ Using demo data - API connection failed
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStocks}
            disabled={refreshing}>
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Stocks</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <StockTable
              stocks={stocks}
              searchTerm={searchTerm}
              sectorFilter={sectorFilter}
              onSearchChange={setSearchTerm}
              onSectorChange={setSectorFilter}
              showPagination={true}
            />
          </TabsContent>

          <TabsContent value="gainers" className="mt-6">
            <StockTable
              stocks={topGainers}
              searchTerm=""
              sectorFilter=""
              onSearchChange={() => {}}
              onSectorChange={() => {}}
              showPagination={false}
            />
          </TabsContent>

          <TabsContent value="losers" className="mt-6">
            <StockTable
              stocks={topLosers}
              searchTerm=""
              sectorFilter=""
              onSearchChange={() => {}}
              onSectorChange={() => {}}
              showPagination={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
