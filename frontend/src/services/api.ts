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
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
