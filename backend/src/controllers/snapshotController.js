import {
  createPriceSnapshot,
  listContractSnapshots
} from "../services/snapshotService.js";

const getContractSnapshots = (req, res, next) => {
  try {
    const data = listContractSnapshots(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

const postPriceSnapshot = (req, res, next) => {
  try {
    const snapshot = createPriceSnapshot(req.body);
    return res.status(201).json({ data: snapshot });
  } catch (error) {
    return next(error);
  }
};

export { getContractSnapshots, postPriceSnapshot };
