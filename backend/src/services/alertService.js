import env from "../config/env.js";
import * as mock from "./implementations/alertService.mock.js";
import * as mysql from "./implementations/alertService.mysql.js";

const listAlerts = async (filters = {}) => {
  if (env.useMockData) {
    return mock.listAlerts(filters);
  }
  return mysql.listAlerts(filters);
};

export { listAlerts };
