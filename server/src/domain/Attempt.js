const InvalidTransitionError = require('./errors/InvalidTransitionError');

/**
 * Attempt domain object.
 *
 * Owns the state machine for the learner's practice attempt.
 * All status transitions go through this class — controllers
 * and services NEVER set status directly on the Mongoose model.
 *
 * State machine:
 *   IN_PROGRESS → SUBMITTED → EVALUATING → COMPLETED
 *                                        → FAILED
 *
 * Responsibilities:
 *   - Enforce valid state transitions
 *   - Record timestamps on transitions
 *   - Expose intent-revealing methods (submit, startEvaluation, etc.)
 *   - Answer questions about its own state (canBeRetried, isTerminal)
 *
 * What it does NOT own:
 *   - Persistence (that's AttemptModel)
 *   - Business orchestration (that's AttemptService)
 */

const STATUSES = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  EVALUATING: 'EVALUATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// Allowed transitions table: fromStatus → [allowed toStatuses]
const ALLOWED_TRANSITIONS = {
  [STATUSES.IN_PROGRESS]: [STATUSES.SUBMITTED],
  [STATUSES.SUBMITTED]: [STATUSES.EVALUATING],
  [STATUSES.EVALUATING]: [STATUSES.COMPLETED, STATUSES.FAILED],
  [STATUSES.COMPLETED]: [], // terminal
  [STATUSES.FAILED]: [],    // terminal — must create new attempt to retry
};

class Attempt {
  /**
   * Wraps a Mongoose document for domain operations.
   * Does not persist — call attemptDoc.save() separately.
   */
  constructor(attemptDoc) {
    this._doc = attemptDoc;
  }

  get status() {
    return this._doc.status;
  }

  get id() {
    return this._doc._id;
  }

  get doc() {
    return this._doc;
  }

  // ─── State transition methods ──────────────────────────────────────────────

  /**
   * Transition IN_PROGRESS → SUBMITTED.
   * Called when the learner submits their design.
   */
  submit() {
    this._transition(STATUSES.SUBMITTED);
    this._doc.submittedAt = new Date();
    return this;
  }

  /**
   * Transition SUBMITTED → EVALUATING.
   * Called when evaluation processing begins.
   */
  startEvaluation() {
    this._transition(STATUSES.EVALUATING);
    this._doc.evaluatingAt = new Date();
    return this;
  }

  /**
   * Transition EVALUATING → COMPLETED.
   * Called when evaluation successfully finishes.
   */
  completeEvaluation() {
    this._transition(STATUSES.COMPLETED);
    this._doc.completedAt = new Date();
    return this;
  }

  /**
   * Transition EVALUATING → FAILED.
   * Called when evaluation fails (AI error, timeout, etc.).
   */
  failEvaluation() {
    this._transition(STATUSES.FAILED);
    this._doc.completedAt = new Date();
    return this;
  }

  // ─── State query methods ───────────────────────────────────────────────────

  isInProgress() {
    return this._doc.status === STATUSES.IN_PROGRESS;
  }

  isSubmitted() {
    return this._doc.status === STATUSES.SUBMITTED;
  }

  isEvaluating() {
    return this._doc.status === STATUSES.EVALUATING;
  }

  isCompleted() {
    return this._doc.status === STATUSES.COMPLETED;
  }

  hasFailed() {
    return this._doc.status === STATUSES.FAILED;
  }

  isTerminal() {
    return this.isCompleted() || this.hasFailed();
  }

  /**
   * A completed or failed attempt can always be "retried" by creating
   * a new attempt with previousAttemptId pointing to this one.
   */
  canBeRetried() {
    return this.isTerminal();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _transition(toStatus) {
    const allowed = ALLOWED_TRANSITIONS[this._doc.status] || [];
    if (!allowed.includes(toStatus)) {
      throw new InvalidTransitionError(this._doc.status, toStatus);
    }
    this._doc.status = toStatus;
  }
}

module.exports = { Attempt, STATUSES };
