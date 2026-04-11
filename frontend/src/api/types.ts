/** JSON shapes returned by `backend.api.main` (camelCase / snake_case aligned with FastAPI defaults). */

export type ApiEventListItem = {
  event_id: number;
  title: string;
  category: string | null;
  close_time: string | null;
  status: "active" | "closed";
  market_count: number;
  mapping_count: number;
};

export type ApiMarketContractRow = {
  exchange_name: string;
  market_id: number;
  exchange_market_code: string;
  outcome_label: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  spread: number | null;
  snapshot_time: string | null;
};

export type ApiSyntheticEdge = {
  pair_cost: number;
  edge_percent: number;
  yes_exchange: string;
  no_exchange: string;
  yes_market_code: string;
  no_market_code: string;
};

export type ApiEventDetail = {
  event_id: number;
  title: string;
  category: string | null;
  close_time: string | null;
  status: "active" | "closed";
  markets: ApiMarketContractRow[];
  synthetic_edge: ApiSyntheticEdge | null;
};

export type ApiPricePoint = {
  snapshot_time: string | null;
  exchange_name: string;
  last: number | null;
  bid: number | null;
  ask: number | null;
};

export type ApiAlertRow = {
  alert_id: number;
  event_id: number | null;
  event_title: string;
  mapped_exchanges: string;
  profit_margin: number;
  profit_percent: number;
  status: string;
  detected_at: string | null;
};

export type ApiDashboardStats = {
  active_alert_count: number;
  top_profit_margin: number | null;
  top_profit_percent: number | null;
  latest_detected_at: string | null;
  total_snapshots: number;
  latest_snapshot_at: string | null;
  scanner_message: string;
};

export type ApiActivityItem = {
  occurred_at: string;
  message: string;
  source: string;
};

export type ApiMeta = {
  exchange_count: number;
  event_count: number;
  market_count: number;
  contract_count: number;
  snapshot_count: number;
  active_alert_count: number;
};

export type ApiExchange = {
  exchange_id: number;
  name: string;
  api_base_url: string;
};

export type ApiExchangeSummary = {
  exchange_id: number;
  name: string;
  market_count: number;
};

export type ApiHomeTimeseries = {
  snapshot_spread_by_day: { day: string; avg_spread: number | null }[];
  alerts_by_day: { day: string; count: number }[];
};
