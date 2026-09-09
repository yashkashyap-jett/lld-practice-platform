const { Attempt, STATUSES } = require('../../server/src/domain/Attempt');
const InvalidTransitionError = require('../../server/src/domain/errors/InvalidTransitionError');

/**
 * Unit tests for Attempt domain object.
 * Tests every valid and invalid state machine transition.
 */

const makeMockDoc = (status = STATUSES.IN_PROGRESS) => ({
  status,
  submittedAt: null,
  evaluatingAt: null,
  completedAt: null,
  save: jest.fn(),
});

describe('Attempt State Machine', () => {
  // ─── Valid transitions ─────────────────────────────────────────────────────

  test('IN_PROGRESS → SUBMITTED via submit()', () => {
    const doc = makeMockDoc(STATUSES.IN_PROGRESS);
    const attempt = new Attempt(doc);
    attempt.submit();
    expect(attempt.status).toBe(STATUSES.SUBMITTED);
    expect(doc.submittedAt).toBeInstanceOf(Date);
  });

  test('SUBMITTED → EVALUATING via startEvaluation()', () => {
    const doc = makeMockDoc(STATUSES.SUBMITTED);
    const attempt = new Attempt(doc);
    attempt.startEvaluation();
    expect(attempt.status).toBe(STATUSES.EVALUATING);
    expect(doc.evaluatingAt).toBeInstanceOf(Date);
  });

  test('EVALUATING → COMPLETED via completeEvaluation()', () => {
    const doc = makeMockDoc(STATUSES.EVALUATING);
    const attempt = new Attempt(doc);
    attempt.completeEvaluation();
    expect(attempt.status).toBe(STATUSES.COMPLETED);
    expect(doc.completedAt).toBeInstanceOf(Date);
  });

  test('EVALUATING → FAILED via failEvaluation()', () => {
    const doc = makeMockDoc(STATUSES.EVALUATING);
    const attempt = new Attempt(doc);
    attempt.failEvaluation();
    expect(attempt.status).toBe(STATUSES.FAILED);
    expect(doc.completedAt).toBeInstanceOf(Date);
  });

  // ─── Invalid transitions ───────────────────────────────────────────────────

  test('COMPLETED → SUBMITTED throws InvalidTransitionError', () => {
    const doc = makeMockDoc(STATUSES.COMPLETED);
    const attempt = new Attempt(doc);
    expect(() => attempt.submit()).toThrow(InvalidTransitionError);
    expect(() => attempt.submit()).toThrow('COMPLETED → SUBMITTED');
  });

  test('COMPLETED → EVALUATING throws InvalidTransitionError', () => {
    const doc = makeMockDoc(STATUSES.COMPLETED);
    const attempt = new Attempt(doc);
    expect(() => attempt.startEvaluation()).toThrow(InvalidTransitionError);
  });

  test('FAILED → COMPLETED throws InvalidTransitionError', () => {
    const doc = makeMockDoc(STATUSES.FAILED);
    const attempt = new Attempt(doc);
    expect(() => attempt.completeEvaluation()).toThrow(InvalidTransitionError);
  });

  test('IN_PROGRESS → COMPLETED throws (must go through SUBMITTED)', () => {
    const doc = makeMockDoc(STATUSES.IN_PROGRESS);
    const attempt = new Attempt(doc);
    expect(() => attempt.completeEvaluation()).toThrow(InvalidTransitionError);
  });

  test('SUBMITTED → COMPLETED throws (must go through EVALUATING)', () => {
    const doc = makeMockDoc(STATUSES.SUBMITTED);
    const attempt = new Attempt(doc);
    expect(() => attempt.completeEvaluation()).toThrow(InvalidTransitionError);
  });

  test('SUBMITTED → FAILED throws (must go through EVALUATING)', () => {
    const doc = makeMockDoc(STATUSES.SUBMITTED);
    const attempt = new Attempt(doc);
    expect(() => attempt.failEvaluation()).toThrow(InvalidTransitionError);
  });

  // ─── State query methods ───────────────────────────────────────────────────

  test('isTerminal() returns true for COMPLETED', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.COMPLETED));
    expect(attempt.isTerminal()).toBe(true);
  });

  test('isTerminal() returns true for FAILED', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.FAILED));
    expect(attempt.isTerminal()).toBe(true);
  });

  test('isTerminal() returns false for IN_PROGRESS', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.IN_PROGRESS));
    expect(attempt.isTerminal()).toBe(false);
  });

  test('canBeRetried() returns true for COMPLETED', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.COMPLETED));
    expect(attempt.canBeRetried()).toBe(true);
  });

  test('canBeRetried() returns true for FAILED', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.FAILED));
    expect(attempt.canBeRetried()).toBe(true);
  });

  test('canBeRetried() returns false for IN_PROGRESS', () => {
    const attempt = new Attempt(makeMockDoc(STATUSES.IN_PROGRESS));
    expect(attempt.canBeRetried()).toBe(false);
  });

  // ─── Chaining ─────────────────────────────────────────────────────────────

  test('full happy path: IN_PROGRESS → SUBMITTED → EVALUATING → COMPLETED', () => {
    const doc = makeMockDoc(STATUSES.IN_PROGRESS);
    const attempt = new Attempt(doc);

    attempt.submit();
    expect(attempt.status).toBe(STATUSES.SUBMITTED);

    attempt.startEvaluation();
    expect(attempt.status).toBe(STATUSES.EVALUATING);

    attempt.completeEvaluation();
    expect(attempt.status).toBe(STATUSES.COMPLETED);
  });

  test('failure path: IN_PROGRESS → SUBMITTED → EVALUATING → FAILED', () => {
    const doc = makeMockDoc(STATUSES.IN_PROGRESS);
    const attempt = new Attempt(doc);

    attempt.submit();
    attempt.startEvaluation();
    attempt.failEvaluation();

    expect(attempt.status).toBe(STATUSES.FAILED);
    expect(attempt.hasFailed()).toBe(true);
    expect(attempt.isCompleted()).toBe(false);
  });
});
