/**
 * Evaluation domain object.
 *
 * Represents the result of evaluating a learner's submission.
 * Stored in its own collection, referenced by Attempt.
 *
 * Responsibilities:
 *   - Carry evaluation results (score, criteria, feedback)
 *   - Answer questions about its own state
 *   - Provide a clean interface for the feedback page
 *
 * What it does NOT own:
 *   - How the evaluation was produced (that's Evaluator's job)
 *   - Persistence (EvaluationModel)
 */

const EVALUATION_STATUSES = {
  PENDING: 'PENDING',
  EVALUATING: 'EVALUATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

class Evaluation {
  constructor(doc) {
    this._doc = doc;
  }

  get status() {
    return this._doc.status;
  }

  get doc() {
    return this._doc;
  }

  isComplete() {
    return this._doc.status === EVALUATION_STATUSES.COMPLETED;
  }

  hasFailed() {
    return this._doc.status === EVALUATION_STATUSES.FAILED;
  }

  isPending() {
    return (
      this._doc.status === EVALUATION_STATUSES.PENDING ||
      this._doc.status === EVALUATION_STATUSES.EVALUATING
    );
  }

  /**
   * Check if this evaluation was produced by AI.
   * Useful for UI badges and audit trails.
   */
  isAIEvaluated() {
    return this._doc.evaluatorType === 'ai';
  }

  /**
   * Returns true if the evaluation can be retried.
   * Only FAILED evaluations can be retried.
   */
  canRetry() {
    return this._doc.status === EVALUATION_STATUSES.FAILED;
  }
}

module.exports = { Evaluation, EVALUATION_STATUSES };
