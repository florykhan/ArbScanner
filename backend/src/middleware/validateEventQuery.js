import { ApiError } from "../utils/apiError.js";

const MAX_SEARCH_LEN = 200;

const ALLOWED_EVENT_STATUS = new Set(["open", "closed", "draft"]);

const ALLOWED_CATEGORIES = new Set(["politics", "crypto", "sports", "general"]);

/**
 * Optional: search, category, status — invalid values yield 400.
 * Sets `req.validatedEventQuery` for controllers/services.
 */
const validateEventListQuery = (req, _res, next) => {
  const { search, category, status } = req.query;

  if (search !== undefined && search !== null && search !== "") {
    if (typeof search !== "string") {
      return next(new ApiError(400, "Query parameter search must be a string"));
    }
    if (search.length > MAX_SEARCH_LEN) {
      return next(
        new ApiError(400, `Query parameter search must be at most ${MAX_SEARCH_LEN} characters`)
      );
    }
  }

  if (category !== undefined && category !== null && category !== "") {
    if (typeof category !== "string") {
      return next(new ApiError(400, "Query parameter category must be a string"));
    }
    if (!ALLOWED_CATEGORIES.has(category.trim().toLowerCase())) {
      return next(
        new ApiError(
          400,
          "Query parameter category must be one of: Politics, Crypto, Sports, General"
        )
      );
    }
  }

  if (status !== undefined && status !== null && status !== "") {
    if (typeof status !== "string") {
      return next(new ApiError(400, "Query parameter status must be a string"));
    }
    if (!ALLOWED_EVENT_STATUS.has(status.toLowerCase())) {
      return next(
        new ApiError(400, "Query parameter status must be one of: open, closed, draft")
      );
    }
  }

  req.validatedEventQuery = {
    search:
      search === undefined || search === null || search === ""
        ? undefined
        : String(search).trim() || undefined,
    category:
      category === undefined || category === null || category === ""
        ? undefined
        : String(category).trim() || undefined,
    status:
      status === undefined || status === null || status === ""
        ? undefined
        : status.toLowerCase()
  };

  return next();
};

export { validateEventListQuery };
