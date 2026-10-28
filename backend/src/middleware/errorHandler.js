class ApiError extends Error {
  constructor(statusCode, message, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    data: null
  });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let data = err.data || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // Handle Mongoose CastError (e.g. invalid ID or Date)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // Handle Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate entry detected for ${field}: ${err.keyValue ? err.keyValue[field] : ''}`;
  }

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('[Error Middleware]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data
  });
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
};
