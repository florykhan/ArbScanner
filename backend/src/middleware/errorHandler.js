const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred"
  });
};

export default errorHandler;
