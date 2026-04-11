import { useEffect, useMemo, useState } from "react";
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
import { cn } from "../../components/ui/utils";
import type { ApiEventListItem } from "../../api/types";
import { getEvents } from "../../api/client";

function searchTokens(query: string) {
  return query
    .toLowerCase()
    .trim()
    .replace(/^>\s*/, "")
    .split(/[\s+]+/)
    .filter(Boolean);
}

function displayCategory(category: string | null) {
  return category?.trim() || "Uncategorized";
}

export default function Events() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<ApiEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">(
    "all"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvents();
        if (!cancelled) setEvents(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(events.map((e) => displayCategory(e.category)))
      ).sort(),
    ],
    [events]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("cat");
    const status = searchParams.get("status");
    if (q != null) setSearchQuery(q.replace(/\+/g, " "));
    if (cat && categories.includes(cat)) setCategoryFilter(cat);
    if (status === "active" || status === "closed") setStatusFilter(status);
  }, [searchParams, categories]);

  const tokens = useMemo(() => searchTokens(searchQuery), [searchQuery]);

  const filteredEvents = events.filter((event) => {
    const cat = displayCategory(event.category);
    const hay = `${event.title} ${cat} ${event.market_count} ${event.mapping_count}`.toLowerCase();
    const matchesTokens =
      tokens.length === 0 || tokens.every((t) => hay.includes(t));
    const matchesCategory =
      categoryFilter === "all" || cat === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesTokens && matchesCategory && matchesStatus;
  });

  const formatCloseTime = (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
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
      Uncategorized: "bg-slate-500/20 text-slate-400 border-slate-500/30",
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
                Browse prediction market events from the database
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-slate-500">Total Events</div>
              <div className="text-2xl font-semibold text-white">
                {loading ? "—" : events.length}
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
                  placeholder="crypto · fed · active · stocks…"
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
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              <>
                Showing {filteredEvents.length} of {events.length} events
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="space-y-3">
          {loading ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-12 text-center text-slate-400">
                Loading events…
              </CardContent>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">
                  No events found matching your criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => {
              const cat = displayCategory(event.category);
              return (
                <Card
                  key={event.event_id}
                  className="border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-900/10"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/events/${event.event_id}`}
                          className="mb-2 block text-lg font-semibold text-white transition-colors hover:text-emerald-400"
                        >
                          {event.title}
                        </Link>

                        <p className="mb-3 text-sm text-slate-400">
                          {event.market_count} market
                          {event.market_count === 1 ? "" : "s"} ·{" "}
                          {event.mapping_count} mapping
                          {event.mapping_count === 1 ? "" : "s"}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(cat)}
                          >
                            {cat}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Closes: {formatCloseTime(event.close_time)}
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
                        <Link to={`/events/${event.event_id}`}>
                          View detail
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
