import { Router } from "express";
import { getEvent, getEvents, postEvent } from "../controllers/eventController.js";
import { validateCreateEventBody } from "../middleware/validateCreateEventBody.js";
import { validateEventListQuery } from "../middleware/validateEventQuery.js";
import { validateIntegerParam } from "../middleware/validateIntegerParam.js";

const router = Router();

router.get("/", validateEventListQuery, getEvents);
router.get("/:id", validateIntegerParam("id"), getEvent);
router.post("/", validateCreateEventBody, postEvent);

export default router;
