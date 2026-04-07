const listEvents = () => {
  // TODO (Phase 3): Fetch from MySQL events table with pagination and filtering.
  return [
    {
      id: "evt_us_election_2028",
      title: "US Presidential Election 2028",
      category: "Politics",
      status: "open",
      startDate: "2028-01-01T00:00:00.000Z",
      endDate: "2028-11-08T00:00:00.000Z"
    },
    {
      id: "evt_btc_100k_2026",
      title: "Bitcoin reaches $100k by end of 2026",
      category: "Crypto",
      status: "open",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.000Z"
    }
  ];
};

const getEventById = (eventId) => {
  // TODO (Phase 3): Load event + linked markets/contracts from MySQL.
  return {
    id: eventId,
    title: "Placeholder event",
    category: "General",
    status: "open",
    description: "Detailed event payload will be populated from MySQL in a later phase.",
    relatedMarketCount: 2
  };
};

const createEvent = (payload) => {
  // TODO (Phase 3): Validate payload and persist event in MySQL.
  return {
    id: "evt_placeholder_new",
    ...payload,
    status: payload?.status || "draft",
    createdAt: new Date().toISOString(),
    message: "Event accepted (stub). No database write has occurred yet."
  };
};

export { createEvent, getEventById, listEvents };
