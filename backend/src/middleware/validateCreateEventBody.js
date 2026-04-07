import { ApiError } from "../utils/apiError.js";

const ALLOWED_STATUS = new Set(["open", "closed", "draft"]);

const validateCreateEventBody = (req, _res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(new ApiError(400, "Request body must be a JSON object"));
  }

  const { title, category, status } = body;

  if (body.closeTime !== undefined && body.closeTime !== null && body.closeTime !== "") {
    if (typeof body.closeTime !== "string") {
      return next(new ApiError(400, "Field closeTime must be an ISO 8601 string or omitted"));
    }
    if (Number.isNaN(Date.parse(body.closeTime))) {
      return next(new ApiError(400, "Field closeTime must be a valid ISO 8601 date string"));
    }
  }

  if (typeof title !== "string" || title.trim() === "") {
    return next(new ApiError(400, "Field title is required and must be a non-empty string"));
  }

  if (typeof category !== "string" || category.trim() === "") {
    return next(new ApiError(400, "Field category is required and must be a non-empty string"));
  }

  if (typeof status !== "string" || status.trim() === "") {
    return next(new ApiError(400, "Field status is required and must be a non-empty string"));
  }

  const normalizedStatus = status.toLowerCase();
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return next(new ApiError(400, "Field status must be one of: open, closed, draft"));
  }

  req.validatedCreateEvent = {
    title: title.trim(),
    category: category.trim(),
    status: normalizedStatus,
    description:
      body.description === undefined || body.description === null
        ? ""
        : String(body.description),
    closeTime:
      body.closeTime === undefined || body.closeTime === null || body.closeTime === ""
        ? null
        : String(body.closeTime).trim()
  };

  return next();
};

export { validateCreateEventBody };
