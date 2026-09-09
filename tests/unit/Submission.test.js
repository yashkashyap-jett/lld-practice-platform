const { Submission, REQUIRED_FIELDS, MIN_FIELD_LENGTH } = require('../../server/src/domain/Submission');
const ValidationError = require('../../server/src/domain/errors/ValidationError');

/**
 * Unit tests for Submission domain object.
 */

const makeValidSubmission = (overrides = {}) => ({
  requirements: 'The system must handle parking for multiple vehicle types and floors with spot allocation.',
  assumptions: 'Single building, no pre-booking, cash only payment.',
  classes: 'ParkingLot, Floor, ParkingSpot, Vehicle, Ticket, PaymentService, AllocationStrategy.',
  responsibilities: 'ParkingLot orchestrates entry/exit. ParkingSpot tracks occupancy. Ticket stores entry time and spot info. AllocationStrategy decides which spot to assign.',
  relationships: 'ParkingLot has many Floors. Floor has many ParkingSpots. ParkingLot uses AllocationStrategy. Ticket references ParkingSpot and Vehicle.',
  interfaces: 'IAllocationStrategy defines allocate(vehicle). IPaymentProcessor defines charge(amount). This allows new strategies without modifying ParkingLot.',
  patterns: 'Strategy pattern for allocation (NearestFirstStrategy, RandomStrategy). Factory for creating Vehicle objects from vehicle type string.',
  edgeCases: 'Parking lot is full, invalid ticket on exit, vehicle tries to enter twice, concurrent allocation of same spot, power failure mid-transaction.',
  explanation: 'I separated allocation from the parking lot because the allocation algorithm may change independently. Using interfaces means the lot does not depend on concrete strategies.',
  optionalCode: '',
  ...overrides,
});

describe('Submission Validation', () => {
  test('valid complete submission passes validation', () => {
    const sub = new Submission(makeValidSubmission());
    expect(() => sub.validate()).not.toThrow();
  });

  test('completely empty submission is rejected', () => {
    const sub = new Submission({});
    expect(() => sub.validate()).toThrow(ValidationError);
  });

  test('missing required field "requirements" is rejected', () => {
    const sub = new Submission(makeValidSubmission({ requirements: '' }));
    expect(() => sub.validate()).toThrow(ValidationError);
  });

  test('missing required field "classes" is rejected', () => {
    const sub = new Submission(makeValidSubmission({ classes: '' }));
    expect(() => sub.validate()).toThrow(ValidationError);
  });

  test('trivially short field (< MIN_FIELD_LENGTH chars) is rejected', () => {
    const sub = new Submission(makeValidSubmission({ explanation: 'Short.' }));
    expect(() => sub.validate()).toThrow(ValidationError);
  });

  test('all required fields must be present and substantial', () => {
    for (const field of REQUIRED_FIELDS) {
      const data = makeValidSubmission({ [field]: 'x' }); // too short
      const sub = new Submission(data);
      expect(() => sub.validate()).toThrow(ValidationError);
    }
  });

  test('optionalCode can be empty', () => {
    const sub = new Submission(makeValidSubmission({ optionalCode: '' }));
    expect(() => sub.validate()).not.toThrow();
  });

  test('optionalCode with content still valid', () => {
    const sub = new Submission(makeValidSubmission({ optionalCode: 'class ParkingLot {}' }));
    expect(() => sub.validate()).not.toThrow();
  });

  test('ValidationError contains the names of failed fields', () => {
    const sub = new Submission(makeValidSubmission({ requirements: '', classes: '' }));
    try {
      sub.validate();
      fail('Expected ValidationError');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.fields).toContain('requirements');
      expect(err.fields).toContain('classes');
    }
  });

  test('type defaults to "text"', () => {
    const sub = new Submission(makeValidSubmission());
    expect(sub.type).toBe('text');
  });

  test('toEvaluationPayload returns all sections', () => {
    const sub = new Submission(makeValidSubmission());
    const payload = sub.toEvaluationPayload();
    expect(payload).toHaveProperty('requirements');
    expect(payload).toHaveProperty('classes');
    expect(payload).toHaveProperty('responsibilities');
    expect(payload).toHaveProperty('relationships');
    expect(payload).toHaveProperty('interfaces');
    expect(payload).toHaveProperty('patterns');
    expect(payload).toHaveProperty('edgeCases');
    expect(payload).toHaveProperty('explanation');
    expect(payload).toHaveProperty('type');
  });
});
