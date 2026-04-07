import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsyncResource(
    () => apiGet("/api/dashboard/summary"),
    []
  );

  if (loading) return <Loading />;
  if (error) return <ErrorAlert error={error} onRetry={reload} />;

  const t = data?.totals || {};
  const top = data?.topArbitrageOpportunities || [];

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">
        Summary from <code>GET /api/dashboard/summary</code>. Mock-backed until MySQL is wired.
      </p>

      <div className="row" style={{ marginTop: "1rem", gap: "0.75rem" }}>
        {[
          ["Exchanges", t.exchanges],
          ["Events", t.events],
          ["Markets", t.markets],
          ["Active alerts", t.activeAlerts],
          ["Snapshots", t.snapshots]
        ].map(([label, val]) => (
          <div key={label} className="card" style={{ flex: "1 1 140px", minWidth: 120 }}>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{val ?? "—"}</div>
          </div>
        ))}
      </div>

      {data?.lastSnapshotAt ? (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Last snapshot: {new Date(data.lastSnapshotAt).toLocaleString()}
        </p>
      ) : null}

      <h2>Top arbitrage opportunities</h2>
      {top.length === 0 ? (
        <p className="muted">None</p>
      ) : (
        top.map((row) => (
          <div key={row.alertId} className="card">
            <div className="row">
              <span className="badge">event #{row.eventId}</span>
              <span className="badge">{row.severity}</span>
              <span>
                Buy <strong>{row.buyExchange}</strong> → Sell{" "}
                <strong>{row.sellExchange}</strong>
              </span>
            </div>
            <div className="muted" style={{ marginTop: "0.35rem" }}>
              Spread: {row.spreadPercent}%
            </div>
          </div>
        ))
      )}
    </div>
  );
}
