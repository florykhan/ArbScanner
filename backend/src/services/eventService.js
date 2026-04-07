import env from "../config/env.js";
import * as mock from "./implementations/eventService.mock.js";
import * as mysql from "./implementations/eventService.mysql.js";

const listEvents = async (filters = {}) => {
  if (env.useMockData) {
    return mock.listEvents(filters);
  }
  return mysql.listEvents(filters);
};

const getEventById = async (eventId) => {
  if (env.useMockData) {
    return mock.getEventById(eventId);
  }
  return mysql.getEventById(eventId);
};

const createEvent = async (payload) => {
  if (env.useMockData) {
    return mock.createEvent(payload);
  }
  return mysql.createEvent(payload);
};

export { createEvent, getEventById, listEvents };
