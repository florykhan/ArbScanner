import { listAlerts } from "../services/alertService.js";

const getAlerts = (req, res, next) => {
  try {
    const alerts = listAlerts({
      severity: req.query.severity
    });
    return res.status(200).json({ data: alerts });
  } catch (error) {
    return next(error);
  }
};

export { getAlerts };
