const listAlerts = () => {
  // TODO (Phase 3): Read alert rules/history from MySQL.
  // TODO (Phase 4): Feed real-time triggers from Manifold + other exchanges.
  return [
    {
      id: "alt_001",
      eventId: "evt_us_election_2028",
      type: "spread_threshold",
      status: "active",
      thresholdPercent: 2.0,
      lastTriggeredAt: "2026-04-01T13:12:00.000Z"
    },
    {
      id: "alt_002",
      eventId: "evt_btc_100k_2026",
      type: "price_divergence",
      status: "active",
      thresholdPercent: 1.5,
      lastTriggeredAt: null
    }
  ];
};

export { listAlerts };
