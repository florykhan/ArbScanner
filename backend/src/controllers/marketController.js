import { listMarkets } from "../services/marketService.js";

const getMarkets = (_req, res, next) => {
  try {
    const markets = listMarkets();
    return res.status(200).json({ data: markets });
  } catch (error) {
    return next(error);
  }
};

export { getMarkets };
