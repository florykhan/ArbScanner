import { ApiError } from "../utils/apiError.js";

/**
 * Ensures `req.params[paramName]` is a safe positive integer string.
 * Sets `req.validatedParams[paramName]` to the parsed number.
 */
const validateIntegerParam = (paramName = "id") => (req, _res, next) => {
  const raw = req.params[paramName];

  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return next(new ApiError(400, `${paramName} is required`));
  }

  const str = String(raw).trim();
  if (!/^\d+$/.test(str)) {
    return next(new ApiError(400, `${paramName} must be a valid positive integer`));
  }

  const n = Number.parseInt(str, 10);
  if (n <= 0 || n > Number.MAX_SAFE_INTEGER) {
    return next(new ApiError(400, `${paramName} must be a valid positive integer`));
  }

  req.validatedParams = req.validatedParams || {};
  req.validatedParams[paramName] = n;
  return next();
};

export { validateIntegerParam };
