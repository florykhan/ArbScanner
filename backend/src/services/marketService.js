import env from "../config/env.js";
import * as mock from "./implementations/marketService.mock.js";
import * as mysql from "./implementations/marketService.mysql.js";

const listMarkets = async () => {
  if (env.useMockData) {
    return mock.listMarkets();
  }
  return mysql.listMarkets();
};

export { listMarkets };
