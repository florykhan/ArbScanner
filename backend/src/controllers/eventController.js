import { createEvent, getEventById, listEvents } from "../services/eventService.js";

const getEvents = async (req, res, next) => {
  try {
    const rows = await listEvents(req.validatedEventQuery || {});
    return res.status(200).json({ data: rows });
  } catch (error) {
    return next(error);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const event = await getEventById(req.validatedParams.id);
    return res.status(200).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

const postEvent = async (req, res, next) => {
  try {
    const event = await createEvent(req.validatedCreateEvent);
    return res.status(201).json({ data: event });
  } catch (error) {
    return next(error);
  }
};

export { getEvent, getEvents, postEvent };
