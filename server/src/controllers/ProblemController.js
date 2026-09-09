const ProblemService = require('../services/ProblemService');

/**
 * Thin controller — delegates all logic to ProblemService.
 */
const ProblemController = {
  async list(req, res, next) {
    try {
      const problems = await ProblemService.getAllProblems();
      res.json({ success: true, data: problems });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const problem = await ProblemService.getProblemById(req.params.id);
      res.json({ success: true, data: problem });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProblemController;
