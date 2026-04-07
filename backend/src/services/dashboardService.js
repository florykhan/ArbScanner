import env from "../config/env.js";
import * as mock from "./implementations/dashboardService.mock.js";
import * as mysql from "./implementations/dashboardService.mysql.js";

/**
 * Facade: switches between mock data and MySQL implementations via USE_MOCK_DATA.
 * To use MySQL later: set USE_MOCK_DATA=false and fill in services/implementations/*.mysql.js.
 */
const getDashboardSummary = async () => {
  if (env.useMockData) {
    return mock.getDashboardSummary();
  }
  return mysql.getDashboardSummary();
};

export { getDashboardSummary };
