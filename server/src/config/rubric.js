/**
 * Fixed evaluation rubric.
 * Stored here (not hard-coded into evaluators) so criteria names and weights
 * can be updated in one place without touching AIEvaluator or RuleBasedEvaluator.
 */

const RUBRIC = [
  {
    name: 'Requirement Understanding',
    description:
      'Did the learner accurately capture the core requirements, constraints, and scope of the problem?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Class Responsibilities',
    description:
      'Are class responsibilities well-defined? Does each class have a clear, single purpose?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Coupling & Cohesion',
    description:
      'Are classes appropriately independent? Are related behaviors grouped together?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Encapsulation & Interfaces',
    description:
      'Are internal details hidden? Are public contracts defined clearly via interfaces or abstract classes?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Abstraction & Design Patterns',
    description:
      'Are abstractions meaningful and justified? Are design patterns applied correctly and appropriately?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Extensibility',
    description:
      'Can the design accommodate common future changes without major rewrites? Is it open for extension?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Edge Cases & Testability',
    description:
      'Are important edge cases identified and addressed? Is the design easy to unit test?',
    weight: 1,
    maxScore: 10,
  },
  {
    name: 'Design Explanation & Trade-offs',
    description:
      'Does the learner explain WHY decisions were made? Are trade-offs acknowledged and discussed?',
    weight: 1,
    maxScore: 10,
  },
];

/**
 * Calculate overall score from criteria array.
 * overallScore = weighted mean of all criteria scores, rounded to 1 decimal.
 */
const calculateOverallScore = (criteria) => {
  if (!criteria || criteria.length === 0) return 0;
  const totalWeight = RUBRIC.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = criteria.reduce((sum, c) => {
    const rubricItem = RUBRIC.find((r) => r.name === c.name);
    const weight = rubricItem ? rubricItem.weight : 1;
    return sum + c.score * weight;
  }, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
};

module.exports = { RUBRIC, calculateOverallScore };
