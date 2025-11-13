import {
  ArrowUpDown,
  BarChart3,
  BookOpenCheck,
  Building2,
  Eye,
  Globe,
  GraduationCap,
  Home,
  LibraryBig,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  School,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ElementType } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  api,
  type SchoolDto,
  type SchoolSearchQuery,
  type SchoolSearchResponse,
  type SchoolStatistics,
} from "@/lib/api";
import {
  SCHOOL_CATEGORIES,
  SCHOOL_GRADES,
  type SchoolCategory,
  type SchoolGrade,
} from "@/types/education";

interface SchoolFilters {
  name: string;
  region: string;
  district: string;
  category?: SchoolCategory;
  grade?: SchoolGrade;
}

const ALL_OPTION = "ALL";
const PAGE_SIZE = 20;

const categoryOptions = SCHOOL_CATEGORIES;
const gradeOptions = SCHOOL_GRADES;

function truncateLabel(value: string, max: number) {
  if (!value) return value;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

const isUniversity = (school: SchoolDto): boolean =>
  school.category === "UNIVERSITY";

const getGradeDisplay = (school: SchoolDto): string =>
  isUniversity(school) ? "NOT APPLICABLE" : `Grade ${school.grade}`;

const getGenderDisplay = (school: SchoolDto): string =>
  isUniversity(school) ? "NOT APPLICABLE" : school.gender;

const getResidencyDisplay = (school: SchoolDto): string =>
  isUniversity(school)
    ? "NOT APPLICABLE"
    : school.residency.replace("_", " & ");

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
}) {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function EducationPanel() {
  const [filters, setFilters] = useState<SchoolFilters>({
    name: "",
    region: "",
    district: "",
    category: undefined,
    grade: undefined,
  });
  const [results, setResults] = useState<SchoolSearchResponse | null>(null);
  const [stats, setStats] = useState<SchoolStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sortState, setSortState] = useState<{
    key: "name" | "category" | "grade";
    direction: "asc" | "desc";
  } | null>(null);

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.name ||
          filters.region ||
          filters.district ||
          filters.category !== undefined ||
          filters.grade !== undefined
      ),
    [filters]
  );

  useEffect(() => {
    void fetchStatistics();
    void fetchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getSchoolStatistics();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSearch = async (
    override: Partial<SchoolFilters> = {},
    overrideOffset?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const nextOffset = overrideOffset ?? offset;
      const query: SchoolSearchQuery = { limit: PAGE_SIZE, offset: nextOffset };

      const name = override.name ?? filters.name;
      if (name) query.name = name;

      const region = override.region ?? filters.region;
      if (region) query.region = region;

      const district = override.district ?? filters.district;
      if (district) query.district = district;

      const category = override.category ?? filters.category;
      if (category !== undefined) query.category = category;

      const grade = override.grade ?? filters.grade;
      if (grade !== undefined) query.grade = grade;

      const data = await api.searchSchools(query);
      setResults(data);
      setOffset(nextOffset);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch schools");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const initial: SchoolFilters = {
      name: "",
      region: "",
      district: "",
      category: undefined,
      grade: undefined,
    };
    setFilters(initial);
    setSortState(null);
    setOffset(0);
    void fetchSearch(initial, 0);
  };

  const sortedRows = useMemo(() => {
    if (!results) return [] as Array<{ order: number; school: SchoolDto }>;
    const base = [...results.data];
    if (sortState) {
      const { key, direction } = sortState;
      base.sort((a, b) => {
        let first = "";
        let second = "";
        if (key === "name") {
          first = a.name;
          second = b.name;
        } else if (key === "category") {
          first = a.category;
          second = b.category;
        } else if (key === "grade") {
          first = a.grade;
          second = b.grade;
        }
        const compare = first.localeCompare(second, undefined, {
          sensitivity: "base",
        });
        return direction === "asc" ? compare : -compare;
      });
    }
    return base.map((school, index) => ({
      order: offset + index + 1,
      school,
    }));
  }, [results, sortState, offset]);

  const toggleSort = (key: "name" | "category" | "grade") => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  return (
    <section className="space-y-10">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Education Statistics</h2>
        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Schools"
              value={stats.totalSchools}
              description="Institutions in the national registry"
              icon={School}
            />
            <StatCard
              title="Top Category"
              value={
                Object.entries(stats.byCategory).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || "N/A"
              }
              description="Most represented category"
              icon={LibraryBig}
            />
            <StatCard
              title="Top Grade"
              value={
                Object.entries(stats.byGrade).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || "N/A"
              }
              description="Highest count grade"
              icon={GraduationCap}
            />
            <StatCard
              title="Regions Tracked"
              value={Object.keys(stats.byRegion).length}
              description="Regional coverage"
              icon={BarChart3}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Statistics unavailable.
          </p>
        )}
      </div>

      <Card className="border border-border/70 bg-card/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Search Schools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">School Name</Label>
              <Input
                id="name"
                placeholder="e.g. Achimota"
                value={filters.name}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="e.g. Greater Accra"
                value={filters.region}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, region: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                placeholder="e.g. Accra Metropolis"
                value={filters.district}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, district: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category ?? ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    category:
                      value === ALL_OPTION
                        ? undefined
                        : (value as SchoolCategory),
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select
                value={filters.grade ?? ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    grade:
                      value === ALL_OPTION ? undefined : (value as SchoolGrade),
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All grades</SelectItem>
                  {gradeOptions.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setSortState(null);
                void fetchSearch({}, 0);
              }}
              disabled={loading}>
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading || !hasFilters}>
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            {loading && (
              <span className="text-sm text-muted-foreground">Loading…</span>
            )}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-card/60">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                Search Results
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {results?.data.length ?? 0} schools listed
                {filters.region && ` • Region: ${filters.region}`}
                {filters.category && ` • Category: ${filters.category}`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : results && sortedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="inline-flex items-center gap-1 font-semibold">
                        School
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className="inline-flex items-center gap-1">
                        Category
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button
                        type="button"
                        onClick={() => toggleSort("grade")}
                        className="inline-flex items-center gap-1">
                        Grade
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Profile
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map(({ order, school }) => (
                    <TableRow key={school.id}>
                      <TableCell className="w-14 text-xs text-muted-foreground">
                        {order}
                      </TableCell>
                      <TableCell title={school.name}>
                        <div className="font-semibold text-sm md:text-base">
                          {truncateLabel(school.name, 45)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {school.district}, {school.region}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {school.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {isUniversity(school) ? (
                          <Badge variant="outline" className="text-xs">
                            NOT APPLICABLE
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {getGradeDisplay(school)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {isUniversity(school) ? (
                          <div className="text-xs uppercase tracking-wide">
                            NOT APPLICABLE
                          </div>
                        ) : (
                          <>
                            <div>{school.gender}</div>
                            <div className="text-xs text-muted-foreground">
                              {school.residency.replace("_", " & ")}
                            </div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {`${school.district}, ${school.region}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSchool(school);
                            setDialogOpen(true);
                          }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <BookOpenCheck className="h-10 w-10" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  No schools found
                </h3>
                <p className="text-sm">
                  Adjust your filters or try a broader search query to see more
                  institutions.
                </p>
              </div>
            </div>
          )}

          {results && sortedRows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-sm text-muted-foreground">
              <span>
                Page {Math.floor(offset / PAGE_SIZE) + 1}{" "}
                {results.pagination.hasMore ? "(more results available)" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void fetchSearch({}, Math.max(offset - PAGE_SIZE, 0))
                  }
                  disabled={offset === 0 || loading}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchSearch({}, offset + PAGE_SIZE)}
                  disabled={!results.pagination.hasMore || loading}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedSchool(null);
          }
        }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          {selectedSchool && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 sm:pr-4">
              <DialogHeader>
                <DialogTitle>{selectedSchool.name}</DialogTitle>
                <DialogDescription>
                  {selectedSchool.region} • {selectedSchool.district}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {selectedSchool.category.replace("_", " ")}
                </Badge>
                <Badge
                  variant={
                    isUniversity(selectedSchool) ? "outline" : "secondary"
                  }>
                  {getGradeDisplay(selectedSchool)}
                </Badge>
                <Badge variant="outline">
                  {getGenderDisplay(selectedSchool)}
                </Badge>
                <Badge variant="outline">
                  {getResidencyDisplay(selectedSchool)}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard
                  icon={MapPin}
                  label="Region"
                  value={selectedSchool.region}
                />
                <DetailCard
                  icon={Building2}
                  label="District"
                  value={selectedSchool.district}
                />
                <DetailCard
                  icon={Users}
                  label="Gender"
                  value={getGenderDisplay(selectedSchool)}
                />
                <DetailCard
                  icon={Home}
                  label="Residency"
                  value={getResidencyDisplay(selectedSchool)}
                />
                <DetailCard
                  icon={BookOpenCheck}
                  label="Nickname"
                  value={selectedSchool.nickname ?? undefined}
                />
                <DetailCard
                  icon={GraduationCap}
                  label="Established"
                  value={
                    selectedSchool.establishedYear
                      ? `${selectedSchool.establishedYear}`
                      : undefined
                  }
                />
                <DetailCard
                  icon={BarChart3}
                  label="Student Population"
                  value={
                    selectedSchool.studentPopulation
                      ? selectedSchool.studentPopulation.toLocaleString()
                      : undefined
                  }
                />
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Campus & Contact
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedSchool.location ||
                        "Location information not available"}
                    </span>
                  </div>
                  {selectedSchool.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${selectedSchool.email}`}
                        className="hover:text-primary">
                        {selectedSchool.email}
                      </a>
                    </div>
                  )}
                  {selectedSchool.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`tel:${selectedSchool.phone}`}
                        className="hover:text-primary">
                        {selectedSchool.phone}
                      </a>
                    </div>
                  )}
                  {selectedSchool.boxAddress && (
                    <div className="flex items-center gap-2">
                      <LibraryBig className="h-4 w-4" />
                      <span>{selectedSchool.boxAddress}</span>
                    </div>
                  )}
                  {selectedSchool.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={selectedSchool.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary">
                        {selectedSchool.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(selectedSchool.createdAt).toLocaleDateString()} •
                  Updated{" "}
                  {new Date(selectedSchool.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {selectedSchool.programsOffered?.length ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Programs Offered
                  </h4>
                  <div className="max-h-40 rounded-xl border border-border/50 bg-muted/10 p-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedSchool.programsOffered.map((program) => (
                        <Badge
                          key={program}
                          variant="outline"
                          className="text-xs">
                          {program}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
