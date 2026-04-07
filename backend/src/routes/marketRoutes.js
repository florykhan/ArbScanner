import { Router } from "express";
import { getMarkets } from "../controllers/marketController.js";

const router = Router();

router.get("/", getMarkets);

export default router;
