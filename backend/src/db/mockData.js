// TODO (Phase 5): Replace this module with MySQL repositories and adapters.
// TODO (Phase 6): Join in external exchange feeds (e.g., Manifold) via ingestion jobs.

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

/** Integer IDs align with route param validation (GET /api/events/:id, /api/contracts/:id/...). */
const events = [
  {
    id: 1,
    title: "US Presidential Election 2028 Winner",
    category: "Politics",
    status: "open",
    description: "Tracks leading candidate outcomes across supported exchanges.",
    closeTime: "2028-11-08T05:00:00.000Z",
    createdAt: "2026-03-10T12:00:00.000Z"
  },
  {
    id: 2,
    title: "Bitcoin hits $120k before 2027",
    category: "Crypto",
    status: "open",
    description: "Binary event comparing BTC threshold pricing across exchanges.",
    closeTime: "2026-12-31T23:59:59.000Z",
    createdAt: "2026-03-18T08:30:00.000Z"
  },
  {
    id: 3,
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
    id: 11,
    eventId: 1,
    exchangeId: "ex_manifold",
    question: "Will Candidate A win the 2028 US presidential election?",
    status: "open",
    liquidityScore: 0.82
  },
  {
    id: 12,
    eventId: 1,
    exchangeId: "ex_mockexchange",
    question: "Candidate A to win 2028 US election?",
    status: "open",
    liquidityScore: 0.71
  },
  {
    id: 13,
    eventId: 2,
    exchangeId: "ex_manifold",
    question: "Will Bitcoin reach $120,000 before Jan 1, 2027?",
    status: "open",
    liquidityScore: 0.88
  },
  {
    id: 14,
    eventId: 2,
    exchangeId: "ex_mockexchange",
    question: "BTC >= $120k before 2027?",
    status: "open",
    liquidityScore: 0.74
  }
];

const contracts = [
  {
    id: 1,
    marketId: 11,
    outcome: "YES"
  },
  {
    id: 2,
    marketId: 12,
    outcome: "YES"
  },
  {
    id: 3,
    marketId: 13,
    outcome: "YES"
  },
  {
    id: 4,
    marketId: 14,
    outcome: "YES"
  }
];

const priceSnapshots = [
  {
    id: "snap_001",
    contractId: 1,
    yesPrice: 0.57,
    noPrice: 0.43,
    timestamp: "2026-04-06T18:10:00.000Z"
  },
  {
    id: "snap_002",
    contractId: 2,
    yesPrice: 0.52,
    noPrice: 0.48,
    timestamp: "2026-04-06T18:10:05.000Z"
  },
  {
    id: "snap_003",
    contractId: 3,
    yesPrice: 0.44,
    noPrice: 0.56,
    timestamp: "2026-04-06T18:15:00.000Z"
  },
  {
    id: "snap_004",
    contractId: 4,
    yesPrice: 0.49,
    noPrice: 0.51,
    timestamp: "2026-04-06T18:15:03.000Z"
  }
];

const arbitrageAlerts = [
  {
    id: "alt_001",
    eventId: 1,
    marketId: 12,
    contractId: 2,
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
    eventId: 2,
    marketId: 13,
    contractId: 3,
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
    eventId: 3,
    marketId: 11,
    contractId: 1,
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
