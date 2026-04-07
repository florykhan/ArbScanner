import { events, markets } from "../db/mockData.js";

const createNotFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  error.name = "NotFoundError";
  return error;
};

const listEvents = (filters = {}) => {
  // TODO (Phase 4): Replace in-memory filter logic with MySQL query predicates.
  const { search, category } = filters;

  return events.filter((event) => {
    const matchesSearch =
      !search ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !category || event.category.toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });
};

const getEventById = (eventId) => {
  // TODO (Phase 4): Fetch single event with joins from MySQL.
  const event = events.find((item) => item.id === eventId);
  if (!event) {
    throw createNotFoundError(`Event ${eventId} was not found`);
  }

  const relatedMarkets = markets.filter((market) => market.eventId === event.id);

  return {
    ...event,
    relatedMarketCount: relatedMarkets.length
  };
};

const createEvent = (payload = {}) => {
  // TODO (Phase 4): Validate request and insert row in MySQL.
  return {
    id: `evt_${Date.now()}`,
    title: payload.title || "Untitled event",
    category: payload.category || "General",
    status: payload.status || "draft",
    description: payload.description || "",
    closeTime: payload.closeTime || null,
    createdAt: new Date().toISOString(),
    source: "mock-layer",
    message: "Event accepted in mock mode. No persistent write has occurred."
  };
};

export { createEvent, getEventById, listEvents };
