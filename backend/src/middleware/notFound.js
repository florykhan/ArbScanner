const notFound = (req, res, _next) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
};

export default notFound;
