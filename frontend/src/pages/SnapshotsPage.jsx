import { useState } from "react";
import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

export default function SnapshotsPage() {
  const [inputId, setInputId] = useState("1");
  const [activeId, setActiveId] = useState("1");

  const { data, loading, error, reload } = useAsyncResource(
    () => apiGet(`/api/contracts/${encodeURIComponent(activeId)}/snapshots`),
    [activeId]
  );

  const snapshots = data?.snapshots ?? [];

  const load = () => {
    setActiveId(inputId.trim() || "1");
  };

  return (
    <div>
      <h1>Contract snapshots</h1>
      <p className="muted">
        <code>GET /api/contracts/:id/snapshots</code> — response is a single object (not wrapped in{" "}
        <code>data</code>): contract, market, event ids plus <code>snapshots[]</code>.
      </p>

      <div className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Contract ID (integer)
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            style={{ width: 120 }}
          />
        </label>
        <button type="button" onClick={load}>
          Load
        </button>
        <button type="button" onClick={() => reload()}>
          Refresh
        </button>
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {!loading && !error && data ? (
        <div style={{ marginTop: "1rem" }}>
          <div className="card">
            <div className="row">
              <span className="badge">contract {data.contractId}</span>
              <span className="badge">market {data.marketId}</span>
              <span className="badge">event {data.eventId}</span>
              <span className="badge">{data.outcome}</span>
            </div>
          </div>

          <h2>History</h2>
          {snapshots.length === 0 ? (
            <p className="muted">No snapshots for this contract.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Snapshot</th>
                  <th>Yes</th>
                  <th>No</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.snapshotId}>
                    <td>{s.snapshotId}</td>
                    <td>{s.yesPrice}</td>
                    <td>{s.noPrice}</td>
                    <td>{new Date(s.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
