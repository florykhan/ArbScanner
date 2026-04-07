const listMarkets = () => {
  // TODO (Phase 3): Fetch normalized market records from MySQL.
  return [
    {
      id: "mkt_poly_001",
      eventId: "evt_us_election_2028",
      exchange: "Polymarket",
      contractCount: 2,
      liquidityScore: 0.78,
      status: "open"
    },
    {
      id: "mkt_manifold_001",
      eventId: "evt_us_election_2028",
      exchange: "Manifold",
      contractCount: 2,
      liquidityScore: 0.69,
      status: "open"
    }
  ];
};

export { listMarkets };
