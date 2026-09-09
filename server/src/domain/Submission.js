const ValidationError = require('./errors/ValidationError');

/**
 * Submission domain object.
 *
 * Owns the learner's design submission and all validation logic.
 * The `type` field acts as a discriminator for future submission formats
 * (e.g., 'diagram', 'code') without changing Attempt or EvaluationService.
 *
 * Responsibilities:
 *   - Validate that required sections are present and non-trivial
 *   - Provide a normalized view of submission data for evaluators
 *
 * What it does NOT own:
 *   - Persistence (SubmissionModel)
 *   - Evaluation (EvaluationService)
 */

const REQUIRED_FIELDS = [
  'requirements',
  'classes',
  'responsibilities',
  'relationships',
  'interfaces',
  'patterns',
  'edgeCases',
  'explanation',
];

const MIN_FIELD_LENGTH = 20; // characters — filters out trivial/placeholder text

class Submission {
  constructor(data) {
    this.type = data.type || 'text';
    this.requirements = data.requirements || '';
    this.assumptions = data.assumptions || '';
    this.classes = data.classes || '';
    this.responsibilities = data.responsibilities || '';
    this.relationships = data.relationships || '';
    this.interfaces = data.interfaces || '';
    this.patterns = data.patterns || '';
    this.edgeCases = data.edgeCases || '';
    this.explanation = data.explanation || '';
    this.optionalCode = data.optionalCode || '';
  }

  /**
   * Validates the submission.
   * Throws ValidationError if required sections are missing or trivially short.
   * Returns true if valid.
   *
   * This is deterministic validation — no AI needed for these checks.
   */
  validate() {
    const missingFields = [];

    for (const field of REQUIRED_FIELDS) {
      const value = this[field];
      if (!value || value.trim().length < MIN_FIELD_LENGTH) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Submission is incomplete. The following sections need more content: ${missingFields.join(', ')}`,
        missingFields
      );
    }

    return true;
  }

  /**
   * Returns a structured representation for the AI evaluator.
   * Keeping this in the domain object ensures evaluators receive
   * a consistent shape regardless of how the data was submitted.
   */
  toEvaluationPayload() {
    return {
      type: this.type,
      requirements: this.requirements,
      assumptions: this.assumptions,
      classes: this.classes,
      responsibilities: this.responsibilities,
      relationships: this.relationships,
      interfaces: this.interfaces,
      patterns: this.patterns,
      edgeCases: this.edgeCases,
      explanation: this.explanation,
      optionalCode: this.optionalCode,
    };
  }
}

module.exports = { Submission, REQUIRED_FIELDS, MIN_FIELD_LENGTH };
