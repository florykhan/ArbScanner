import { contracts, markets, priceSnapshots } from "../db/mockData.js";

const createNotFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  error.name = "NotFoundError";
  return error;
};

const listContractSnapshots = (contractId) => {
  // TODO (Phase 4): Replace with MySQL query on snapshots table.
  const contract = contracts.find((item) => item.id === contractId);
  if (!contract) {
    throw createNotFoundError(`Contract ${contractId} was not found`);
  }

  const market = markets.find((item) => item.id === contract.marketId);
  const snapshots = priceSnapshots
    .filter((snapshot) => snapshot.contractId === contractId)
    .map((snapshot) => ({
      snapshotId: snapshot.id,
      contractId: snapshot.contractId,
      yesPrice: snapshot.yesPrice,
      noPrice: snapshot.noPrice,
      timestamp: snapshot.timestamp
    }));

  return {
    contractId,
    marketId: contract.marketId,
    eventId: market?.eventId || null,
    outcome: contract.outcome,
    snapshots
  };
};

const createPriceSnapshot = (payload = {}) => {
  // TODO (Phase 4): Validate and insert in MySQL; stream from Manifold adapter.
  const contract = contracts.find((item) => item.id === payload.contractId);
  if (!contract) {
    throw createNotFoundError(`Contract ${payload.contractId} was not found`);
  }

  return {
    snapshotId: `snap_${Date.now()}`,
    contractId: payload.contractId,
    yesPrice: typeof payload.yesPrice === "number" ? payload.yesPrice : 0.5,
    noPrice: typeof payload.noPrice === "number" ? payload.noPrice : 0.5,
    timestamp: payload.timestamp || new Date().toISOString(),
    source: payload.source || "api",
    message: "Snapshot accepted in mock mode. No persistent write has occurred."
  };
};

export { createPriceSnapshot, listContractSnapshots };
