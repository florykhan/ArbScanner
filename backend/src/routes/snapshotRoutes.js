import { Router } from "express";
import {
  getContractSnapshots,
  postPriceSnapshot
} from "../controllers/snapshotController.js";
import { validateIntegerParam } from "../middleware/validateIntegerParam.js";
import { validatePriceSnapshotBody } from "../middleware/validatePriceSnapshotBody.js";

const router = Router();

router.get("/contracts/:id/snapshots", validateIntegerParam("id"), getContractSnapshots);
router.post("/price-snapshots", validatePriceSnapshotBody, postPriceSnapshot);

export default router;
