/**
 * Unit tests for EvaluationService.
 * Uses mock evaluator, mock models — no DB connection needed.
 */

// ─── Global mocks ────────────────────────────────────────────────────────────
jest.mock('../../server/src/models/AttemptModel');
jest.mock('../../server/src/models/SubmissionModel');
jest.mock('../../server/src/models/EvaluationModel');
jest.mock('../../server/src/models/ProblemModel');
jest.mock('../../server/src/config/evaluator');

const { STATUSES } = require('../../server/src/domain/Attempt');

// Helper: create a mock Mongoose document with save()
const mockDoc = (data) => {
  const doc = { ...data };
  doc.save = jest.fn().mockResolvedValue(doc);
  doc.toObject = jest.fn().mockReturnValue(data);
  return doc;
};

// Helper: mock a chainable Mongoose query (supports .lean())
const mockQuery = (resolvedValue) => ({
  lean: jest.fn().mockResolvedValue(resolvedValue),
});

// Sample successful evaluation result
const sampleEvalResult = {
  overallScore: 7.5,
  summary: 'Good design with some areas to improve.',
  criteria: [
    { name: 'Requirement Understanding', score: 8, evidence: 'Listed all requirements.', concern: '', suggestion: '', confidence: 0.9 },
    { name: 'Class Responsibilities', score: 7, evidence: 'Defined classes clearly.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Coupling & Cohesion', score: 7, evidence: 'References explained.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Encapsulation & Interfaces', score: 8, evidence: 'Interfaces defined.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Abstraction & Design Patterns', score: 7, evidence: 'Strategy pattern used.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Extensibility', score: 8, evidence: 'Open for extension.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Edge Cases & Testability', score: 7, evidence: 'Edge cases listed.', concern: '', suggestion: '', confidence: 0.8 },
    { name: 'Design Explanation & Trade-offs', score: 7, evidence: 'Explains reasoning.', concern: '', suggestion: '', confidence: 0.8 },
  ],
  strengths: ['Good interface usage'],
  priorityImprovements: ['Improve edge case handling'],
};

// ─── Get fresh references to mocked modules ───────────────────────────────────
const AttemptModel = require('../../server/src/models/AttemptModel');
const SubmissionModel = require('../../server/src/models/SubmissionModel');
const EvaluationModel = require('../../server/src/models/EvaluationModel');
const ProblemModel = require('../../server/src/models/ProblemModel');
const { getEvaluator } = require('../../server/src/config/evaluator');

const EvaluationService = require('../../server/src/services/EvaluationService');

describe('EvaluationService', () => {
  let mockEvaluator;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvaluator = {
      evaluate: jest.fn().mockResolvedValue(sampleEvalResult),
      getType: jest.fn().mockReturnValue('rule_based'),
    };
    getEvaluator.mockReturnValue(mockEvaluator);
  });

  describe('triggerEvaluation', () => {

    test('successful evaluation → COMPLETED attempt and evaluation', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.SUBMITTED });
      const submissionDoc = mockDoc({ attemptId: 'attempt1', requirements: 'Some requirements' });
      const problem = { _id: 'problem1', title: 'Parking Lot', requirements: [], constraints: [], expectedConsiderations: [] };

      // AttemptModel.findById is called multiple times for state transitions
      AttemptModel.findById.mockResolvedValue(attemptDoc);
      EvaluationModel.findOne.mockResolvedValue(null);

      const evalDoc = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'EVALUATING' });
      EvaluationModel.create.mockResolvedValue(evalDoc);
      SubmissionModel.findOne.mockResolvedValue(submissionDoc);
      ProblemModel.findById.mockReturnValue(mockQuery(problem));

      await EvaluationService.triggerEvaluation('attempt1');

      expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(1);
      expect(evalDoc.save).toHaveBeenCalled();
      expect(evalDoc.status).toBe('COMPLETED');
      expect(evalDoc.overallScore).toBe(sampleEvalResult.overallScore);
    });

    test('AI failure → evaluation FAILED, error stored', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.SUBMITTED });
      const submissionDoc = mockDoc({ attemptId: 'attempt1' });
      const problem = { _id: 'problem1', title: 'Parking Lot', requirements: [], constraints: [], expectedConsiderations: [] };

      AttemptModel.findById.mockResolvedValue(attemptDoc);
      EvaluationModel.findOne.mockResolvedValue(null);

      const evalDoc = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'EVALUATING' });
      EvaluationModel.create.mockResolvedValue(evalDoc);
      SubmissionModel.findOne.mockResolvedValue(submissionDoc);
      ProblemModel.findById.mockReturnValue(mockQuery(problem));

      mockEvaluator.evaluate.mockRejectedValue(new Error('Gemini API timeout'));

      await EvaluationService.triggerEvaluation('attempt1');

      expect(evalDoc.status).toBe('FAILED');
      expect(evalDoc.error).toContain('Gemini API timeout');
    });

    test('duplicate evaluation (EVALUATING status) is prevented', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.SUBMITTED });
      AttemptModel.findById.mockResolvedValue(attemptDoc);

      const existingEval = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'EVALUATING' });
      EvaluationModel.findOne.mockResolvedValue(existingEval);

      const result = await EvaluationService.triggerEvaluation('attempt1');

      expect(mockEvaluator.evaluate).not.toHaveBeenCalled();
      expect(result).toBe(existingEval);
    });

    test('duplicate evaluation (COMPLETED status) is prevented', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.SUBMITTED });
      AttemptModel.findById.mockResolvedValue(attemptDoc);

      const existingEval = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'COMPLETED', overallScore: 8 });
      EvaluationModel.findOne.mockResolvedValue(existingEval);

      const result = await EvaluationService.triggerEvaluation('attempt1');

      expect(mockEvaluator.evaluate).not.toHaveBeenCalled();
      expect(result.overallScore).toBe(8);
    });

    test('attempt not in SUBMITTED state throws error', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.IN_PROGRESS });
      AttemptModel.findById.mockResolvedValue(attemptDoc);

      await expect(EvaluationService.triggerEvaluation('attempt1')).rejects.toThrow(
        /Cannot trigger evaluation/
      );
    });

    test('FAILED evaluation can be retried — old eval deleted and new one runs', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.FAILED });
      const submissionDoc = mockDoc({ attemptId: 'attempt1' });
      const problem = { _id: 'problem1', title: 'Parking Lot', requirements: [], constraints: [], expectedConsiderations: [] };

      AttemptModel.findById.mockResolvedValue(attemptDoc);

      const failedEval = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'FAILED' });
      EvaluationModel.findOne.mockResolvedValue(failedEval);
      EvaluationModel.deleteOne.mockResolvedValue({});

      const newEvalDoc = mockDoc({ _id: 'eval2', attemptId: 'attempt1', status: 'EVALUATING' });
      EvaluationModel.create.mockResolvedValue(newEvalDoc);
      SubmissionModel.findOne.mockResolvedValue(submissionDoc);
      ProblemModel.findById.mockReturnValue(mockQuery(problem));

      await EvaluationService.triggerEvaluation('attempt1');

      expect(EvaluationModel.deleteOne).toHaveBeenCalled();
      expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(1);
    });

    test('malformed AI response (rejected promise) → FAILED gracefully', async () => {
      const attemptDoc = mockDoc({ _id: 'attempt1', problemId: 'problem1', status: STATUSES.SUBMITTED });
      const submissionDoc = mockDoc({ attemptId: 'attempt1' });
      const problem = { _id: 'problem1', title: 'Parking Lot', requirements: [], constraints: [], expectedConsiderations: [] };

      AttemptModel.findById.mockResolvedValue(attemptDoc);
      EvaluationModel.findOne.mockResolvedValue(null);

      const evalDoc = mockDoc({ _id: 'eval1', attemptId: 'attempt1', status: 'EVALUATING' });
      EvaluationModel.create.mockResolvedValue(evalDoc);
      SubmissionModel.findOne.mockResolvedValue(submissionDoc);
      ProblemModel.findById.mockReturnValue(mockQuery(problem));

      mockEvaluator.evaluate.mockRejectedValue(new Error('Failed to parse AI response after retry'));

      // Should not throw — failure is handled gracefully
      await expect(EvaluationService.triggerEvaluation('attempt1')).resolves.toBeDefined();
      expect(evalDoc.status).toBe('FAILED');
      expect(evalDoc.error).toContain('Failed to parse AI response');
    });
  });
});
