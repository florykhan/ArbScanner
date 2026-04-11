import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Tag,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import type { ApiEventDetail, ApiPricePoint } from "../../api/types";
import { getEventDetail, getEventYesHistory } from "../../api/client";

const CHART_COLORS = [
  "#34d399",
  "#22d3ee",
  "#a78bfa",
  "#fb923c",
  "#f472b6",
  "#93c5fd",
  "#fcd34d",
];

function displayCategory(category: string | null) {
  return category?.trim() || "Uncategorized";
}

function formatProb(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(4);
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(5, 16);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pivotYesHistory(points: ApiPricePoint[]) {
  const sorted = [...points].sort((a, b) =>
    (a.snapshot_time ?? "").localeCompare(b.snapshot_time ?? "")
  );
  const merged = new Map<string, Record<string, string | number | null>>();
  const exchanges = new Set<string>();
  for (const p of sorted) {
    if (!p.snapshot_time || p.last == null) continue;
    exchanges.add(p.exchange_name);
    const row =
      merged.get(p.snapshot_time) ??
      ({ time: formatTimeLabel(p.snapshot_time) } as Record<
        string,
        string | number | null
      >);
    row[p.exchange_name] = p.last;
    merged.set(p.snapshot_time, row);
  }
  const rows = Array.from(merged.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);
  return { rows, exchanges: [...exchanges].sort() };
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const [detail, setDetail] = useState<ApiEventDetail | null>(null);
  const [history, setHistory] = useState<ApiPricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setLoading(false);
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [d, h] = await Promise.all([
          getEventDetail(eventId),
          getEventYesHistory(eventId).catch(() => []),
        ]);
        if (!cancelled) {
          setDetail(d);
          setHistory(h);
        }
      } catch (e) {
        if (!cancelled) {
          setDetail(null);
          setError(e instanceof Error ? e.message : "Failed to load event");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const { chartRows, exchangeKeys } = useMemo(() => {
    const { rows, exchanges } = pivotYesHistory(history);
    return { chartRows: rows, exchangeKeys: exchanges };
  }, [history]);

  const yDomain = useMemo(() => {
    let lo = 1;
    let hi = 0;
    for (const row of chartRows) {
      for (const ex of exchangeKeys) {
        const v = row[ex];
        if (typeof v === "number") {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    }
    if (lo >= hi) return [0, 1] as [number, number];
    const pad = (hi - lo) * 0.08;
    return [Math.max(0, lo - pad), Math.min(1, hi + pad)] as [number, number];
  }, [chartRows, exchangeKeys]);

  if (!Number.isFinite(eventId) || eventId <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
        <Card className="max-w-md border-slate-800 bg-slate-900">
          <CardContent className="pb-12 pt-12 text-center">
            <h2 className="mb-2 text-2xl font-semibold text-white">Invalid event</h2>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && (error || !detail)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
        <Card className="max-w-md border-slate-800 bg-slate-900">
          <CardContent className="pb-12 pt-12 text-center">
            <h2 className="mb-2 text-2xl font-semibold text-white">Event not found</h2>
            <p className="mb-6 text-slate-400">{error ?? "Unknown error"}</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = detail;
  const cat = event ? displayCategory(event.category) : "";

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

  const synth = event?.synthetic_edge;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-slate-400 hover:text-white"
            asChild
          >
            <Link to="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>

          {loading || !event ? (
            <p className="text-slate-400">Loading…</p>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-3 text-2xl font-semibold text-white">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-500" />
                    <Badge variant="outline" className={getCategoryColor(cat)}>
                      {cat}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>Closes: {formatCloseTime(event.close_time)}</span>
                  </div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                    {event.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-8">
        {loading && (
          <Card className="mb-8 border-slate-800 bg-slate-900">
            <CardContent className="p-8 text-center text-slate-400">
              Loading market data…
            </CardContent>
          </Card>
        )}

        {!loading && event && synth != null && synth.edge_percent > 0.005 && (
          <Card className="mb-8 border-emerald-800 bg-gradient-to-br from-emerald-950 to-slate-900">
            <CardHeader className="border-b border-emerald-800/50">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Cross-venue YES / NO snapshot edge
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4 text-xs text-slate-400">
                Best YES ask plus best NO ask across venues with latest snapshots (same
                heuristic as the operator terminal). Not execution advice.
              </p>
              <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Cheapest YES (ask)
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-slate-900/50 p-4">
                    <Badge className="mb-2 border-blue-500/30 bg-blue-500/20 text-blue-400">
                      {synth.yes_exchange}
                    </Badge>
                    <div className="font-mono text-sm text-slate-500">{synth.yes_market_code}</div>
                  </div>
                </div>
                <ArrowRight className="mx-2 hidden h-8 w-8 text-emerald-400 lg:block" />
                <div className="flex-1">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Cheapest NO (ask)
                  </div>
                  <div className="rounded-lg border border-purple-500/30 bg-slate-900/50 p-4">
                    <Badge className="mb-2 border-purple-500/30 bg-purple-500/20 text-purple-400">
                      {synth.no_exchange}
                    </Badge>
                    <div className="font-mono text-sm text-slate-500">{synth.no_market_code}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Implied edge
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-4">
                    <div className="text-2xl font-semibold text-emerald-400">
                      {synth.edge_percent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500">
                      Pair cost {synth.pair_cost.toFixed(4)} (1 − pair)
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-800/30 bg-amber-950/30 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                <div className="text-sm text-amber-200">
                  Uses stored <strong>PriceSnapshot</strong> rows only. Fees, liquidity, and
                  resolution rules are not modeled here.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && event && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Contracts & latest snapshots</h2>
          {event.markets.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-8 text-center text-slate-400">
                No markets or contracts linked to this event in the database.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-900">
                    <TableHead className="text-slate-400">Exchange</TableHead>
                    <TableHead className="text-slate-400">Market code</TableHead>
                    <TableHead className="text-slate-400">Outcome</TableHead>
                    <TableHead className="text-right text-slate-400">Bid</TableHead>
                    <TableHead className="text-right text-slate-400">Ask</TableHead>
                    <TableHead className="text-right text-slate-400">Last</TableHead>
                    <TableHead className="text-right text-slate-400">Spread</TableHead>
                    <TableHead className="text-slate-400">Snapshot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.markets.map((m, idx) => (
                    <TableRow key={`${m.market_id}-${m.outcome_label}-${idx}`} className="border-slate-800">
                      <TableCell className="font-medium text-white">{m.exchange_name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {m.exchange_market_code}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-slate-600 text-slate-200"
                        >
                          {m.outcome_label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300">
                        {formatProb(m.bid)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300">
                        {formatProb(m.ask)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-300">
                        {formatProb(m.last)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-400">
                        {formatProb(m.spread)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {m.snapshot_time ? formatTimeLabel(m.snapshot_time) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
        )}

        {!loading && event && (
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">YES outcome — last price over time</CardTitle>
            <p className="text-xs font-normal text-slate-500">
              One series per exchange from <code className="text-slate-400">PriceSnapshot</code>{" "}
              (YES contracts only).
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {chartRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No YES snapshot history for this event yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    style={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: 11 }}
                    domain={yDomain}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {exchangeKeys.map((ex, i) => (
                    <Line
                      key={ex}
                      type="monotone"
                      dataKey={ex}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={1.75}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
