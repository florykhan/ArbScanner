import { ApiError } from "../utils/apiError.js";

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400)) {
    return res.status(400).json({
      error: {
        message: "Invalid JSON body",
        status: 400
      }
    });
  }

  const statusCode =
    err instanceof ApiError
      ? err.statusCode
      : Number.isInteger(err.statusCode)
        ? err.statusCode
        : Number.isInteger(err.status)
          ? err.status
          : 500;

  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message || "An unexpected error occurred";

  const payload = {
    error: {
      message,
      status: statusCode
    }
  };

  if (err instanceof ApiError && err.details !== undefined) {
    payload.error.details = err.details;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
