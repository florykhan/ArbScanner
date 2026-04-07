import { getDashboardSummary } from "../services/dashboardService.js";

const getSummary = (_req, res, next) => {
  try {
    const summary = getDashboardSummary();
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};

export { getSummary };
