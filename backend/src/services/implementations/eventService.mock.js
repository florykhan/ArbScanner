import { events, markets } from "../../db/mockData.js";
import { ApiError } from "../../utils/apiError.js";

const listEvents = async (filters = {}) => {
  const { search, category, status } = filters;

  return events.filter((event) => {
    const matchesSearch =
      !search ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !category || event.category.toLowerCase() === category.toLowerCase();

    const matchesStatus = !status || event.status === status;

    return matchesSearch && matchesCategory && matchesStatus;
  });
};

const getEventById = async (eventId) => {
  const event = events.find((item) => item.id === eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const relatedMarkets = markets.filter((market) => market.eventId === event.id);

  return {
    ...event,
    relatedMarketCount: relatedMarkets.length
  };
};

const createEvent = async (payload) => {
  const nextId = events.reduce((max, e) => Math.max(max, e.id), 0) + 1;

  return {
    id: nextId,
    title: payload.title,
    category: payload.category,
    status: payload.status,
    description: payload.description,
    closeTime: payload.closeTime,
    createdAt: new Date().toISOString(),
    source: "mock-layer",
    message: "Event accepted in mock mode. No persistent write has occurred."
  };
};

export { createEvent, getEventById, listEvents };
