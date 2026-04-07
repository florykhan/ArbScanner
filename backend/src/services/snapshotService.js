import env from "../config/env.js";
import * as mock from "./implementations/snapshotService.mock.js";
import * as mysql from "./implementations/snapshotService.mysql.js";

const listContractSnapshots = async (contractId) => {
  if (env.useMockData) {
    return mock.listContractSnapshots(contractId);
  }
  return mysql.listContractSnapshots(contractId);
};

const createPriceSnapshot = async (payload) => {
  if (env.useMockData) {
    return mock.createPriceSnapshot(payload);
  }
  return mysql.createPriceSnapshot(payload);
};

export { createPriceSnapshot, listContractSnapshots };
