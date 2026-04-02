/**
 * API client for the ArbScanner backend. Set `VITE_API_URL` in `.env` for local dev.
 */
const raw = import.meta.env.VITE_API_URL ?? "";

export const apiBaseUrl = raw.replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
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
