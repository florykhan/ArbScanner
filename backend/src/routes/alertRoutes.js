import { Router } from "express";
import { getAlerts } from "../controllers/alertController.js";

const router = Router();

router.get("/", getAlerts);

export default router;
