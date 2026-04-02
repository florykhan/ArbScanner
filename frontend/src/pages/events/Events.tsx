import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { events } from "../../data/mockData";
import { cn } from "../../components/ui/utils";

function searchTokens(query: string) {
  return query
    .toLowerCase()
    .trim()
    .replace(/^>\s*/, "")
    .split(/[\s+]+/)
    .filter(Boolean);
}

export default function Events() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">(
    "all"
  );

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(events.map((e) => e.category)))],
    []
  );

  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("cat");
    const status = searchParams.get("status");
    if (q != null) setSearchQuery(q.replace(/\+/g, " "));
    if (cat && events.some((e) => e.category === cat)) setCategoryFilter(cat);
    if (status === "active" || status === "closed") setStatusFilter(status);
  }, [searchParams]);

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filteredEvents = events.filter((event) => {
    const hay = `${event.title} ${event.category} ${event.description ?? ""}`.toLowerCase();
    const matchesTokens =
      tokens.length === 0 ||
      tokens.every((t) => hay.includes(t));
    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesTokens && matchesCategory && matchesStatus;
  });

  const formatCloseTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Crypto: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Finance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Stocks: "bg-green-500/20 text-green-400 border-green-500/30",
      Technology: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Commodities: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return colors[category] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-white">Events</h1>
              <p className="text-sm text-slate-400">
                Browse prediction market events
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-slate-500">Total Events</div>
              <div className="text-2xl font-semibold text-white">
                {events.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="events-query">
                Query events
              </label>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border border-slate-700/90 bg-slate-900/80 pr-1",
                  "ring-1 ring-white/[0.03] transition-colors focus-within:border-emerald-600/45 focus-within:ring-emerald-500/15"
                )}
              >
                <span
                  className="pl-3 font-mono text-xs font-medium text-emerald-500/85 select-none"
                  aria-hidden
                >
                  ›
                </span>
                <Input
                  id="events-query"
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="crypto · tesla · active · stocks…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 flex-1 border-0 bg-transparent pl-0 text-sm text-white shadow-none placeholder:text-slate-600 placeholder:font-sans focus-visible:ring-0"
                />
                <Search className="mr-2 h-4 w-4 shrink-0 text-slate-600" aria-hidden />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-600">
                Multi-word queries match all terms · category & status filters
                combine
              </p>
            </div>
            <div className="flex items-center gap-2 md:shrink-0">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 border-slate-700 bg-slate-900 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white"
                    >
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as "all" | "active" | "closed")
                }
              >
                <SelectTrigger className="w-36 border-slate-700 bg-slate-900 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  <SelectItem value="all" className="text-white">
                    All statuses
                  </SelectItem>
                  <SelectItem value="active" className="text-white">
                    Active
                  </SelectItem>
                  <SelectItem value="closed" className="text-white">
                    Closed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">
                  No events found matching your criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/events/${event.id}`}
                        className="mb-2 block text-lg font-semibold text-white transition-colors hover:text-emerald-400"
                      >
                        {event.title}
                      </Link>

                      {event.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-slate-400">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(event.category)}
                        >
                          {event.category}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          Closes: {formatCloseTime(event.closeTime)}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            event.status === "active"
                              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                              : "border-slate-500/30 bg-slate-500/20 text-slate-400"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Link to={`/events/${event.id}`}>
                        View Markets
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
