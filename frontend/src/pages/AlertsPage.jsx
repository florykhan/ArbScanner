import { useMemo, useState } from "react";
import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

export default function AlertsPage() {
  const [severity, setSeverity] = useState("");

  const qs = useMemo(() => (severity ? `?severity=${encodeURIComponent(severity)}` : ""), [
    severity
  ]);

  const { data, loading, error, reload } = useAsyncResource(
    () => apiGet(`/api/alerts${qs}`),
    [qs]
  );

  const rows = data?.data ?? [];

  return (
    <div>
      <h1>Arbitrage alerts</h1>
      <p className="muted">
        <code>GET /api/alerts</code> optional <code>severity</code> (high | medium | low).
      </p>

      <div className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Severity
          </div>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </label>
        <button type="button" onClick={() => reload()}>
          Refresh
        </button>
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Spread %</th>
              <th>Severity</th>
              <th>Buy / Sell</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.eventId}</td>
                <td>{a.spreadPercent}</td>
                <td>{a.severity}</td>
                <td>
                  {a.buyExchange} → {a.sellExchange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
