/**
 * Typed HTTP error for API handlers and validation.
 * Handled by `errorHandler` middleware into a consistent JSON shape.
 * TODO (Phase 5): Map MySQL / external feed errors into ApiError at repository boundaries.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export { ApiError };
