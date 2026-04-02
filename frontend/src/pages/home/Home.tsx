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
import {
  arbitrageOpportunities,
  events,
  homeSpreadTrend,
  homeOpportunityTrend,
} from "../../data/mockData";

const EXCHANGE_COUNT = 8;

const features = [
  {
    title: "Compare Markets",
    description:
      "Cross-venue pricing for the same events—see where consensus diverges.",
    icon: ArrowRightLeft,
  },
  {
    title: "Detect Arbitrage",
    description:
      "Flag buy-low / sell-high gaps across exchanges while they’re still actionable.",
    icon: Zap,
  },
  {
    title: "Analyze Prices",
    description:
      "Inspect bids, asks, spreads, and history to validate an edge before you act.",
    icon: LineChartIcon,
  },
] as const;

const quickLinks = [
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/manage", label: "Manage Data", icon: Settings },
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

function formatVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function buildExchangeActivity() {
  const map = new Map<
    string,
    { touches: number; spreadSum: number; spreadN: number }
  >();
  for (const o of arbitrageOpportunities) {
    for (const ex of [o.buyExchange, o.sellExchange]) {
      const cur = map.get(ex) ?? { touches: 0, spreadSum: 0, spreadN: 0 };
      cur.touches += 1;
      cur.spreadSum += o.spreadPercent;
      cur.spreadN += 1;
      map.set(ex, cur);
    }
  }
  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      touches: v.touches,
      avgSpread: v.spreadSum / v.spreadN,
    }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 6);
}

export default function Home() {
  const active = arbitrageOpportunities.filter((o) => o.status === "active");
  const activeCount = active.length;
  const totalMarkets = events.length;
  const avgSpread =
    active.length > 0
      ? active.reduce((a, o) => a + o.spreadPercent, 0) / active.length
      : 0;
  const bestArb = active.length > 0 ? Math.max(...active.map((o) => o.profitPercent)) : 0;

  const feedRows = [...active]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 6);

  const exchangeActivity = buildExchangeActivity();

  const pageGrid = "mx-auto w-full max-w-[1600px] px-4 sm:px-5 lg:px-6";

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
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
              <h1 className="text-3xl sm:text-[2.125rem] font-semibold tracking-tight text-white mb-2 leading-tight">
                ArbScanner
              </h1>
              <p className="text-sm sm:text-[0.95rem] text-slate-400 max-w-xl leading-snug text-pretty">
                Monitor prediction markets and detect arbitrage opportunities
                across exchanges.
              </p>
            </div>

            <div className="flex shrink-0 gap-6 sm:gap-8 border-t border-slate-800/80 pt-3 lg:border-t-0 lg:pt-0">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500 mb-0.5">
                  Active opportunities
                </p>
                <p className="text-lg font-semibold tabular-nums text-emerald-400 leading-none">
                  {activeCount}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500 mb-0.5">
                  Exchanges
                </p>
                <p className="text-lg font-semibold tabular-nums text-white leading-none">
                  {EXCHANGE_COUNT}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950/35"
            >
              <Link to="/events">Explore Events</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 px-3.5 border-slate-600 bg-slate-950/50 text-white hover:bg-slate-900 hover:text-white"
            >
              <Link to="/alerts">View Alerts</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className={`${pageGrid} py-5 space-y-6`}>
        {/* Market overview */}
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Market overview
          </h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              {
                label: "Markets tracked",
                value: String(totalMarkets),
                sub: "contracts",
                tone: "text-white",
              },
              {
                label: "Active exchanges",
                value: String(EXCHANGE_COUNT),
                sub: "venues",
                tone: "text-white",
              },
              {
                label: "Avg spread",
                value: `${avgSpread.toFixed(2)}%`,
                sub: "quoted",
                tone: "text-slate-200",
              },
              {
                label: "Best arb",
                value: `+${bestArb.toFixed(1)}%`,
                sub: "edge",
                tone: "text-emerald-400",
              },
            ].map((m) => (
              <Card
                key={m.label}
                className="border-slate-800 bg-slate-900/90"
              >
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

        {/* Core capabilities */}
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

        {/* Analytics */}
        <section aria-labelledby="analytics-heading" className="space-y-2">
          <h2
            id="analytics-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Analytics
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-3 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-300">
                    Avg quoted spread
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-slate-600">
                    bps · 14d
                  </span>
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={homeSpreadTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip {...chartTooltip} formatter={(v: number) => [`${v} bps`, "Spread"]} />
                      <Line type="monotone" dataKey="bps" stroke="#34d399" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-3 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-300">
                    Arbitrage signals
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-slate-600">
                    count · 14d
                  </span>
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={homeOpportunityTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip {...chartTooltip} formatter={(v: number) => [v, "Signals"]} />
                      <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Live opportunities */}
        <section aria-labelledby="live-feed-heading" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <h2
                  id="live-feed-heading"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300"
                >
                  Live opportunities
                </h2>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-600/90">
                Live feed
              </span>
              <span className="hidden h-3 w-px bg-slate-700 sm:block" aria-hidden />
              <span className="text-[9px] font-mono text-slate-600">
                Cross-venue · sample
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] text-slate-600">
              <span className="uppercase tracking-wide text-slate-500">
                Updated recently
              </span>
              <span className="text-slate-600">·</span>
              <span>ARB.FEED</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-800/90 bg-[#0a0f14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.035)] ring-1 ring-white/[0.03]">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[minmax(6.5rem,1fr)_56px_56px_44px_44px_40px_52px_72px] border-b border-slate-800 bg-slate-900/95 sm:grid-cols-[minmax(8rem,1fr)_60px_60px_46px_46px_44px_56px_80px]">
                {[
                  "Event",
                  "Buy",
                  "Sell",
                  "Sprd%",
                  "Arb%",
                  "Est",
                  "Vol",
                  "Time",
                ].map((h, i) => (
                  <span
                    key={h}
                    className={`border-r border-slate-800/80 px-1 py-0.5 text-[7px] font-mono font-medium uppercase tracking-[0.1em] text-slate-500 last:border-r-0 ${
                      i >= 3 && i <= 4 ? "text-right" : i === 0 ? "text-left" : i <= 2 ? "text-center" : "text-right"
                    } ${i === 4 ? "text-emerald-500/90" : ""}`}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {feedRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(6.5rem,1fr)_56px_56px_44px_44px_40px_52px_72px] border-b border-slate-800/40 last:border-b-0 sm:grid-cols-[minmax(8rem,1fr)_60px_60px_46px_46px_44px_56px_80px] hover:bg-emerald-950/[0.08]"
                >
                  <p className="min-w-0 truncate border-r border-slate-800/40 px-1.5 py-px text-[8px] font-medium leading-tight text-slate-300">
                    {row.eventTitle}
                  </p>
                  <span
                    className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-px text-center text-[7px] font-mono leading-tight text-slate-400"
                    title={row.buyExchange}
                  >
                    {row.buyExchange}
                  </span>
                  <span
                    className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-px text-center text-[7px] font-mono leading-tight text-slate-400"
                    title={row.sellExchange}
                  >
                    {row.sellExchange}
                  </span>
                  <span className="border-r border-slate-800/40 px-0.5 py-px text-right text-[7px] font-mono tabular-nums text-slate-500">
                    {row.spreadPercent.toFixed(1)}%
                  </span>
                  <span className="border-r border-slate-800/40 bg-emerald-950/25 px-0.5 py-px text-right">
                    <span className="text-[8px] font-mono font-bold tabular-nums text-emerald-300">
                      +{row.profitPercent.toFixed(1)}%
                    </span>
                  </span>
                  <span className="border-r border-slate-800/40 px-0.5 py-px text-right text-[7px] font-mono text-slate-500">
                    {row.estimatedProfit}
                  </span>
                  <span className="border-r border-slate-800/40 px-0.5 py-px text-right text-[7px] font-mono tabular-nums text-slate-500">
                    {formatVol(row.volume)}
                  </span>
                  <span className="px-0.5 py-px text-right text-[7px] font-mono tabular-nums text-slate-500">
                    {formatTimestamp(row.detectedTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top exchanges + activity */}
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
                  Top exchanges
                </h2>
              </div>
              <p className="mb-2 text-[10px] text-slate-600">
                By routing volume in scanned opportunities
              </p>
              <div className="space-y-1.5">
                {exchangeActivity.map((ex, i) => (
                  <div
                    key={ex.name}
                    className="flex items-center gap-2 rounded border border-slate-800/80 bg-slate-950/40 px-2 py-1"
                  >
                    <span className="w-4 text-[9px] font-mono text-slate-600">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-300">
                      {ex.name}
                    </span>
                    <span className="text-[9px] font-mono tabular-nums text-slate-500">
                      {ex.touches} flow
                    </span>
                    <span className="text-[9px] font-mono tabular-nums text-emerald-500/90">
                      {ex.avgSpread.toFixed(1)}% avg sprd
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-slate-500" />
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Market activity
                </h2>
              </div>
              <p className="mb-2 text-[10px] text-slate-600">
                Aggregate liquidity on tracked contracts (mock)
              </p>
              <div className="space-y-2 rounded border border-slate-800/80 bg-[#0a0f14] p-2.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">24h scanned volume</span>
                  <span className="font-mono font-medium tabular-nums text-slate-300">
                    {formatVol(
                      active.reduce((a, o) => a + o.volume, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Median spread</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {active.length
                      ? `${(active.map((o) => o.spreadPercent).sort((a, b) => a - b)[Math.floor(active.length / 2)]).toFixed(2)}%`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{`Signals > 5% edge`}</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {active.filter((o) => o.profitPercent > 5).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick access */}
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
