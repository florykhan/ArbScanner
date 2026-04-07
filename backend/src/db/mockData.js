// TODO (Phase 4): Replace this module with MySQL repositories and adapters.
// TODO (Phase 5): Join in external exchange feeds (e.g., Manifold) via ingestion jobs.

const exchanges = [
  {
    id: "ex_manifold",
    name: "Manifold",
    type: "prediction-market",
    baseUrl: "https://manifold.markets",
    isMocked: true
  },
  {
    id: "ex_mockexchange",
    name: "MockExchange",
    type: "prediction-market",
    baseUrl: "https://mockexchange.local",
    isMocked: true
  }
];

const events = [
  {
    id: "evt_us_election_2028",
    title: "US Presidential Election 2028 Winner",
    category: "Politics",
    status: "open",
    description: "Tracks leading candidate outcomes across supported exchanges.",
    closeTime: "2028-11-08T05:00:00.000Z",
    createdAt: "2026-03-10T12:00:00.000Z"
  },
  {
    id: "evt_btc_120k_2026",
    title: "Bitcoin hits $120k before 2027",
    category: "Crypto",
    status: "open",
    description: "Binary event comparing BTC threshold pricing across exchanges.",
    closeTime: "2026-12-31T23:59:59.000Z",
    createdAt: "2026-03-18T08:30:00.000Z"
  },
  {
    id: "evt_champions_league_2026",
    title: "UEFA Champions League 2026 Winner",
    category: "Sports",
    status: "open",
    description: "Compares implied probabilities for major contenders.",
    closeTime: "2026-05-30T21:00:00.000Z",
    createdAt: "2026-03-20T16:45:00.000Z"
  }
];

const markets = [
  {
    id: "mkt_manifold_election_1",
    eventId: "evt_us_election_2028",
    exchangeId: "ex_manifold",
    question: "Will Candidate A win the 2028 US presidential election?",
    status: "open",
    liquidityScore: 0.82
  },
  {
    id: "mkt_mock_election_1",
    eventId: "evt_us_election_2028",
    exchangeId: "ex_mockexchange",
    question: "Candidate A to win 2028 US election?",
    status: "open",
    liquidityScore: 0.71
  },
  {
    id: "mkt_manifold_btc_1",
    eventId: "evt_btc_120k_2026",
    exchangeId: "ex_manifold",
    question: "Will Bitcoin reach $120,000 before Jan 1, 2027?",
    status: "open",
    liquidityScore: 0.88
  },
  {
    id: "mkt_mock_btc_1",
    eventId: "evt_btc_120k_2026",
    exchangeId: "ex_mockexchange",
    question: "BTC >= $120k before 2027?",
    status: "open",
    liquidityScore: 0.74
  }
];

const contracts = [
  {
    id: "ctr_manifold_election_yes",
    marketId: "mkt_manifold_election_1",
    outcome: "YES"
  },
  {
    id: "ctr_mock_election_yes",
    marketId: "mkt_mock_election_1",
    outcome: "YES"
  },
  {
    id: "ctr_manifold_btc_yes",
    marketId: "mkt_manifold_btc_1",
    outcome: "YES"
  },
  {
    id: "ctr_mock_btc_yes",
    marketId: "mkt_mock_btc_1",
    outcome: "YES"
  }
];

const priceSnapshots = [
  {
    id: "snap_001",
    contractId: "ctr_manifold_election_yes",
    yesPrice: 0.57,
    noPrice: 0.43,
    timestamp: "2026-04-06T18:10:00.000Z"
  },
  {
    id: "snap_002",
    contractId: "ctr_mock_election_yes",
    yesPrice: 0.52,
    noPrice: 0.48,
    timestamp: "2026-04-06T18:10:05.000Z"
  },
  {
    id: "snap_003",
    contractId: "ctr_manifold_btc_yes",
    yesPrice: 0.44,
    noPrice: 0.56,
    timestamp: "2026-04-06T18:15:00.000Z"
  },
  {
    id: "snap_004",
    contractId: "ctr_mock_btc_yes",
    yesPrice: 0.49,
    noPrice: 0.51,
    timestamp: "2026-04-06T18:15:03.000Z"
  }
];

const arbitrageAlerts = [
  {
    id: "alt_001",
    eventId: "evt_us_election_2028",
    marketId: "mkt_mock_election_1",
    contractId: "ctr_mock_election_yes",
    buyExchange: "MockExchange",
    sellExchange: "Manifold",
    spreadPercent: 5.0,
    severity: "high",
    status: "active",
    detectedAt: "2026-04-06T18:10:08.000Z",
    updatedAt: "2026-04-06T18:12:00.000Z"
  },
  {
    id: "alt_002",
    eventId: "evt_btc_120k_2026",
    marketId: "mkt_manifold_btc_1",
    contractId: "ctr_manifold_btc_yes",
    buyExchange: "Manifold",
    sellExchange: "MockExchange",
    spreadPercent: 3.2,
    severity: "medium",
    status: "active",
    detectedAt: "2026-04-06T18:15:05.000Z",
    updatedAt: "2026-04-06T18:16:10.000Z"
  },
  {
    id: "alt_003",
    eventId: "evt_champions_league_2026",
    marketId: "mkt_manifold_election_1",
    contractId: "ctr_manifold_election_yes",
    buyExchange: "Manifold",
    sellExchange: "MockExchange",
    spreadPercent: 1.4,
    severity: "low",
    status: "resolved",
    detectedAt: "2026-04-05T13:20:00.000Z",
    updatedAt: "2026-04-05T14:45:00.000Z"
  }
];

export {
  arbitrageAlerts,
  contracts,
  events,
  exchanges,
  markets,
  priceSnapshots
};
