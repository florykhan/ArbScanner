import { Link } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

export default function MarketsPage() {
  const { data, loading, error, reload } = useAsyncResource(() => apiGet("/api/markets"), []);

  const rows = data?.data ?? [];

  return (
    <div>
      <h1>Markets</h1>
      <p className="muted">
        <code>GET /api/markets</code> — each row includes nested <code>exchange</code> and{" "}
        <code>contractCount</code>.
      </p>

      {loading ? <Loading /> : null}
      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Exchange</th>
              <th>Contracts</th>
              <th>Question</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.eventId}</td>
                <td>{m.exchange?.name ?? m.exchangeId}</td>
                <td>{m.contractCount}</td>
                <td style={{ maxWidth: 360 }}>{m.question}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="muted" style={{ marginTop: "1.25rem" }}>
        View price history:{" "}
        <Link to="/snapshots">Snapshots</Link> (contract IDs 1–4 in mock data).
      </p>
    </div>
  );
}
