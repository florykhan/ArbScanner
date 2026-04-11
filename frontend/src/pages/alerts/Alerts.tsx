import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Filter, Eye, Archive } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import type { ApiAlertRow } from "../../api/types";
import { expireAlert, getAlerts } from "../../api/client";

type StatusFilter = "all" | "Active" | "Expired";

export default function Alerts() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [sortBy, setSortBy] = useState<"profit" | "time">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<ApiAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q = statusFilter === "all" ? null : statusFilter;
      const data = await getAlerts(q);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedAlerts = [...rows].sort((a, b) => {
    if (sortBy === "profit") {
      return sortOrder === "desc"
        ? b.profit_percent - a.profit_percent
        : a.profit_percent - b.profit_percent;
    }
    const timeA = new Date(a.detected_at ?? 0).getTime();
    const timeB = new Date(b.detected_at ?? 0).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const handleSort = (field: "profit" | "time") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const archive = async (alertId: number) => {
    try {
      await expireAlert(alertId);
      toast.success("Alert marked Expired");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  };

  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return "—";
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active")
      return "border-emerald-500/30 bg-emerald-500/20 text-emerald-400";
    if (s === "expired")
      return "border-slate-500/30 bg-slate-500/20 text-slate-400";
    return "border-slate-600 bg-slate-800 text-slate-300";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-white">Arbitrage alerts</h1>
              <p className="text-sm text-slate-400">
                Rows from <code className="text-slate-500">ArbitrageAlert</code> (backend truth)
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-slate-500">Shown</div>
              <div className="text-2xl font-semibold text-white">
                {loading ? "—" : sortedAlerts.length}
              </div>
            </div>
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <div className="mb-6 flex flex-wrap items-center gap-3">
            {(["all", "Active", "Expired"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  statusFilter === s
                    ? s === "Active"
                      ? "bg-emerald-600 text-white"
                      : s === "Expired"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {s === "all" ? "All statuses" : s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select
              value={sortBy}
              onValueChange={(value: "profit" | "time") => setSortBy(value)}
            >
              <SelectTrigger className="w-48 border-slate-700 bg-slate-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="profit" className="text-white">
                  Sort by profit
                </SelectItem>
                <SelectItem value="time" className="text-white">
                  Sort by time
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="text-slate-400 hover:text-white"
            >
              {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="space-y-3">
          {loading ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-12 text-center text-slate-400">Loading…</CardContent>
            </Card>
          ) : sortedAlerts.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">No alerts for this filter</p>
              </CardContent>
            </Card>
          ) : (
            sortedAlerts.map((alert) => (
              <Card
                key={alert.alert_id}
                className="border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className={statusBadge(alert.status)}>
                          {alert.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(alert.detected_at)}
                        </span>
                      </div>

                      {alert.event_id != null ? (
                        <Link
                          to={`/events/${alert.event_id}`}
                          className="mb-3 block font-medium text-white transition-colors hover:text-emerald-400"
                        >
                          {alert.event_title}
                        </Link>
                      ) : (
                        <span className="mb-3 block font-medium text-white">{alert.event_title}</span>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-3xl font-semibold text-emerald-400">
                          {alert.profit_percent.toFixed(2)}%
                        </div>
                        <span className="text-sm text-slate-500">model profit margin</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Venues: {alert.mapped_exchanges || "—"}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                      {alert.event_id != null && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          <Link to={`/events/${alert.event_id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            Event
                          </Link>
                        </Button>
                      )}
                      {alert.status === "Active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => archive(alert.alert_id)}
                          className="text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          <Archive className="mr-1 h-4 w-4" />
                          Expire
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
