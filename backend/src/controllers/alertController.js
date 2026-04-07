import { listAlerts } from "../services/alertService.js";

const getAlerts = (_req, res, next) => {
  try {
    const alerts = listAlerts();
    return res.status(200).json({ data: alerts });
  } catch (error) {
    return next(error);
  }
};

export { getAlerts };
