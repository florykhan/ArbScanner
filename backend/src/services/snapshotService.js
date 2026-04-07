import { contracts, markets, priceSnapshots } from "../db/mockData.js";
import { ApiError } from "../utils/apiError.js";

const listContractSnapshots = (contractId) => {
  // TODO (Phase 5): Replace with MySQL query on snapshots table.
  const contract = contracts.find((item) => item.id === contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
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

const createPriceSnapshot = (payload) => {
  // TODO (Phase 5): Validate and insert in MySQL; stream from Manifold adapter.
  const contract = contracts.find((item) => item.id === payload.contractId);
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  return {
    snapshotId: `snap_${Date.now()}`,
    contractId: payload.contractId,
    yesPrice: payload.yesPrice,
    noPrice: payload.noPrice,
    timestamp: payload.timestamp,
    source: payload.source,
    message: "Snapshot accepted in mock mode. No persistent write has occurred."
  };
};

export { createPriceSnapshot, listContractSnapshots };
