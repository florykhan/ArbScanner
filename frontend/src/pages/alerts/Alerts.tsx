import { useState } from "react";
import { Link } from "react-router";
import { Filter, Eye, Archive, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import ArbitrageFlow from "../../components/ArbitrageFlow";
import { alerts } from "../../data/mockData";

export default function Alerts() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"profit" | "time">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [localAlerts, setLocalAlerts] = useState(alerts);

  const filteredAlerts = localAlerts.filter(alert => {
    return statusFilter === "all" || alert.status === statusFilter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === "profit") {
      return sortOrder === "desc" 
        ? b.profitPercent - a.profitPercent 
        : a.profitPercent - b.profitPercent;
    } else {
      const timeA = new Date(a.detectedTime).getTime();
      const timeB = new Date(b.detectedTime).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    }
  });

  const handleSort = (field: "profit" | "time") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const updateStatus = (alertId: string, newStatus: "new" | "viewed" | "archived") => {
    setLocalAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      )
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      viewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return styles[status] || styles.new;
  };

  const statusCounts = {
    all: localAlerts.length,
    new: localAlerts.filter(a => a.status === 'new').length,
    viewed: localAlerts.filter(a => a.status === 'viewed').length,
    archived: localAlerts.filter(a => a.status === 'archived').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Arbitrage Alerts</h1>
              <p className="text-sm text-slate-400">Monitor and manage opportunities</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Total Alerts</div>
              <div className="text-2xl font-semibold text-white">{statusCounts.all}</div>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter("new")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "new"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              New ({statusCounts.new})
            </button>
            <button
              onClick={() => setStatusFilter("viewed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "viewed"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Viewed ({statusCounts.viewed})
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "archived"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Archived ({statusCounts.archived})
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select value={sortBy} onValueChange={(value: "profit" | "time") => setSortBy(value)}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="profit" className="text-white">Sort by Profit</SelectItem>
                <SelectItem value="time" className="text-white">Sort by Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="text-slate-400 hover:text-white"
            >
              {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="px-8 py-8">
        <div className="space-y-3">
          {sortedAlerts.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">No alerts found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            sortedAlerts.map((alert) => (
              <Card 
                key={alert.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getStatusBadge(alert.status)}>
                          {alert.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(alert.detectedTime)}
                        </span>
                      </div>
                      
                      <Link 
                        to={`/events/${alert.eventId}`}
                        className="text-white hover:text-emerald-400 transition-colors font-medium block mb-3"
                        onClick={() => {
                          if (alert.status === 'new') {
                            updateStatus(alert.id, 'viewed');
                          }
                        }}
                      >
                        {alert.eventTitle}
                      </Link>

                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-semibold text-emerald-400 flex items-center gap-2">
                          {alert.profitPercent.toFixed(2)}%
                        </div>
                        <span className="text-sm text-slate-500">profit opportunity</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Link to={`/events/${alert.eventId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {alert.status !== 'archived' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateStatus(alert.id, 'archived')}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
