/**
 * Wraps an async Express route handler so rejected promises are forwarded to
 * next(err) instead of crashing the process or requiring a try/catch in every
 * controller. Paired with the error-handling middleware in server.js.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
