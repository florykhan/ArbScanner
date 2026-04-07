import { contracts, exchanges, markets } from "../db/mockData.js";

const listMarkets = () => {
  // TODO (Phase 4): Replace with MySQL joins between markets/exchanges/contracts.
  return markets.map((market) => {
    const exchange = exchanges.find((item) => item.id === market.exchangeId);
    const contractCount = contracts.filter(
      (contract) => contract.marketId === market.id
    ).length;

    return {
      ...market,
      exchange: exchange
        ? {
            id: exchange.id,
            name: exchange.name
          }
        : null,
      contractCount
    };
  });
};

export { listMarkets };
