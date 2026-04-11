import { apiFetch } from "../services/api";
import type {
  ApiActivityItem,
  ApiAlertRow,
  ApiDashboardStats,
  ApiEventDetail,
  ApiEventListItem,
  ApiExchange,
  ApiExchangeSummary,
  ApiHomeTimeseries,
  ApiMeta,
  ApiPricePoint,
} from "./types";

function httpErrorMessage(res: Response, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return `${res.status} ${res.statusText}`;
  try {
    const j = JSON.parse(trimmed) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) {
      const parts = j.detail.map((item) =>
        typeof item === "object" && item !== null && "msg" in item
          ? String((item as { msg: string }).msg)
          : JSON.stringify(item)
      );
      return parts.join("; ") || trimmed;
    }
    if (j.detail != null) return String(j.detail);
  } catch {
    /* not JSON */
  }
  return trimmed.length < 800 ? trimmed : `${res.status} ${res.statusText}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(httpErrorMessage(res, text));
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export function splitMappedExchanges(mapped: string): [string, string] {
  const parts = mapped
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return ["—", "—"];
  if (parts.length === 1) return [parts[0], parts[0]];
  return [parts[0], parts[1]];
}

export async function getMeta(): Promise<ApiMeta> {
  return parseJson<ApiMeta>(await apiFetch("/api/meta"));
}

export async function getExchanges(): Promise<ApiExchange[]> {
  return parseJson<ApiExchange[]>(await apiFetch("/api/exchanges"));
}

export async function getExchangeSummary(): Promise<ApiExchangeSummary[]> {
  return parseJson<ApiExchangeSummary[]>(await apiFetch("/api/exchanges/summary"));
}

export async function getDashboardStats(): Promise<ApiDashboardStats> {
  return parseJson<ApiDashboardStats>(await apiFetch("/api/dashboard/stats"));
}

export async function getDashboardActivity(limit = 16): Promise<ApiActivityItem[]> {
  return parseJson<ApiActivityItem[]>(
    await apiFetch(`/api/dashboard/activity?limit=${limit}`)
  );
}

export async function getAlerts(status?: string | null): Promise<ApiAlertRow[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return parseJson<ApiAlertRow[]>(await apiFetch(`/api/alerts${q}`));
}

export async function expireAlert(alertId: number): Promise<void> {
  const res = await apiFetch(`/api/alerts/${alertId}/expire`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
}

export async function getEvents(): Promise<ApiEventListItem[]> {
  return parseJson<ApiEventListItem[]>(await apiFetch("/api/events"));
}

export async function getEventDetail(eventId: number): Promise<ApiEventDetail> {
  return parseJson<ApiEventDetail>(await apiFetch(`/api/events/${eventId}`));
}

export async function getEventYesHistory(
  eventId: number,
  limit = 2000
): Promise<ApiPricePoint[]> {
  return parseJson<ApiPricePoint[]>(
    await apiFetch(`/api/events/${eventId}/yes-price-history?limit=${limit}`)
  );
}

export async function getHomeTimeseries(): Promise<ApiHomeTimeseries> {
  return parseJson<ApiHomeTimeseries>(await apiFetch("/api/home/timeseries"));
}
