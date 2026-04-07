import { Router } from "express";
import { getAlerts } from "../controllers/alertController.js";
import { validateAlertListQuery } from "../middleware/validateAlertQuery.js";

const router = Router();

router.get("/", validateAlertListQuery, getAlerts);

export default router;
