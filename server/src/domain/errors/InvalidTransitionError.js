/**
 * Custom error for illegal Attempt state transitions.
 * Thrown by Attempt domain methods when a transition is not allowed.
 */
class InvalidTransitionError extends Error {
  constructor(fromStatus, toStatus) {
    super(`Invalid transition: ${fromStatus} → ${toStatus}`);
    this.name = 'InvalidTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.statusCode = 409;
  }
}

module.exports = InvalidTransitionError;
