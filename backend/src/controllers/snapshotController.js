import {
  createPriceSnapshot,
  listContractSnapshots
} from "../services/snapshotService.js";

const getContractSnapshots = async (req, res, next) => {
  try {
    const data = await listContractSnapshots(req.validatedParams.id);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

const postPriceSnapshot = async (req, res, next) => {
  try {
    const snapshot = await createPriceSnapshot(req.validatedPriceSnapshot);
    return res.status(201).json({ data: snapshot });
  } catch (error) {
    return next(error);
  }
};

export { getContractSnapshots, postPriceSnapshot };
