import { listAlerts } from "../services/alertService.js";

const getAlerts = async (req, res, next) => {
  try {
    const alerts = await listAlerts(req.validatedAlertQuery || {});
    return res.status(200).json({ data: alerts });
  } catch (error) {
    return next(error);
  }
};

export { getAlerts };
