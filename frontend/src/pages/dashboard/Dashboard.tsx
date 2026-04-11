import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { TrendingUp, Clock, Zap, ExternalLink, Database } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ArbitrageFlow from "../../components/ArbitrageFlow";
import { ScannerConsole } from "../../components/command/ScannerConsole";
import type { ApiAlertRow, ApiDashboardStats, ApiMeta } from "../../api/types";
import {
  getAlerts,
  getDashboardStats,
  getMeta,
  splitMappedExchanges,
} from "../../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ApiAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, m, a] = await Promise.all([
          getDashboardStats(),
          getMeta(),
          getAlerts("Active"),
        ]);
        if (!cancelled) {
          setStats(s);
          setMeta(m);
          setActiveAlerts(
            [...a].sort((x, y) => y.profit_percent - x.profit_percent)
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topOpportunity = activeAlerts[0];

  const scannerLines = useMemo(() => {
    const n = activeAlerts.length;
    const top = topOpportunity?.event_title ?? "—";
    const shortTop = top.length > 52 ? `${top.slice(0, 49)}…` : top;
    const snap = stats?.latest_snapshot_at
      ? new Date(stats.latest_snapshot_at).toLocaleString()
      : "—";
    return [
      {
        text: stats?.scanner_message ?? "Scanner status unavailable",
        variant: "muted" as const,
      },
      {
        text: `${meta?.exchange_count ?? "—"} exchanges · ${meta?.market_count ?? "—"} markets in DB`,
        variant: "default" as const,
      },
      {
        text: `${n} active alert${n === 1 ? "" : "s"} · top: ${shortTop}`,
        variant: "accent" as const,
      },
      { text: `Latest snapshot: ${snap}`, variant: "muted" as const },
    ];
  }, [activeAlerts.length, meta, stats, topOpportunity?.event_title]);

  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return "—";
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const avgMargin =
    activeAlerts.length > 0
      ? activeAlerts.reduce((a, o) => a + o.profit_percent, 0) / activeAlerts.length
      : null;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-white">Arbitrage Scanner</h1>
              <p className="text-sm text-slate-400">
                Active alerts and database health from the backend
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="mb-1 text-xs text-slate-500">Active alerts</div>
                <div className="text-2xl font-semibold text-emerald-400">
                  {loading ? "—" : stats?.active_alert_count ?? 0}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-xs text-slate-500">Events in DB</div>
                <div className="text-2xl font-semibold text-white">
                  {loading ? "—" : meta?.event_count ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}
        <ScannerConsole lines={scannerLines} className="mb-6 max-w-3xl" />

        {!loading && topOpportunity && topOpportunity.event_id != null && (
          <Card className="mb-8 overflow-hidden border-emerald-800 bg-gradient-to-br from-emerald-950 to-slate-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium uppercase tracking-wide text-amber-400">
                    Highest margin (active)
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white">{topOpportunity.status}</Badge>
              </div>

              <Link
                to={`/events/${topOpportunity.event_id}`}
                className="mb-4 block text-xl font-semibold text-white transition-colors hover:text-emerald-400"
              >
                {topOpportunity.event_title}
              </Link>

              <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                {(() => {
                  const [buy, sell] = splitMappedExchanges(topOpportunity.mapped_exchanges);
                  return (
                    <ArbitrageFlow
                      buyExchange={buy}
                      sellExchange={sell}
                      profitPercent={topOpportunity.profit_percent}
                      size="lg"
                    />
                  );
                })()}
                <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
                  <Link to={`/events/${topOpportunity.event_id}`}>
                    View event
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active alerts</h2>
            <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
              <Link to="/alerts">
                All alerts
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <Card className="border-slate-800 bg-slate-900">
                <CardContent className="p-8 text-center text-slate-500">Loading…</CardContent>
              </Card>
            ) : activeAlerts.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900">
                <CardContent className="p-8 text-center text-slate-500">
                  No active arbitrage alerts. Run a sync or mock scan to populate the database.
                </CardContent>
              </Card>
            ) : (
              activeAlerts.map((opp, index) => {
                const [buy, sell] = splitMappedExchanges(opp.mapped_exchanges);
                return (
                  <Card
                    key={opp.alert_id}
                    className="border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-900/20"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            {index === 0 && (
                              <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">
                                #1
                              </Badge>
                            )}
                            {opp.event_id != null ? (
                              <Link
                                to={`/events/${opp.event_id}`}
                                className="truncate font-medium text-white transition-colors hover:text-emerald-400"
                              >
                                {opp.event_title}
                              </Link>
                            ) : (
                              <span className="font-medium text-white">{opp.event_title}</span>
                            )}
                          </div>

                          <ArbitrageFlow
                            buyExchange={buy}
                            sellExchange={sell}
                            profitPercent={opp.profit_percent}
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Venues (mapped): {opp.mapped_exchanges || "—"}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(opp.detected_at)}
                          </div>
                          {opp.event_id != null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                              <Link to={`/events/${opp.event_id}`}>Event detail</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-xs text-slate-500">Avg active margin</div>
                  <div className="text-xl font-semibold text-white">
                    {avgMargin != null ? `${avgMargin.toFixed(2)}%` : "—"}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-xs text-slate-500">Price snapshots</div>
                  <div className="text-xl font-semibold text-white">
                    {stats?.total_snapshots ?? "—"}
                  </div>
                </div>
                <Database className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-xs text-slate-500">Exchanges configured</div>
                  <div className="text-xl font-semibold text-white">
                    {meta?.exchange_count ?? "—"}
                  </div>
                </div>
                <div className="text-2xl text-slate-700">⚡</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
