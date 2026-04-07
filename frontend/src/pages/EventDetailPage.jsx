import { Link, useParams } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

export default function EventDetailPage() {
  const { id } = useParams();

  const { data, loading, error, reload } = useAsyncResource(
    () => apiGet(`/api/events/${encodeURIComponent(id)}`),
    [id]
  );

  if (loading) return <Loading />;
  if (error) {
    return (
      <div>
        <p>
          <Link to="/events">← Events</Link>
        </p>
        <ErrorAlert error={error} onRetry={reload} />
      </div>
    );
  }

  const e = data?.data;

  return (
    <div>
      <p>
        <Link to="/events">← Events</Link>
      </p>
      <h1>{e?.title || "Event"}</h1>
      <p className="muted">
        <code>GET /api/events/:id</code> — backend returns <code>{`{ data: { ... } }`}</code>
      </p>

      <div className="card">
        <div className="row">
          <span className="badge">id {e?.id}</span>
          <span className="badge">{e?.category}</span>
          <span className="badge">{e?.status}</span>
        </div>
        {e?.description ? <p style={{ marginTop: "0.75rem" }}>{e.description}</p> : null}
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Related markets (count): {e?.relatedMarketCount ?? "—"}
        </p>
        {e?.closeTime ? (
          <p className="muted">Closes: {new Date(e.closeTime).toLocaleString()}</p>
        ) : null}
      </div>
    </div>
  );
}
