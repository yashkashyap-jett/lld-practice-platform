/**
 * Custom error for validation failures.
 */
class ValidationError extends Error {
  constructor(message, fields = []) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.statusCode = 400;
  }
}

module.exports = ValidationError;
