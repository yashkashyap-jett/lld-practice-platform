const AttemptModel = require('../models/AttemptModel');
const SubmissionModel = require('../models/SubmissionModel');
const EvaluationModel = require('../models/EvaluationModel');
const ProblemModel = require('../models/ProblemModel');
const { Attempt } = require('../domain/Attempt');
const { getEvaluator } = require('../config/evaluator');

/**
 * EvaluationService — manages the evaluation lifecycle.
 *
 * Responsibilities:
 *   - Trigger evaluation for a submitted attempt
 *   - Guard against duplicate evaluation
 *   - Handle AI failure gracefully (FAILED state, error stored)
 *   - Retrieve evaluation status for polling
 *
 * This service depends on the Evaluator abstraction, NOT on Gemini/AI directly.
 * To swap evaluators: update config/evaluator.js. This file is unchanged.
 */
class EvaluationService {
  /**
   * Trigger evaluation for an attempt.
   *
   * Guards:
   *   1. Attempt must exist and be in SUBMITTED state
   *   2. No existing EVALUATING/COMPLETED evaluation (duplicate prevention)
   *
   * State flow managed here:
   *   SUBMITTED → EVALUATING (attempt + evaluation doc created)
   *   EVALUATING → COMPLETED (on success)
   *   EVALUATING → FAILED (on error)
   *
   * Can also be called for FAILED attempts (retry evaluation).
   */
  async triggerEvaluation(attemptId) {
    const attemptDoc = await AttemptModel.findById(attemptId);
    if (!attemptDoc) throw new Error(`Attempt ${attemptId} not found`);

    const attempt = new Attempt(attemptDoc);

    // Allow trigger from SUBMITTED or (retry) from FAILED → re-evaluate
    if (!attempt.isSubmitted() && !attempt.hasFailed()) {
      throw new Error(
        `Cannot trigger evaluation: attempt is in state ${attempt.status}. Expected SUBMITTED or FAILED.`
      );
    }

    // Duplicate guard: check for an in-progress or completed evaluation
    const existingEval = await EvaluationModel.findOne({ attemptId });
    if (existingEval) {
      if (existingEval.status === 'EVALUATING' || existingEval.status === 'COMPLETED') {
        console.log(`[EvaluationService] Duplicate evaluation prevented for attempt ${attemptId}`);
        return existingEval;
      }
      // FAILED evaluation — delete it to retry
      if (existingEval.status === 'FAILED') {
        await EvaluationModel.deleteOne({ _id: existingEval._id });
        // Reset attempt to SUBMITTED for transition
        attemptDoc.status = 'SUBMITTED';
        await attemptDoc.save();
      }
    }

    // Get the submission
    const submissionDoc = await SubmissionModel.findOne({ attemptId });
    if (!submissionDoc) throw new Error(`No submission found for attempt ${attemptId}`);

    const problem = await ProblemModel.findById(attemptDoc.problemId).lean();
    if (!problem) throw new Error(`Problem not found for attempt ${attemptId}`);

    // Create evaluation record in PENDING state
    const evalDoc = await EvaluationModel.create({
      attemptId,
      status: 'EVALUATING',
    });

    // Transition attempt → EVALUATING
    const freshAttemptDoc = await AttemptModel.findById(attemptId);
    const freshAttempt = new Attempt(freshAttemptDoc);
    
    // Handle both SUBMITTED and cases where we reset to SUBMITTED for retry
    if (freshAttempt.isSubmitted()) {
      freshAttempt.startEvaluation();
      await freshAttemptDoc.save();
    }

    // Run evaluation
    const evaluator = getEvaluator();
    try {
      const submissionPayload = submissionDoc.toObject();
      const result = await evaluator.evaluate(submissionPayload, problem);

      // Mark evaluation COMPLETED
      evalDoc.status = 'COMPLETED';
      evalDoc.overallScore = result.overallScore;
      evalDoc.summary = result.summary;
      evalDoc.criteria = result.criteria;
      evalDoc.strengths = result.strengths || [];
      evalDoc.priorityImprovements = result.priorityImprovements || [];
      evalDoc.evaluatorType = evaluator.getType();
      evalDoc.completedAt = new Date();
      await evalDoc.save();

      // Transition attempt → COMPLETED
      const completingAttemptDoc = await AttemptModel.findById(attemptId);
      const completingAttempt = new Attempt(completingAttemptDoc);
      completingAttempt.completeEvaluation();
      await completingAttemptDoc.save();

      console.log(`[EvaluationService] ✓ Attempt ${attemptId} evaluated. Score: ${result.overallScore}`);
      return evalDoc;
    } catch (err) {
      console.error(`[EvaluationService] ✗ Evaluation failed for attempt ${attemptId}:`, err.message);

      // Mark evaluation FAILED — store error for debugging
      evalDoc.status = 'FAILED';
      evalDoc.error = err.message;
      evalDoc.completedAt = new Date();
      await evalDoc.save();

      // Transition attempt → FAILED
      try {
        const failingAttemptDoc = await AttemptModel.findById(attemptId);
        const failingAttempt = new Attempt(failingAttemptDoc);
        if (failingAttempt.isEvaluating()) {
          failingAttempt.failEvaluation();
          await failingAttemptDoc.save();
        }
      } catch (transitionErr) {
        console.error('[EvaluationService] Failed to transition attempt to FAILED:', transitionErr.message);
      }

      return evalDoc;
    }
  }

  /**
   * Get the current evaluation for an attempt (polling target).
   */
  async getEvaluationForAttempt(attemptId) {
    return EvaluationModel.findOne({ attemptId }).lean();
  }
}

module.exports = new EvaluationService();
