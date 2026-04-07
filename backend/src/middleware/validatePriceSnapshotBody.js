import { ApiError } from "../utils/apiError.js";

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const validatePriceInRange = (value, fieldName) => {
  if (!isFiniteNumber(value)) {
    return `${fieldName} must be a finite number`;
  }
  if (value < 0 || value > 1) {
    return `${fieldName} must be between 0 and 1 inclusive`;
  }
  return null;
};

const validateIsoTimestamp = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return "timestamp must be a non-empty ISO 8601 string";
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    return "timestamp must be a valid ISO 8601 date string";
  }
  return null;
};

/**
 * POST /api/price-snapshots — requires contractId, timestamp, yesPrice, noPrice.
 */
const validatePriceSnapshotBody = (req, _res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(new ApiError(400, "Request body must be a JSON object"));
  }

  const { contractId, timestamp, yesPrice, noPrice } = body;

  if (contractId === undefined || contractId === null) {
    return next(new ApiError(400, "Field contractId is required"));
  }

  let contractNumericId;
  if (typeof contractId === "number" && Number.isInteger(contractId)) {
    contractNumericId = contractId;
  } else if (typeof contractId === "string" && /^\d+$/.test(contractId.trim())) {
    contractNumericId = Number.parseInt(contractId.trim(), 10);
  } else {
    return next(new ApiError(400, "Field contractId must be a positive integer"));
  }

  if (contractNumericId <= 0 || contractNumericId > Number.MAX_SAFE_INTEGER) {
    return next(new ApiError(400, "Field contractId must be a positive integer"));
  }

  const tsErr = validateIsoTimestamp(timestamp);
  if (tsErr) {
    return next(new ApiError(400, tsErr));
  }

  const yesErr = validatePriceInRange(yesPrice, "yesPrice");
  if (yesErr) {
    return next(new ApiError(400, yesErr));
  }

  const noErr = validatePriceInRange(noPrice, "noPrice");
  if (noErr) {
    return next(new ApiError(400, noErr));
  }

  const sum = yesPrice + noPrice;
  if (sum < 0.98 || sum > 1.02) {
    return next(
      new ApiError(400, "yesPrice and noPrice must sum to approximately 1 (within 0.02)")
    );
  }

  req.validatedPriceSnapshot = {
    contractId: contractNumericId,
    timestamp: String(timestamp).trim(),
    yesPrice,
    noPrice,
    source: body.source === undefined ? "api" : String(body.source)
  };

  return next();
};

export { validatePriceSnapshotBody };
