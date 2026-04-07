import { createEvent, getEventById, listEvents } from "../services/eventService.js";

const getEvents = (req, res, next) => {
  try {
    const rows = listEvents(req.validatedEventQuery || {});
    return res.status(200).json({ data: rows });
  } catch (error) {
    return next(error);
  }
};

const getEvent = (req, res, next) => {
  try {
    const event = getEventById(req.validatedParams.id);
    return res.status(200).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

const postEvent = (req, res, next) => {
  try {
    const event = createEvent(req.validatedCreateEvent);
    return res.status(201).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

export { getEvent, getEvents, postEvent };
