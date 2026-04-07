import { listMarkets } from "../services/marketService.js";

const getMarkets = async (_req, res, next) => {
  try {
    const markets = await listMarkets();
    return res.status(200).json({ data: markets });
  } catch (error) {
    return next(error);
  }
};

export { getMarkets };
