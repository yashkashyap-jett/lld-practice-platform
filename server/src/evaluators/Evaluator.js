/**
 * Abstract base class for all evaluators.
 *
 * Defines the contract that all evaluator implementations must fulfill.
 * EvaluationService depends only on this interface — never directly
 * on AIEvaluator or RuleBasedEvaluator.
 *
 * Future implementations: HumanEvaluator, HybridEvaluator, etc.
 * Adding a new evaluator = extend this class + update config/evaluator.js.
 * The practice flow requires ZERO changes.
 */
class Evaluator {
  /**
   * Evaluate a learner's submission against a problem.
   *
   * @param {object} submissionPayload - Output of Submission.toEvaluationPayload()
   * @param {object} problem - The problem document from MongoDB
   * @returns {Promise<EvaluationResult>} Structured evaluation result
   * @throws {Error} If evaluation cannot be performed
   */
  // eslint-disable-next-line no-unused-vars
  async evaluate(submissionPayload, problem) {
    throw new Error(`${this.constructor.name} must implement evaluate()`);
  }

  /**
   * Returns the evaluator type string stored in the Evaluation document.
   * Used for audit trails and UI badges.
   * @returns {'ai' | 'rule_based'}
   */
  getType() {
    throw new Error(`${this.constructor.name} must implement getType()`);
  }
}

/**
 * @typedef {object} EvaluationResult
 * @property {number} overallScore - 0–10 overall score
 * @property {string} summary - Short overall assessment
 * @property {CriterionResult[]} criteria - Per-criterion scores and feedback
 * @property {string[]} strengths - Specific strengths observed
 * @property {string[]} priorityImprovements - Top actionable improvements
 */

/**
 * @typedef {object} CriterionResult
 * @property {string} name - Criterion name (must match RUBRIC)
 * @property {number} score - 0–10
 * @property {string} evidence - Direct quote/reference from submission
 * @property {string} concern - Specific weakness identified
 * @property {string} suggestion - Concrete actionable improvement
 * @property {number} confidence - 0–1 evaluator confidence
 */

module.exports = Evaluator;
