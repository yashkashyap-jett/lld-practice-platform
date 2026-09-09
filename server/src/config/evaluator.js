/**
 * Evaluator configuration.
 *
 * Selects which Evaluator implementation to use based on the environment.
 * - If GEMINI_API_KEY is set → AIEvaluator
 * - Otherwise              → RuleBasedEvaluator (safe dev/demo fallback)
 *
 * To swap evaluators without touching any service:
 *   Change the logic here or set/unset GEMINI_API_KEY.
 */

const AIEvaluator = require('../evaluators/AIEvaluator');
const RuleBasedEvaluator = require('../evaluators/RuleBasedEvaluator');

const createEvaluator = () => {
  if (process.env.GEMINI_API_KEY) {
    console.log('[Evaluator] Using AIEvaluator (Gemini)');
    return new AIEvaluator();
  }
  console.log('[Evaluator] No GEMINI_API_KEY found — using RuleBasedEvaluator');
  return new RuleBasedEvaluator();
};

// Singleton evaluator instance shared across the app
let _evaluator = null;
const getEvaluator = () => {
  if (!_evaluator) _evaluator = createEvaluator();
  return _evaluator;
};

module.exports = { getEvaluator };
