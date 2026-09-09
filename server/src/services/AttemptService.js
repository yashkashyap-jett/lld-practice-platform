const AttemptModel = require('../models/AttemptModel');
const SubmissionModel = require('../models/SubmissionModel');
const EvaluationModel = require('../models/EvaluationModel');
const ProblemModel = require('../models/ProblemModel');
const { Attempt, STATUSES } = require('../domain/Attempt');
const { Submission } = require('../domain/Submission');
const EvaluationService = require('./EvaluationService');
const ValidationError = require('../domain/errors/ValidationError');

/**
 * AttemptService — orchestrates the learner's attempt lifecycle.
 *
 * Responsibilities:
 *   - Create attempts (with optional retry linkage)
 *   - Persist submission and trigger evaluation
 *   - Query attempts with joined data for the UI
 *
 * What it does NOT do:
 *   - Evaluate submissions (that's EvaluationService)
 *   - Validate state transitions (that's Attempt domain object)
 *   - Render responses (that's controllers)
 */
class AttemptService {
  /**
   * Create a new IN_PROGRESS attempt for a problem.
   * If previousAttemptId is provided, links the retry chain.
   */
  async createAttempt({ problemId, sessionId, previousAttemptId = null }) {
    // Validate problem exists
    const problem = await ProblemModel.findById(problemId);
    if (!problem) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    // If retrying, ensure the previous attempt is terminal
    if (previousAttemptId) {
      const prevDoc = await AttemptModel.findById(previousAttemptId);
      if (!prevDoc) {
        throw new ValidationError('Previous attempt not found');
      }
      const prevAttempt = new Attempt(prevDoc);
      if (!prevAttempt.canBeRetried()) {
        throw new ValidationError('Previous attempt is not in a terminal state and cannot be retried');
      }
    }

    const attemptDoc = await AttemptModel.create({
      problemId,
      sessionId,
      previousAttemptId,
      status: STATUSES.IN_PROGRESS,
      startedAt: new Date(),
    });

    return attemptDoc;
  }

  /**
   * Submit a learner's design for an attempt.
   *
   * Flow:
   *   1. Validate attempt exists and is IN_PROGRESS
   *   2. Validate submission content (domain validation)
   *   3. Save submission to DB (BEFORE any state change)
   *   4. Transition attempt → SUBMITTED
   *   5. Trigger async evaluation (non-blocking)
   *
   * Critical: submission is persisted before status change.
   * Even if evaluation fails, the submission is never lost.
   */
  async submitAttempt(attemptId, submissionData) {
    const attemptDoc = await AttemptModel.findById(attemptId);
    if (!attemptDoc) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    const attempt = new Attempt(attemptDoc);

    // Check no existing submission (idempotency guard)
    const existingSubmission = await SubmissionModel.findOne({ attemptId });
    if (existingSubmission) {
      throw new ValidationError('Submission already exists for this attempt');
    }

    // Domain validation (deterministic — no AI)
    const submission = new Submission(submissionData);
    submission.validate();

    // 1. Persist submission FIRST
    const submissionDoc = await SubmissionModel.create({
      attemptId,
      ...submission.toEvaluationPayload(),
    });

    // 2. Transition attempt state
    attempt.submit();
    await attemptDoc.save();

    // 3. Trigger evaluation asynchronously (non-blocking)
    // We don't await — the response returns immediately after SUBMITTED
    EvaluationService.triggerEvaluation(attemptId).catch((err) => {
      console.error(`[AttemptService] Async evaluation failed for attempt ${attemptId}:`, err.message);
    });

    return { attempt: attemptDoc, submission: submissionDoc };
  }

  /**
   * Get a single attempt with all related data joined.
   */
  async getAttemptById(attemptId) {
    const attempt = await AttemptModel.findById(attemptId)
      .populate('problemId')
      .lean();
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    const submission = await SubmissionModel.findOne({ attemptId }).lean();
    const evaluation = await EvaluationModel.findOne({ attemptId }).lean();

    // Fetch previous attempt's evaluation for score comparison
    let previousEvaluation = null;
    if (attempt.previousAttemptId) {
      previousEvaluation = await EvaluationModel.findOne({
        attemptId: attempt.previousAttemptId,
        status: 'COMPLETED',
      }).lean();
    }

    return {
      attempt,
      submission,
      evaluation,
      previousEvaluation,
    };
  }

  /**
   * List all attempts for a session, with problem and evaluation data.
   * Sorted by most recent first.
   */
  async getAttemptsBySession(sessionId) {
    const attempts = await AttemptModel.find({ sessionId })
      .populate('problemId', 'title difficulty')
      .sort({ createdAt: -1 })
      .lean();

    // Attach evaluations
    const attemptIds = attempts.map((a) => a._id);
    const evaluations = await EvaluationModel.find({
      attemptId: { $in: attemptIds },
    }).lean();

    const evalMap = {};
    evaluations.forEach((e) => {
      evalMap[e.attemptId.toString()] = e;
    });

    return attempts.map((a) => ({
      ...a,
      evaluation: evalMap[a._id.toString()] || null,
    }));
  }
}

module.exports = new AttemptService();
