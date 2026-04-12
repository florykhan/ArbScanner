/**
 * API client for the ArbScanner backend.
 * - Local dev: leave both unset so requests use same-origin `/api` (Vite proxy → FastAPI).
 * - Production (e.g. Vercel): set `VITE_API_BASE_URL` to your Render API origin (no trailing slash).
 * `VITE_API_URL` is still supported for older `.env` files.
 */
const raw =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "";

export const apiBaseUrl = raw.replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!apiBaseUrl) return p;
  return `${apiBaseUrl}${p}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  // Avoid forcing `Content-Type: application/json` on simple GETs so the browser
  // skips a CORS preflight (OPTIONS) for read-only calls to a separate API origin.
  const needsJsonContentType =
    init?.body != null || (method !== "GET" && method !== "HEAD");
  if (needsJsonContentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}
