// Mock data for ArbScanner application

export interface Event {
  id: string;
  title: string;
  category: string;
  closeTime: string;
  status: 'active' | 'closed';
  description?: string;
}

export interface MarketData {
  exchange: string;
  market: string;
  contract: string;
  bid: number;
  ask: number;
  spread: number;
  volume?: number;
}

export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  eventTitle: string;
  profitPercent: number;
  /** Cross-venue quoted spread (%) — analytical mock */
  spreadPercent: number;
  /** Notional volume (USD) — analytical mock */
  volume: number;
  buyExchange: string;
  sellExchange: string;
  detectedTime: string;
  status: 'active' | 'expired' | 'executed';
  estimatedProfit: string;
}

export interface Alert {
  id: string;
  eventId: string;
  eventTitle: string;
  profitPercent: number;
  detectedTime: string;
  status: 'new' | 'viewed' | 'archived';
}

export const events: Event[] = [
  {
    id: '1',
    title: 'Will Bitcoin reach $100,000 by end of 2026?',
    category: 'Crypto',
    closeTime: '2026-12-31T23:59:59Z',
    status: 'active',
    description: 'Market predicting whether Bitcoin will reach or exceed $100,000 USD by December 31, 2026'
  },
  {
    id: '2',
    title: 'US Federal Reserve Rate Decision - May 2026',
    category: 'Finance',
    closeTime: '2026-05-15T18:00:00Z',
    status: 'active',
    description: 'Prediction on the Federal Reserve interest rate decision'
  },
  {
    id: '3',
    title: 'Tesla Stock above $300 by Q3 2026?',
    category: 'Stocks',
    closeTime: '2026-09-30T20:00:00Z',
    status: 'active',
    description: 'Will Tesla stock price be above $300 per share by end of Q3 2026?'
  },
  {
    id: '4',
    title: 'Ethereum 3.0 Launch Date',
    category: 'Crypto',
    closeTime: '2026-12-31T23:59:59Z',
    status: 'active',
    description: 'When will Ethereum 3.0 be officially launched?'
  },
  {
    id: '5',
    title: 'S&P 500 to reach 6000 by end of 2026?',
    category: 'Finance',
    closeTime: '2026-12-31T23:59:59Z',
    status: 'active',
    description: 'Will the S&P 500 index reach 6000 points by year end?'
  },
  {
    id: '6',
    title: 'Apple to announce AR glasses in 2026?',
    category: 'Technology',
    closeTime: '2026-12-31T23:59:59Z',
    status: 'active',
    description: 'Will Apple officially announce consumer AR glasses product in 2026?'
  },
  {
    id: '7',
    title: 'Gold price above $2500/oz by June 2026',
    category: 'Commodities',
    closeTime: '2026-06-30T23:59:59Z',
    status: 'active',
    description: 'Prediction on gold reaching $2500 per ounce'
  },
  {
    id: '8',
    title: 'Next OpenAI Model Release',
    category: 'Technology',
    closeTime: '2026-06-30T23:59:59Z',
    status: 'active',
    description: 'When will OpenAI release their next major model?'
  },
];

export const marketData: Record<string, MarketData[]> = {
  '1': [
    {
      exchange: 'Polymarket',
      market: 'BTC $100K EOY',
      contract: 'YES',
      bid: 0.62,
      ask: 0.65,
      spread: 0.03,
      volume: 125000
    },
    {
      exchange: 'Kalshi',
      market: 'BTC $100K EOY',
      contract: 'YES',
      bid: 0.58,
      ask: 0.61,
      spread: 0.03,
      volume: 89000
    },
    {
      exchange: 'Augur',
      market: 'BTC $100K EOY',
      contract: 'YES',
      bid: 0.64,
      ask: 0.67,
      spread: 0.03,
      volume: 45000
    },
    {
      exchange: 'Manifold',
      market: 'BTC $100K EOY',
      contract: 'YES',
      bid: 0.59,
      ask: 0.63,
      spread: 0.04,
      volume: 32000
    },
  ],
  '2': [
    {
      exchange: 'Kalshi',
      market: 'Fed Rate May',
      contract: 'RAISE',
      bid: 0.45,
      ask: 0.48,
      spread: 0.03,
      volume: 210000
    },
    {
      exchange: 'Polymarket',
      market: 'Fed Rate May',
      contract: 'RAISE',
      bid: 0.42,
      ask: 0.46,
      spread: 0.04,
      volume: 156000
    },
    {
      exchange: 'PredictIt',
      market: 'Fed Rate May',
      contract: 'RAISE',
      bid: 0.47,
      ask: 0.50,
      spread: 0.03,
      volume: 98000
    },
  ],
  '3': [
    {
      exchange: 'Polymarket',
      market: 'TSLA $300 Q3',
      contract: 'YES',
      bid: 0.38,
      ask: 0.42,
      spread: 0.04,
      volume: 78000
    },
    {
      exchange: 'Kalshi',
      market: 'TSLA $300 Q3',
      contract: 'YES',
      bid: 0.35,
      ask: 0.39,
      spread: 0.04,
      volume: 62000
    },
    {
      exchange: 'Manifold',
      market: 'TSLA $300 Q3',
      contract: 'YES',
      bid: 0.40,
      ask: 0.44,
      spread: 0.04,
      volume: 28000
    },
  ],
};

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  {
    id: '1',
    eventId: '1',
    eventTitle: 'Will Bitcoin reach $100,000 by end of 2026?',
    profitPercent: 6.9,
    spreadPercent: 5.4,
    volume: 428_000,
    buyExchange: 'Kalshi',
    sellExchange: 'Augur',
    detectedTime: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'active',
    estimatedProfit: '$420'
  },
  {
    id: '2',
    eventId: '2',
    eventTitle: 'US Federal Reserve Rate Decision - May 2026',
    profitPercent: 5.3,
    spreadPercent: 4.1,
    volume: 312_000,
    buyExchange: 'Polymarket',
    sellExchange: 'PredictIt',
    detectedTime: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'active',
    estimatedProfit: '$310'
  },
  {
    id: '3',
    eventId: '3',
    eventTitle: 'Tesla Stock above $300 by Q3 2026?',
    profitPercent: 7.7,
    spreadPercent: 6.2,
    volume: 891_000,
    buyExchange: 'Kalshi',
    sellExchange: 'Manifold',
    detectedTime: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'active',
    estimatedProfit: '$285'
  },
  {
    id: '4',
    eventId: '1',
    eventTitle: 'Will Bitcoin reach $100,000 by end of 2026?',
    profitPercent: 3.4,
    spreadPercent: 2.8,
    volume: 156_000,
    buyExchange: 'Manifold',
    sellExchange: 'Polymarket',
    detectedTime: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    status: 'expired',
    estimatedProfit: '$180'
  },
  {
    id: '5',
    eventId: '5',
    eventTitle: 'S&P 500 to reach 6000 by end of 2026?',
    profitPercent: 4.2,
    spreadPercent: 3.3,
    volume: 267_000,
    buyExchange: 'Kalshi',
    sellExchange: 'Augur',
    detectedTime: new Date(Date.now() - 90 * 60000).toISOString(),
    status: 'active',
    estimatedProfit: '$225'
  },
];

/** Rolling daily mock series for homepage analytics (14 periods) */
export const homeSpreadTrend = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1}d`,
  bps: Math.round(32 + Math.sin(i * 0.45) * 10 + i * 0.35),
}));

export const homeOpportunityTrend = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1}d`,
  count: Math.max(1, Math.round(3 + Math.sin(i * 0.55) * 2.2 + i * 0.12)),
}));

export const alerts: Alert[] = [
  {
    id: '1',
    eventId: '1',
    eventTitle: 'Will Bitcoin reach $100,000 by end of 2026?',
    profitPercent: 6.9,
    detectedTime: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'new'
  },
  {
    id: '2',
    eventId: '2',
    eventTitle: 'US Federal Reserve Rate Decision - May 2026',
    profitPercent: 5.3,
    detectedTime: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'new'
  },
  {
    id: '3',
    eventId: '3',
    eventTitle: 'Tesla Stock above $300 by Q3 2026?',
    profitPercent: 7.7,
    detectedTime: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'viewed'
  },
  {
    id: '4',
    eventId: '4',
    eventTitle: 'Ethereum 3.0 Launch Date',
    profitPercent: 4.8,
    detectedTime: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    status: 'viewed'
  },
  {
    id: '5',
    eventId: '5',
    eventTitle: 'S&P 500 to reach 6000 by end of 2026?',
    profitPercent: 4.2,
    detectedTime: new Date(Date.now() - 90 * 60000).toISOString(),
    status: 'archived'
  },
  {
    id: '6',
    eventId: '6',
    eventTitle: 'Apple to announce AR glasses in 2026?',
    profitPercent: 3.1,
    detectedTime: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    status: 'archived'
  },
];

export const priceHistory = [
  { time: '00:00', polymarket: 0.62, kalshi: 0.58, augur: 0.64, manifold: 0.59 },
  { time: '04:00', polymarket: 0.63, kalshi: 0.59, augur: 0.65, manifold: 0.60 },
  { time: '08:00', polymarket: 0.64, kalshi: 0.60, augur: 0.66, manifold: 0.61 },
  { time: '12:00', polymarket: 0.63, kalshi: 0.59, augur: 0.65, manifold: 0.60 },
  { time: '16:00', polymarket: 0.65, kalshi: 0.61, augur: 0.67, manifold: 0.63 },
  { time: '20:00', polymarket: 0.64, kalshi: 0.60, augur: 0.66, manifold: 0.62 },
  { time: '24:00', polymarket: 0.65, kalshi: 0.61, augur: 0.67, manifold: 0.63 },
];
