import { ApiError } from "../utils/apiError.js";

const ALLOWED_SEVERITY = new Set(["high", "medium", "low"]);

/**
 * Optional: severity — invalid value yields 400.
 * Sets `req.validatedAlertQuery`.
 */
const validateAlertListQuery = (req, _res, next) => {
  const { severity } = req.query;

  if (severity === undefined || severity === null || severity === "") {
    req.validatedAlertQuery = {};
    return next();
  }

  if (typeof severity !== "string") {
    return next(new ApiError(400, "Query parameter severity must be a string"));
  }

  const normalized = severity.toLowerCase();
  if (!ALLOWED_SEVERITY.has(normalized)) {
    return next(
      new ApiError(400, "Query parameter severity must be one of: high, medium, low")
    );
  }

  req.validatedAlertQuery = { severity: normalized };
  return next();
};

export { validateAlertListQuery };
