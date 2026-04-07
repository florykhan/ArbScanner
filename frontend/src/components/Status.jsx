export function Loading({ message = "Loading…" }) {
  return <p className="loading">{message}</p>;
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <div>{error.message || "Something went wrong"}</div>
      {onRetry ? (
        <div style={{ marginTop: "0.75rem" }}>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
