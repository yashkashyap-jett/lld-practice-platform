const mongoose = require('mongoose');

const criterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 10 },
    evidence: { type: String, default: '' },
    concern: { type: String, default: '' },
    suggestion: { type: String, default: '' },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true, // one evaluation per attempt
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'EVALUATING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    overallScore: { type: Number, default: null },
    summary: { type: String, default: '' },
    criteria: [criterionSchema],
    strengths: [{ type: String }],
    priorityImprovements: [{ type: String }],
    evaluatorType: {
      type: String,
      enum: ['ai', 'rule_based'],
      default: null,
    },
    error: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
