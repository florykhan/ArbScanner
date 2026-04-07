import { getDashboardSummary } from "../services/dashboardService.js";

const getSummary = async (_req, res, next) => {
  try {
    const summary = await getDashboardSummary();
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};

export { getSummary };
