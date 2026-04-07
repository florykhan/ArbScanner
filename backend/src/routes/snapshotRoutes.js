import { Router } from "express";
import {
  getContractSnapshots,
  postPriceSnapshot
} from "../controllers/snapshotController.js";

const router = Router();

router.get("/contracts/:id/snapshots", getContractSnapshots);
router.post("/price-snapshots", postPriceSnapshot);

export default router;
