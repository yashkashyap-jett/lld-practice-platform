const ProblemModel = require('../models/ProblemModel');

/**
 * ProblemService — manages problem retrieval.
 *
 * Problems are read-only (seeded, no admin panel in MVP).
 * Business rule: problems are always returned sorted by difficulty.
 */
class ProblemService {
  async getAllProblems() {
    const order = { Easy: 1, Medium: 2, Hard: 3 };
    const problems = await ProblemModel.find({}).lean();
    return problems.sort((a, b) => (order[a.difficulty] || 99) - (order[b.difficulty] || 99));
  }

  async getProblemById(id) {
    const problem = await ProblemModel.findById(id).lean();
    if (!problem) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }
    return problem;
  }
}

module.exports = new ProblemService();
