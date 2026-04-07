import { createEvent, getEventById, listEvents } from "../services/eventService.js";

const getEvents = (req, res, next) => {
  try {
    const events = listEvents({
      search: req.query.search,
      category: req.query.category
    });
    return res.status(200).json({ data: events });
  } catch (error) {
    return next(error);
  }
};

const getEvent = (req, res, next) => {
  try {
    const event = getEventById(req.params.id);
    return res.status(200).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

const postEvent = (req, res, next) => {
  try {
    const event = createEvent(req.body);
    return res.status(201).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

export { getEvent, getEvents, postEvent };
