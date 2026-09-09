const AttemptService = require('../services/AttemptService');
const EvaluationService = require('../services/EvaluationService');

/**
 * Thin controller — delegates all logic to services.
 * Never touches domain objects or models directly.
 * Never sets attempt status directly.
 */
const AttemptController = {
  /**
   * POST /api/attempts
   * Create a new attempt. Body: { problemId, previousAttemptId? }
   * sessionId is read from X-Session-ID header (set by frontend).
   */
  async create(req, res, next) {
    try {
      const { problemId, previousAttemptId } = req.body;
      const sessionId = req.headers['x-session-id'] || null;

      if (!problemId) {
        return res.status(400).json({ success: false, message: 'problemId is required' });
      }

      const attempt = await AttemptService.createAttempt({
        problemId,
        sessionId,
        previousAttemptId: previousAttemptId || null,
      });

      res.status(201).json({ success: true, data: attempt });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/attempts
   * List attempts for the current session.
   */
  async list(req, res, next) {
    try {
      const sessionId = req.headers['x-session-id'] || null;
      const attempts = await AttemptService.getAttemptsBySession(sessionId);
      res.json({ success: true, data: attempts });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/attempts/:id
   * Get a single attempt with submission and evaluation.
   */
  async getById(req, res, next) {
    try {
      const data = await AttemptService.getAttemptById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/attempts/:id/submit
   * Submit the learner's design. Body: all submission fields.
   * Triggers evaluation asynchronously.
   */
  async submit(req, res, next) {
    try {
      const { attempt, submission } = await AttemptService.submitAttempt(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: { attempt, submission },
        message: 'Submission received. Evaluation is in progress.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/attempts/:id/evaluate
   * Manually trigger or retry evaluation.
   * Used for retry when evaluation previously FAILED.
   */
  async triggerEvaluation(req, res, next) {
    try {
      const evalDoc = await EvaluationService.triggerEvaluation(req.params.id);
      res.json({ success: true, data: evalDoc });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/attempts/:id/evaluation
   * Get evaluation status (polling endpoint).
   */
  async getEvaluation(req, res, next) {
    try {
      const evaluation = await EvaluationService.getEvaluationForAttempt(req.params.id);
      res.json({ success: true, data: evaluation });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AttemptController;
