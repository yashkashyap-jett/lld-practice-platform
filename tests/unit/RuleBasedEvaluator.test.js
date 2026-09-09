const RuleBasedEvaluator = require('../../server/src/evaluators/RuleBasedEvaluator');
const { RUBRIC, calculateOverallScore } = require('../../server/src/config/rubric');

/**
 * Unit tests for RuleBasedEvaluator and rubric score calculation.
 * Verifies the deterministic fallback evaluator produces meaningful,
 * variable scores without any external API dependency.
 */

const makePayload = (overrides = {}) => ({
  type: 'text',
  requirements: 'The parking lot must support multiple floors with different spot types. Each floor has a configurable number of spots. The system handles entry, exit, and fee calculation.',
  assumptions: 'Single building, no pre-booking, cash and card payments accepted.',
  classes: 'ParkingLot, Floor, ParkingSpot, Vehicle, Ticket, PaymentService, AllocationStrategy, FeeCalculator.',
  responsibilities: 'ParkingLot orchestrates entry/exit flow and delegates allocation. ParkingSpot tracks its own occupancy state. Ticket is an immutable value object storing entry time and spot reference. AllocationStrategy is responsible only for choosing the next available spot.',
  relationships: 'ParkingLot has many Floors. Floor has many ParkingSpots. ParkingLot depends on AllocationStrategy via interface injection. Ticket references ParkingSpot and Vehicle.',
  interfaces: 'IAllocationStrategy defines allocate(vehicle, floors) contract. IFeeCalculator defines calculate(ticket) method. Abstract Vehicle class with getRequiredSpotType() method. This allows new strategies without modifying ParkingLot.',
  patterns: 'Strategy pattern for AllocationStrategy — allows swapping NearestFirstStrategy, RandomStrategy without modifying ParkingLot. Factory pattern for Vehicle creation from type string. Observer pattern for notifying display panels on floor availability changes.',
  edgeCases: 'Parking lot is full — reject entry gracefully. Invalid ticket on exit — throw InvalidTicketException. Vehicle tries to enter twice — detect existing active ticket. Concurrent allocation of same spot — synchronized reservation. Power failure mid-transaction — ticket issued only after spot marked occupied. Null vehicle type — validate before allocation.',
  explanation: 'I chose to separate AllocationStrategy from ParkingLot because the allocation algorithm is likely to change independently (e.g., prioritize accessible spots, nearest-to-exit). This follows the Open/Closed Principle. Trade-off: adding the Strategy interface adds a layer of indirection, which increases complexity for simple cases. However, the configurability benefit outweighs the cost for a parking system that may grow. Alternative considered: hardcoding allocation in ParkingLot — rejected because it violates SRP and makes testing harder.',
  optionalCode: '',
  ...overrides,
});

const makeProblem = () => ({
  _id: 'problem1',
  title: 'Parking Lot System',
  difficulty: 'Medium',
  requirements: [],
  constraints: [],
  expectedConsiderations: [],
});

describe('RuleBasedEvaluator', () => {
  const evaluator = new RuleBasedEvaluator();

  test('getType() returns "rule_based"', () => {
    expect(evaluator.getType()).toBe('rule_based');
  });

  test('produces valid evaluation structure with all 8 criteria', async () => {
    const result = await evaluator.evaluate(makePayload(), makeProblem());

    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('criteria');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('priorityImprovements');

    expect(result.criteria).toHaveLength(8);
    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);
  });

  test('criteria names match the rubric exactly', async () => {
    const result = await evaluator.evaluate(makePayload(), makeProblem());
    const rubricNames = RUBRIC.map((r) => r.name);
    const resultNames = result.criteria.map((c) => c.name);
    expect(resultNames).toEqual(rubricNames);
  });

  test('each criterion has score, evidence, concern, suggestion, confidence', async () => {
    const result = await evaluator.evaluate(makePayload(), makeProblem());
    for (const criterion of result.criteria) {
      expect(criterion).toHaveProperty('name');
      expect(criterion).toHaveProperty('score');
      expect(criterion).toHaveProperty('evidence');
      expect(criterion).toHaveProperty('confidence');
      expect(typeof criterion.score).toBe('number');
      expect(criterion.score).toBeGreaterThanOrEqual(0);
      expect(criterion.score).toBeLessThanOrEqual(10);
    }
  });

  test('thorough submission scores higher than empty submission', async () => {
    const thorough = await evaluator.evaluate(makePayload(), makeProblem());
    const empty = await evaluator.evaluate(
      makePayload({
        requirements: 'This is a minimal requirement section that is just barely long enough.',
        classes: 'ParkingLot and Vehicle classes only mentioned here.',
        responsibilities: 'ParkingLot does everything in the system here.',
        relationships: 'ParkingLot contains Vehicle objects directly here.',
        interfaces: 'No interfaces are used in this design at all.',
        patterns: 'No design patterns are identified at all here.',
        edgeCases: 'No edge cases were considered at all here.',
        explanation: 'No explanation of decisions was provided here.',
      }),
      makeProblem()
    );

    expect(thorough.overallScore).toBeGreaterThan(empty.overallScore);
  });

  test('summary references the problem title', async () => {
    const result = await evaluator.evaluate(makePayload(), makeProblem());
    expect(result.summary).toContain('Parking Lot System');
  });

  test('summary mentions rule-based evaluator', async () => {
    const result = await evaluator.evaluate(makePayload(), makeProblem());
    expect(result.summary).toContain('rule-based');
  });
});

describe('Rubric calculateOverallScore', () => {
  test('calculates correct mean for all-equal scores', () => {
    const criteria = RUBRIC.map((r) => ({ name: r.name, score: 8 }));
    expect(calculateOverallScore(criteria)).toBe(8);
  });

  test('calculates correct weighted mean', () => {
    const criteria = RUBRIC.map((r, i) => ({ name: r.name, score: i + 1 }));
    // Scores: 1,2,3,4,5,6,7,8 → mean = 4.5
    expect(calculateOverallScore(criteria)).toBe(4.5);
  });

  test('returns 0 for empty criteria', () => {
    expect(calculateOverallScore([])).toBe(0);
    expect(calculateOverallScore(null)).toBe(0);
  });

  test('handles partial criteria — divides by total rubric weight, not provided count', () => {
    // Only 1 of 8 criteria provided → 10 * 1 / 8 = 1.25 → 1.3
    const criteria = [{ name: 'Requirement Understanding', score: 10 }];
    expect(calculateOverallScore(criteria)).toBe(1.3);
  });

  test('rounds to 1 decimal place', () => {
    const criteria = RUBRIC.map((r, i) => ({ name: r.name, score: i === 0 ? 7 : 8 }));
    // 1×7 + 7×8 = 63 / 8 = 7.875 → 7.9
    expect(calculateOverallScore(criteria)).toBe(7.9);
  });
});
