function errorMiddleware(error, req, res, next) {
  console.error(error);

  const status = error.status || 500;

  res.status(status).json({
    status: "error",
    message: error.message || "Internal server error",
  });
}

module.exports = errorMiddleware;