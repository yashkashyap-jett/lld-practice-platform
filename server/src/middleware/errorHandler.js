const InvalidTransitionError = require('../domain/errors/InvalidTransitionError');
const ValidationError = require('../domain/errors/ValidationError');

/**
 * Global error handler middleware.
 * Maps domain errors to appropriate HTTP status codes.
 * Never exposes internal stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Domain errors — known, safe to surface
  if (err instanceof InvalidTransitionError) {
    return res.status(409).json({
      success: false,
      message: err.message,
      type: 'InvalidTransitionError',
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      fields: err.fields,
      type: 'ValidationError',
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format`,
    });
  }

  // Not found (explicitly thrown with 404)
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown errors
  console.error('[Error]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: isProd ? 'An unexpected error occurred' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
