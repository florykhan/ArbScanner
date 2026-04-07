import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { ErrorAlert, Loading } from "../components/Status.jsx";

function buildQuery(params) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  if (params.status) q.set("status", params.status);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState({ search: "", category: "", status: "" });

  const queryString = useMemo(() => buildQuery(applied), [applied]);

  const { data, loading, error, reload } = useAsyncResource(
    () => apiGet(`/api/events${queryString}`),
    [queryString]
  );

  const applyFilters = () => {
    setApplied({ search, category, status });
  };

  const rows = data?.data ?? [];

  return (
    <div>
      <h1>Events</h1>
      <p className="muted">
        <code>GET /api/events</code> with optional <code>search</code>, <code>category</code>,{" "}
        <code>status</code> (validated by backend).
      </p>

      <div
        className="card"
        style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}
      >
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Search
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title / description"
          />
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Category
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any</option>
            <option value="Politics">Politics</option>
            <option value="Crypto">Crypto</option>
            <option value="Sports">Sports</option>
            <option value="General">General</option>
          </select>
        </label>
        <label>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Status
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
            <option value="draft">draft</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            applyFilters();
          }}
        >
          Apply
        </button>
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrorAlert error={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        rows.length === 0 ? (
          <p className="muted" style={{ marginTop: "1rem" }}>
            No events match.
          </p>
        ) : (
          <table style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>
                    <Link to={`/events/${e.id}`}>{e.title}</Link>
                  </td>
                  <td>{e.category}</td>
                  <td>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
    </div>
  );
}
