import { Link } from "react-router";
import {
  ArrowRightLeft,
  Zap,
  LineChart,
  Calendar,
  LayoutDashboard,
  Bell,
  Settings,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { arbitrageOpportunities } from "../../data/mockData";

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
    icon: LineChart,
  },
] as const;

const quickLinks = [
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/manage", label: "Manage Data", icon: Settings },
] as const;

function formatTimeShort(dateString: string) {
  const minutes = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 60000
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Home() {
  const active = arbitrageOpportunities.filter((o) => o.status === "active");
  const activeCount = active.length;

  const feedRows = [...active]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 5);

  const pageGrid = "mx-auto w-full max-w-5xl px-6 sm:px-8";

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

      {/* Main column — aligned with hero */}
      <div className={`${pageGrid} py-6 space-y-7`}>
        {/* Capabilities */}
        <section aria-labelledby="capabilities-heading">
          <h2
            id="capabilities-heading"
            className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Core capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {features.map((f) => (
              <Card
                key={f.title}
                className="bg-slate-900/80 border-slate-800 hover:border-slate-700/85 transition-colors"
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="rounded border border-slate-700/60 bg-slate-800/90 p-1.5 shrink-0">
                      <f.icon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white mb-1 leading-tight">
                        {f.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-snug text-pretty">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Live feed */}
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
            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
              <span className="uppercase tracking-wide text-slate-500">
                Updated recently
              </span>
              <span className="text-slate-600">·</span>
              <span>ARB.FEED</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-slate-800/90 bg-[#0a0f14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.035)] ring-1 ring-white/[0.03]">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[minmax(7rem,1fr)_64px_64px_38px_58px_34px] border-b border-slate-800 bg-slate-900/95 sm:grid-cols-[minmax(9rem,1fr)_72px_72px_42px_62px_38px]">
                <span className="border-r border-slate-800/80 px-1.5 py-0.5 text-[7px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
                  Event
                </span>
                <span className="border-r border-slate-800/80 px-0.5 py-0.5 text-center text-[7px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
                  Buy
                </span>
                <span className="border-r border-slate-800/80 px-0.5 py-0.5 text-center text-[7px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
                  Sell
                </span>
                <span className="border-r border-slate-800/80 px-0.5 py-0.5 text-right text-[7px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
                  Est
                </span>
                <span className="border-r border-slate-800/80 px-0.5 py-0.5 text-right text-[7px] font-mono font-medium uppercase tracking-[0.14em] text-emerald-500/95">
                  P&amp;L
                </span>
                <span className="px-0.5 py-0.5 text-right text-[7px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
                  Age
                </span>
              </div>

              {feedRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(7rem,1fr)_64px_64px_38px_58px_34px] border-b border-slate-800/45 last:border-b-0 sm:grid-cols-[minmax(9rem,1fr)_72px_72px_42px_62px_38px] hover:bg-emerald-950/[0.1]"
                >
                  <p className="min-w-0 truncate border-r border-slate-800/40 px-1.5 py-0.5 text-[9px] font-medium leading-tight text-slate-300">
                    {row.eventTitle}
                  </p>
                  <span
                    className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-0.5 text-center text-[8px] font-mono leading-tight text-slate-400"
                    title={row.buyExchange}
                  >
                    {row.buyExchange}
                  </span>
                  <span
                    className="min-w-0 truncate border-r border-slate-800/40 px-0.5 py-0.5 text-center text-[8px] font-mono leading-tight text-slate-400"
                    title={row.sellExchange}
                  >
                    {row.sellExchange}
                  </span>
                  <span className="border-r border-slate-800/40 px-0.5 py-0.5 text-right text-[8px] font-mono tabular-nums leading-none text-slate-500">
                    {row.estimatedProfit}
                  </span>
                  <span className="border-r border-slate-800/40 bg-emerald-950/30 px-0.5 py-0.5 text-right">
                    <span className="text-[10px] font-mono font-bold tabular-nums leading-none text-emerald-300">
                      +{row.profitPercent.toFixed(1)}
                      <span className="text-[8px] font-semibold opacity-90">%</span>
                    </span>
                  </span>
                  <span className="px-0.5 py-0.5 text-right text-[8px] font-mono tabular-nums leading-none text-slate-500">
                    {formatTimeShort(row.detectedTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
