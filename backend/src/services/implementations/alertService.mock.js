import { arbitrageAlerts } from "../../db/mockData.js";

const listAlerts = async (filters = {}) => {
  const { severity } = filters;

  return arbitrageAlerts.filter((alert) => {
    if (!severity) {
      return true;
    }
    return alert.severity.toLowerCase() === severity.toLowerCase();
  });
};

export { listAlerts };
