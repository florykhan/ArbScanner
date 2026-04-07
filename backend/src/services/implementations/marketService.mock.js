import { contracts, exchanges, markets } from "../../db/mockData.js";

const listMarkets = async () => {
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
