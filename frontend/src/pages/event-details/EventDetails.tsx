import { useParams, Link } from "react-router";
import { ArrowLeft, Calendar, Tag, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { events, marketData, priceHistory } from "../../data/mockData";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const event = events.find(e => e.id === id);
  const markets = marketData[id || ''] || [];

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <Card className="max-w-md bg-slate-900 border-slate-800">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Event Not Found</h2>
            <p className="text-slate-400 mb-6">The event you're looking for doesn't exist.</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
              <Link to="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCloseTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Crypto': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Finance': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Stocks': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Technology': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Commodities': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Calculate arbitrage opportunity
  const bestBid = markets.length > 0 ? Math.max(...markets.map(m => m.bid)) : 0;
  const bestAsk = markets.length > 0 ? Math.min(...markets.map(m => m.ask)) : 0;
  const profitPercent = ((bestBid - bestAsk) / bestAsk * 100);
  const bestBidExchange = markets.find(m => m.bid === bestBid);
  const bestAskExchange = markets.find(m => m.ask === bestAsk);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 text-slate-400 hover:text-white" 
            asChild
          >
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white mb-3">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <Badge variant="outline" className={getCategoryColor(event.category)}>
                    {event.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>Closes: {formatCloseTime(event.closeTime)}</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Arbitrage Opportunity Card */}
        {markets.length >= 2 && profitPercent > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-800">
            <CardHeader className="border-b border-emerald-800/50">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Arbitrage Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {/* Buy Side */}
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Buy Low</div>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-2">
                      {bestAskExchange?.exchange}
                    </Badge>
                    <div className="text-3xl font-semibold text-white mb-1">
                      ${bestAsk.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">Ask Price</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center mx-8">
                  <ArrowRight className="h-8 w-8 text-emerald-400 mb-2" />
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Execute</div>
                </div>

                {/* Sell Side */}
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Sell High</div>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-2">
                      {bestBidExchange?.exchange}
                    </Badge>
                    <div className="text-3xl font-semibold text-white mb-1">
                      ${bestBid.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">Bid Price</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center mx-8">
                  <ArrowRight className="h-8 w-8 text-emerald-400 mb-2" />
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Profit</div>
                </div>

                {/* Profit */}
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Net Gain</div>
                  <div className="bg-emerald-950/50 rounded-lg p-4 border border-emerald-500/30">
                    <div className="text-3xl font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      {profitPercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-emerald-500">
                      ${((bestBid - bestAsk) * 1000).toFixed(2)} per $1k
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-950/30 border border-amber-800/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <strong>Note:</strong> Prices update in real-time. Consider transaction fees, slippage, and execution speed when executing arbitrage strategies.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Comparison - Side by Side */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Market Comparison</h2>
          
          {markets.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center text-slate-400">
                No market data available for this event
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {markets.map((market, index) => {
                const isBestBid = market.bid === bestBid;
                const isBestAsk = market.ask === bestAsk;
                const isOpportunity = isBestBid || isBestAsk;

                return (
                  <Card 
                    key={index}
                    className={`transition-all ${
                      isOpportunity
                        ? 'bg-slate-900 border-emerald-600 shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-slate-800 text-white border-slate-700">
                          {market.exchange}
                        </Badge>
                        {isBestBid && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs border-purple-500/30">
                            Best Bid
                          </Badge>
                        )}
                        {isBestAsk && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs border-blue-500/30">
                            Best Ask
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Market</div>
                          <div className="text-sm font-medium text-white">{market.market}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className={`p-3 rounded-lg ${isBestAsk ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800'}`}>
                            <div className="text-xs text-slate-400 mb-1">Bid</div>
                            <div className={`text-lg font-semibold ${isBestAsk ? 'text-blue-400' : 'text-white'}`}>
                              ${market.bid.toFixed(2)}
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${isBestBid ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800'}`}>
                            <div className="text-xs text-slate-400 mb-1">Ask</div>
                            <div className={`text-lg font-semibold ${isBestBid ? 'text-purple-400' : 'text-white'}`}>
                              ${market.ask.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                          <span className="text-slate-500">Spread</span>
                          <span className="text-slate-400 font-medium">${market.spread.toFixed(2)}</span>
                        </div>

                        {market.volume && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Volume</span>
                            <span className="text-slate-400 font-medium">${market.volume.toLocaleString()}</span>
                          </div>
                        )}

                        <div>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs w-full justify-center">
                            {market.contract}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Price History Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Price History (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={[0.5, 0.7]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line type="monotone" dataKey="polymarket" stroke="#3b82f6" strokeWidth={2} name="Polymarket" dot={false} />
                <Line type="monotone" dataKey="kalshi" stroke="#8b5cf6" strokeWidth={2} name="Kalshi" dot={false} />
                <Line type="monotone" dataKey="augur" stroke="#10b981" strokeWidth={2} name="Augur" dot={false} />
                <Line type="monotone" dataKey="manifold" stroke="#f59e0b" strokeWidth={2} name="Manifold" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
