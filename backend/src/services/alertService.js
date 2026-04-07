import { arbitrageAlerts } from "../db/mockData.js";

const listAlerts = (filters = {}) => {
  // TODO (Phase 5): Replace with MySQL-backed alert queries and paging.
  const { severity } = filters;

  return arbitrageAlerts.filter((alert) => {
    if (!severity) {
      return true;
    }
    return alert.severity.toLowerCase() === severity.toLowerCase();
  });
};

export { listAlerts };
