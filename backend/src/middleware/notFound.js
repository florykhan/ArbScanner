const notFound = (req, res, _next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} does not exist`,
      status: 404
    }
  });
};

export default notFound;
