import { Link } from "react-router";
import { TrendingUp, Clock, Zap, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import ArbitrageFlow from "../components/ArbitrageFlow";
import { arbitrageOpportunities } from "../data/mockData";

export default function Dashboard() {
  const activeOpportunities = arbitrageOpportunities
    .filter(o => o.status === 'active')
    .sort((a, b) => b.profitPercent - a.profitPercent);

  const topOpportunity = activeOpportunities[0];

  const formatTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Arbitrage Scanner</h1>
              <p className="text-sm text-slate-400">Real-time prediction market opportunities</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Active Opportunities</div>
                <div className="text-2xl font-semibold text-emerald-400">{activeOpportunities.length}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Total Events</div>
                <div className="text-2xl font-semibold text-white">248</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Best Opportunity Highlight */}
        {topOpportunity && (
          <Card className="mb-8 bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400 uppercase tracking-wide">Best Opportunity</span>
                </div>
                <Badge className="bg-emerald-500 text-white">
                  New
                </Badge>
              </div>
              
              <Link 
                to={`/events/${topOpportunity.eventId}`}
                className="text-xl font-semibold text-white hover:text-emerald-400 transition-colors mb-4 block"
              >
                {topOpportunity.eventTitle}
              </Link>

              <div className="flex items-center justify-between">
                <ArbitrageFlow
                  buyExchange={topOpportunity.buyExchange}
                  sellExchange={topOpportunity.sellExchange}
                  profitPercent={topOpportunity.profitPercent}
                  estimatedProfit={topOpportunity.estimatedProfit}
                  size="lg"
                />
                <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
                  <Link to={`/events/${topOpportunity.eventId}`}>
                    View Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opportunities List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Live Opportunities</h2>
            <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
              <Link to="/alerts">
                View All Alerts
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {activeOpportunities.map((opp, index) => (
              <Card 
                key={opp.id} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-emerald-900/20"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        {index === 0 && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            #1
                          </Badge>
                        )}
                        <Link 
                          to={`/events/${opp.eventId}`}
                          className="text-white hover:text-emerald-400 transition-colors font-medium truncate"
                        >
                          {opp.eventTitle}
                        </Link>
                      </div>
                      
                      <ArbitrageFlow
                        buyExchange={opp.buyExchange}
                        sellExchange={opp.sellExchange}
                        profitPercent={opp.profitPercent}
                        estimatedProfit={opp.estimatedProfit}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(opp.detectedTime)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Link to={`/events/${opp.eventId}`}>
                          Analyze
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Avg Profit</div>
                  <div className="text-xl font-semibold text-white">
                    {(activeOpportunities.reduce((acc, o) => acc + o.profitPercent, 0) / activeOpportunities.length).toFixed(2)}%
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Exchanges</div>
                  <div className="text-xl font-semibold text-white">8</div>
                </div>
                <div className="text-2xl text-slate-700">⚡</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">24h Volume</div>
                  <div className="text-xl font-semibold text-white">$2.4M</div>
                </div>
                <div className="text-2xl text-slate-700">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
