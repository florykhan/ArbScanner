/**
 * API client for the ArbScanner backend.
 * With the default empty base URL, requests go to the same origin (Vite dev server
 * proxies `/api` to the FastAPI process — see `vite.config.ts`).
 * Set `VITE_API_URL` (e.g. `http://localhost:3001`) when the API is on another origin.
 */
const raw = import.meta.env.VITE_API_URL ?? "";

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
