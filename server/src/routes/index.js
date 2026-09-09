const express = require('express');
const ProblemController = require('../controllers/ProblemController');
const AttemptController = require('../controllers/AttemptController');

const router = express.Router();

// ─── Problems ─────────────────────────────────────────────────────────────────
router.get('/problems', ProblemController.list);
router.get('/problems/:id', ProblemController.getById);

// ─── Attempts ─────────────────────────────────────────────────────────────────
router.post('/attempts', AttemptController.create);
router.get('/attempts', AttemptController.list);
router.get('/attempts/:id', AttemptController.getById);

router.post('/attempts/:id/submit', AttemptController.submit);
router.post('/attempts/:id/evaluate', AttemptController.triggerEvaluation);
router.get('/attempts/:id/evaluation', AttemptController.getEvaluation);

module.exports = router;
