/**
 * HTTP client for ArbScanner backend.
 * Dev: Vite proxies /api -> backend (see vite.config.js). Production: set VITE_API_BASE_URL.
 * TODO: When backend switches from mock to MySQL, response shapes should stay stable; adjust types here if needed.
 */

const baseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const buildUrl = (path) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl()}${p}`;
};

/**
 * Parses backend JSON. Success responses vary: some are `{ data: ... }`, dashboard is a raw object.
 * Errors: `{ error: { message, status } }` (Phase 4 format).
 */
export async function apiGet(path, options = {}) {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    ...options
  });

  const body = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      body?.error?.message ||
      body?.message ||
      `${res.status} ${res.statusText || "Request failed"}`;
    const err = new Error(msg);
    err.status = body?.error?.status ?? res.status;
    throw err;
  }

  return body;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}
