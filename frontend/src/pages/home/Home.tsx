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
    description: "Track the same event across multiple exchanges",
    icon: ArrowRightLeft,
  },
  {
    title: "Detect Arbitrage",
    description: "Identify profitable buy/sell mismatches",
    icon: Zap,
  },
  {
    title: "Analyze Prices",
    description: "Inspect bids, asks, spreads, and historical data",
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
      {/* Hero */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-10 max-w-5xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-500/90 mb-3">
            Prediction market intelligence
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            ArbScanner
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mb-8">
            Monitor prediction markets and detect arbitrage opportunities across exchanges.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              <Link to="/events">Explore Events</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 bg-slate-900/80 text-white hover:bg-slate-800 hover:text-white"
            >
              <Link to="/alerts">View Alerts</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-5xl space-y-10">
        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="bg-slate-900 border-slate-800 hover:border-slate-700/80 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-slate-800/80 p-2 border border-slate-700/50">
                    <f.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-white mb-1.5">
                      {f.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-snug">
                      {f.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Terminal-style market preview */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Live opportunities
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 tabular-nums">
              ARB.FEED
            </span>
          </div>

          <div className="rounded-md border border-slate-800 bg-[#0a0f14] overflow-hidden shadow-inner shadow-black/50 ring-1 ring-white/[0.03]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,80px)_56px] sm:grid-cols-[minmax(0,1fr)_92px_92px_68px] border-b border-slate-800 bg-slate-900/90">
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 px-2 py-1 border-r border-slate-800/80">
                Event
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 px-1.5 py-1 text-right border-r border-slate-800/80">
                Buy
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 px-1.5 py-1 text-right border-r border-slate-800/80">
                Sell
              </span>
              <span className="text-[8px] font-mono font-medium uppercase tracking-[0.12em] text-emerald-500/90 px-1.5 py-1 text-right">
                P&amp;L%
              </span>
            </div>

            <div>
              {feedRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,80px)_56px] sm:grid-cols-[minmax(0,1fr)_92px_92px_68px] border-b border-slate-800/60 last:border-b-0 items-stretch hover:bg-emerald-950/[0.12] transition-colors"
                >
                  <p className="text-[10px] text-slate-300 leading-[1.35] truncate pl-2 pr-1 py-1 border-r border-slate-800/50 font-medium min-w-0">
                    {row.eventTitle}
                  </p>
                  <span className="text-[9px] font-mono text-slate-400 text-right tabular-nums truncate px-1.5 py-1 border-r border-slate-800/50 self-center">
                    {row.buyExchange}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 text-right tabular-nums truncate px-1.5 py-1 border-r border-slate-800/50 self-center">
                    {row.sellExchange}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 text-right tabular-nums tracking-tight px-1.5 py-1 self-center">
                    +{row.profitPercent.toFixed(2)}
                    <span className="text-[9px] font-semibold opacity-90">%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick navigation */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
            Workspaces
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="group block">
                <Card className="h-full bg-slate-900 border-slate-800 hover:border-emerald-700/40 hover:bg-slate-900/90 transition-all">
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
        </div>
      </div>
    </div>
  );
}
