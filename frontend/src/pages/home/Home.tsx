import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRightLeft,
  Zap,
  LineChart as LineChartIcon,
  Calendar,
  LayoutDashboard,
  Bell,
  Settings,
  Radio,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CommandBar } from "../../components/command/CommandBar";
import type { ApiAlertRow, ApiHomeTimeseries } from "../../api/types";
import {
  getAlerts,
  getExchangeSummary,
  getHomeTimeseries,
  getMeta,
  splitMappedExchanges,
} from "../../api/client";

const features = [
  {
    title: "Compare markets",
    description:
      "Cross-venue pricing for the same mapped events from your MySQL catalog.",
    icon: ArrowRightLeft,
  },
  {
    title: "Detect arbitrage",
    description:
      "Surface rows from ArbitrageAlert with profit margins computed by the scanner.",
    icon: Zap,
  },
  {
    title: "Analyze prices",
    description:
      "Inspect bids, asks, and snapshot history stored in PriceSnapshot.",
    icon: LineChartIcon,
  },
] as const;

const quickLinks = [
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/manage", label: "Data overview", icon: Settings },
] as const;

const chartTooltip = {
  contentStyle: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#e2e8f0",
  },
  labelStyle: { color: "#94a3b8" },
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildLast14Days(ts: ApiHomeTimeseries) {
  const spreadMap = new Map(
    ts.snapshot_spread_by_day.map((r) => [r.day.slice(0, 10), r.avg_spread])
  );
  const alertMap = new Map(ts.alerts_by_day.map((r) => [r.day.slice(0, 10), r.count]));
  const rows: { label: string; spreadPct: number | null; alertCount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const raw = spreadMap.get(key);
    rows.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      spreadPct: raw != null ? raw * 100 : null,
      alertCount: alertMap.get(key) ?? 0,
    });
  }
  return rows;
}

export default function Home() {
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof getMeta>> | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ApiAlertRow[]>([]);
  const [exSummary, setExSummary] = useState<Awaited<ReturnType<typeof getExchangeSummary>>>([]);
  const [timeseries, setTimeseries] = useState<ApiHomeTimeseries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [m, a, ex, ts] = await Promise.all([
          getMeta(),
          getAlerts("Active"),
          getExchangeSummary(),
          getHomeTimeseries(),
        ]);
        if (!cancelled) {
          setMeta(m);
          setActiveAlerts(a);
          setExSummary(ex);
          setTimeseries(ts);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chart14 = useMemo(
    () => (timeseries ? buildLast14Days(timeseries) : []),
    [timeseries]
  );

  const activeCount = activeAlerts.length;
  const bestArb =
    activeCount > 0 ? Math.max(...activeAlerts.map((o) => o.profit_percent)) : 0;
  const avgMargin =
    activeCount > 0
      ? activeAlerts.reduce((a, o) => a + o.profit_percent, 0) / activeCount
      : 0;

  const feedRows = useMemo(
    () =>
      [...activeAlerts]
        .sort((a, b) => b.profit_percent - a.profit_percent)
        .slice(0, 8),
    [activeAlerts]
  );

  const pageGrid = "mx-auto w-full max-w-[1600px] px-4 sm:px-5 lg:px-6";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative overflow-hidden border-b border-slate-800/90">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-25%,rgba(16,185,129,0.1),transparent)]"
          aria-hidden
        />
        <div className={`relative ${pageGrid} py-7 sm:py-8`}>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-px w-6 bg-emerald-500/45" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/95">
              Prediction market intelligence
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="min-w-0">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white sm:text-[2.125rem]">
                ArbScanner
              </h1>
              <p className="max-w-xl text-pretty text-sm leading-snug text-slate-400 sm:text-[0.95rem]">
                Live counts and alerts from the local MySQL database via the ArbScanner API.
              </p>
              <CommandBar className="mt-4 max-w-xl" />
            </div>

            <div className="flex shrink-0 gap-6 border-t border-slate-800/80 pt-3 sm:gap-8 lg:border-t-0 lg:pt-0">
              <div>
                <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  Active alerts
                </p>
                <p className="text-lg font-semibold tabular-nums leading-none text-emerald-400">
                  {loading ? "—" : activeCount}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  Exchanges
                </p>
                <p className="text-lg font-semibold tabular-nums leading-none text-white">
                  {loading ? "—" : (meta?.exchange_count ?? "—")}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="mb-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              className="h-8 bg-emerald-600 px-3.5 font-medium text-white shadow-md shadow-emerald-950/35 hover:bg-emerald-500"
            >
              <Link to="/events">Explore events</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 border-slate-600 bg-slate-950/50 px-3.5 text-white hover:bg-slate-900 hover:text-white"
            >
              <Link to="/alerts">View alerts</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className={`${pageGrid} space-y-6 py-5`}>
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Database overview
          </h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              {
                label: "Events",
                value: loading ? "—" : String(meta?.event_count ?? 0),
                sub: "rows in Event",
                tone: "text-white",
              },
              {
                label: "Markets",
                value: loading ? "—" : String(meta?.market_count ?? 0),
                sub: "rows in Market",
                tone: "text-white",
              },
              {
                label: "Avg active margin",
                value: loading ? "—" : activeCount ? `${avgMargin.toFixed(2)}%` : "—",
                sub: "from Active alerts",
                tone: "text-slate-200",
              },
              {
                label: "Best active margin",
                value: loading ? "—" : activeCount ? `+${bestArb.toFixed(2)}%` : "—",
                sub: "max profit_percent",
                tone: "text-emerald-400",
              },
            ].map((m) => (
              <Card key={m.label} className="border-slate-800 bg-slate-900/90">
                <CardContent className="px-3 py-2.5">
                  <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-500">
                    {m.label}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-semibold tabular-nums leading-none ${m.tone}`}
                  >
                    {m.value}
                  </p>
                  <p className="mt-1 text-[9px] text-slate-600">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="capabilities-heading">
          <h2
            id="capabilities-heading"
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Core capabilities
          </h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border-slate-800 bg-slate-900/80 transition-colors hover:border-slate-700/85"
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 rounded border border-slate-700/60 bg-slate-800/90 p-1.5">
                      <f.icon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1 text-xs font-semibold leading-tight text-white">
                        {f.title}
                      </h3>
                      <p className="text-[11px] leading-snug text-pretty text-slate-500">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="analytics-heading" className="space-y-2">
          <h2
            id="analytics-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Stored activity (last 14 calendar days)
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-3 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-300">
                    Avg snapshot spread
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-slate-600">
                    % of contract
                  </span>
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart14} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(v: number | undefined) =>
                          v != null ? [`${v.toFixed(3)}%`, "Avg spread"] : ["—", "Avg spread"]
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="spreadPct"
                        stroke="#34d399"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-3 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-300">Alerts logged</span>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-slate-600">
                    count / day
                  </span>
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart14} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                        allowDecimals={false}
                      />
                      <Tooltip {...chartTooltip} formatter={(v: number) => [v, "Alerts"]} />
                      <Line
                        type="monotone"
                        dataKey="alertCount"
                        stroke="#22d3ee"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="live-feed-heading" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <h2
                  id="live-feed-heading"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300"
                >
                  Active alerts
                </h2>
              </div>
              <span className="hidden h-3 w-px bg-slate-700 sm:block" aria-hidden />
              <span className="font-mono text-[9px] text-slate-600">ArbitrageAlert · Active</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-800/90 bg-[#0a0f14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.035)] ring-1 ring-white/[0.03]">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[minmax(8rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_52px_72px] border-b border-slate-800 bg-slate-900/95">
                {["Event", "BuyΔ", "SellΔ", "Margin%", "Detected"].map((h, i) => (
                  <span
                    key={h}
                    className={`border-r border-slate-800/80 px-1 py-0.5 text-[7px] font-mono font-medium uppercase tracking-[0.1em] text-slate-500 last:border-r-0 ${
                      i >= 3 ? "text-right" : i === 0 ? "text-left" : "text-center"
                    } ${i === 3 ? "text-emerald-500/90" : ""}`}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {feedRows.length === 0 && !loading ? (
                <div className="px-3 py-6 text-center text-[10px] text-slate-600">
                  No active alerts in the database.
                </div>
              ) : (
                feedRows.map((row) => {
                  const [buy, sell] = splitMappedExchanges(row.mapped_exchanges);
                  return (
                    <div
                      key={row.alert_id}
                      className="grid grid-cols-[minmax(8rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_52px_72px] border-b border-slate-800/40 last:border-b-0 hover:bg-emerald-950/[0.08]"
                    >
                      <p className="min-w-0 truncate border-r border-slate-800/40 px-1.5 py-px text-[8px] font-medium leading-tight text-slate-300">
                        {row.event_title}
                      </p>
                      <span
                        className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-px text-center text-[7px] font-mono leading-tight text-slate-400"
                        title={buy}
                      >
                        {buy}
                      </span>
                      <span
                        className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-px text-center text-[7px] font-mono leading-tight text-slate-400"
                        title={sell}
                      >
                        {sell}
                      </span>
                      <span className="border-r border-slate-800/40 bg-emerald-950/25 px-0.5 py-px text-right">
                        <span className="font-mono text-[8px] font-bold tabular-nums text-emerald-300">
                          +{row.profit_percent.toFixed(1)}%
                        </span>
                      </span>
                      <span className="px-0.5 py-px text-right font-mono text-[7px] tabular-nums text-slate-500">
                        {row.detected_at ? formatTimestamp(row.detected_at) : "—"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="activity-heading"
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                <h2
                  id="activity-heading"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  Markets per exchange
                </h2>
              </div>
              <p className="mb-2 text-[10px] text-slate-600">From Market joined to Exchange</p>
              <div className="space-y-1.5">
                {exSummary.length === 0 && !loading ? (
                  <p className="text-[10px] text-slate-600">No exchanges configured.</p>
                ) : (
                  exSummary.slice(0, 8).map((ex, i) => (
                    <div
                      key={ex.exchange_id}
                      className="flex items-center gap-2 rounded border border-slate-800/80 bg-slate-950/40 px-2 py-1"
                    >
                      <span className="w-4 font-mono text-[9px] text-slate-600">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-300">
                        {ex.name}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-slate-500">
                        {ex.market_count} mkts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-slate-500" />
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Snapshot volume
                </h2>
              </div>
              <p className="mb-2 text-[10px] text-slate-600">
                Total rows in <code className="text-slate-500">PriceSnapshot</code>
              </p>
              <div className="space-y-2 rounded border border-slate-800/80 bg-[#0a0f14] p-2.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Snapshots stored</span>
                  <span className="font-mono font-medium tabular-nums text-slate-300">
                    {loading ? "—" : meta?.snapshot_count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Contracts</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {loading ? "—" : meta?.contract_count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Active alerts</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {loading ? "—" : meta?.active_alert_count ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="quick-access-heading">
          <h2
            id="quick-access-heading"
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            Quick access
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="group block">
                <Card className="h-full border-slate-800 bg-slate-900/80 transition-all hover:border-emerald-700/35 hover:bg-slate-900">
                  <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                    <item.icon className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-emerald-400" />
                    <span className="text-[11px] font-medium leading-tight text-slate-300 group-hover:text-white">
                      {item.label}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
