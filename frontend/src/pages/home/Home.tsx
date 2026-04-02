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

export default function Home() {
  const feedRows = [...arbitrageOpportunities]
    .filter((o) => o.status === "active")
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero — landing emphasis, not a dashboard strip */}
      <div className="relative overflow-hidden border-b border-slate-800/90">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
          aria-hidden
        />
        <div className="relative px-8 py-12 sm:py-14 max-w-5xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-emerald-500/50" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/95">
              Prediction market intelligence
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4 leading-[1.08]">
            ArbScanner
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-9 text-pretty">
            Monitor prediction markets and detect arbitrage opportunities across
            exchanges.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950/40"
            >
              <Link to="/events">Explore Events</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 bg-slate-950/60 text-white hover:bg-slate-900 hover:text-white"
            >
              <Link to="/alerts">View Alerts</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-10 max-w-5xl space-y-12">
        {/* Core capabilities */}
        <section aria-labelledby="capabilities-heading">
          <h2 id="capabilities-heading" className="sr-only">
            Core capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="bg-slate-900/80 border-slate-800 hover:border-slate-700/90 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-slate-800/90 p-2 border border-slate-700/60 shrink-0">
                      <f.icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-snug text-pretty">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Signature: live feed preview */}
        <section aria-labelledby="live-feed-heading" className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-emerald-500 shrink-0" />
                <h2
                  id="live-feed-heading"
                  className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300"
                >
                  Live opportunities
                </h2>
              </div>
              <p className="text-[11px] text-slate-600 pl-6 sm:pl-0 sm:ml-6 font-mono">
                Cross-exchange snapshot · sample feed
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-600 tabular-nums tracking-wide shrink-0 pl-6 sm:pl-0 sm:text-right">
              ARB.FEED
            </span>
          </div>

          <div className="rounded-md border border-slate-800/90 bg-[#0a0f14] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ring-1 ring-white/[0.04]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,80px)_56px] sm:grid-cols-[minmax(0,1fr)_92px_92px_68px] border-b border-slate-800 bg-slate-900/95">
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.14em] text-slate-500 px-2 py-1.5 border-r border-slate-800/80">
                Event
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.14em] text-slate-500 px-1.5 py-1.5 text-right border-r border-slate-800/80">
                Buy
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.14em] text-slate-500 px-1.5 py-1.5 text-right border-r border-slate-800/80">
                Sell
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.14em] text-emerald-500/95 px-1.5 py-1.5 text-right">
                P&amp;L%
              </span>
            </div>

            <div>
              {feedRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,80px)_56px] sm:grid-cols-[minmax(0,1fr)_92px_92px_68px] border-b border-slate-800/50 last:border-b-0 items-stretch min-h-[2rem] hover:bg-emerald-950/[0.14] transition-colors"
                >
                  <p className="text-[10px] text-slate-300 leading-snug truncate pl-2 pr-1 py-1.5 border-r border-slate-800/50 font-medium min-w-0 self-center">
                    {row.eventTitle}
                  </p>
                  <span className="text-[9px] font-mono text-slate-400 text-right tabular-nums truncate px-1.5 py-1.5 border-r border-slate-800/50 self-center leading-none">
                    {row.buyExchange}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 text-right tabular-nums truncate px-1.5 py-1.5 border-r border-slate-800/50 self-center leading-none">
                    {row.sellExchange}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 text-right tabular-nums tracking-tight px-1.5 py-1.5 self-center leading-none">
                    +{row.profitPercent.toFixed(2)}
                    <span className="text-[9px] font-semibold opacity-95">%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Access */}
        <section aria-labelledby="quick-access-heading">
          <h2
            id="quick-access-heading"
            className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3"
          >
            Quick access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="group block">
                <Card className="h-full bg-slate-900/80 border-slate-800 hover:border-emerald-700/35 hover:bg-slate-900 transition-all">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <item.icon className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">
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
