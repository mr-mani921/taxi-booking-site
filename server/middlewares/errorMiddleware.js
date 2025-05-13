const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // If response headers have already been sent, let Express handle the error
  if (res.headersSent) {
    return next(err);
  }

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Send error response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
