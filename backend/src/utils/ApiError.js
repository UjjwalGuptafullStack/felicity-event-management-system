/**
 * Error subclass carrying an HTTP status code, so asyncHandler-wrapped
 * controllers can `throw new ApiError(404, 'Event not found')` instead of
 * manually shaping a response, and the error middleware in server.js can
 * translate it consistently.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
