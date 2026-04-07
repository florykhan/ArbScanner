import {
  arbitrageAlerts,
  events,
  exchanges,
  markets,
  priceSnapshots
} from "../db/mockData.js";

const getDashboardSummary = () => {
  // TODO (Phase 4): Replace with aggregate SQL queries and cached read models.
  // TODO (Phase 5): Blend external Manifold feed health and freshness metrics.
  const activeAlerts = arbitrageAlerts.filter((alert) => alert.status === "active");
  const topArbitrageOpportunities = [...activeAlerts]
    .sort((a, b) => b.spreadPercent - a.spreadPercent)
    .slice(0, 3)
    .map((alert) => ({
      alertId: alert.id,
      eventId: alert.eventId,
      buyExchange: alert.buyExchange,
      sellExchange: alert.sellExchange,
      spreadPercent: alert.spreadPercent,
      severity: alert.severity
    }));

  return {
    totals: {
      exchanges: exchanges.length,
      events: events.length,
      markets: markets.length,
      activeAlerts: activeAlerts.length,
      snapshots: priceSnapshots.length
    },
    topArbitrageOpportunities,
    lastSnapshotAt: priceSnapshots[priceSnapshots.length - 1]?.timestamp || null,
    generatedAt: new Date().toISOString()
  };
};

export { getDashboardSummary };
