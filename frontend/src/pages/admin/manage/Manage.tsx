import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import type { ApiExchange, ApiMeta } from "../../../api/types";
import { getExchanges, getMeta } from "../../../api/client";

export default function Manage() {
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [exchanges, setExchanges] = useState<ApiExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [m, ex] = await Promise.all([getMeta(), getExchanges()]);
        if (!cancelled) {
          setMeta(m);
          setExchanges(ex);
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

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <h1 className="mb-1 text-2xl font-semibold text-white">Data overview</h1>
          <p className="text-sm text-slate-400">
            Read-only view of catalog tables. Ingestion and edits run through the Python
            sync jobs and scanner, not this UI.
          </p>
        </div>
      </div>

      <div className="space-y-6 px-8 py-8">
        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Events", meta?.event_count],
            ["Markets", meta?.market_count],
            ["Contracts", meta?.contract_count],
            ["Snapshots", meta?.snapshot_count],
            ["Exchanges", meta?.exchange_count],
            ["Active alerts", meta?.active_alert_count],
          ].map(([label, val]) => (
            <Card key={String(label)} className="border-slate-800 bg-slate-900">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
                <p className="text-xl font-semibold text-white">
                  {loading ? "—" : String(val ?? "—")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Configured exchanges</CardTitle>
            <p className="text-xs font-normal text-slate-500">
              Rows from the <code className="text-slate-400">Exchange</code> table
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {exchanges.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No exchanges found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">API base URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchanges.map((x) => (
                    <TableRow key={x.exchange_id} className="border-slate-800">
                      <TableCell className="font-mono text-slate-300">{x.exchange_id}</TableCell>
                      <TableCell className="font-medium text-white">{x.name}</TableCell>
                      <TableCell className="max-w-md truncate font-mono text-xs text-slate-500">
                        {x.api_base_url}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
