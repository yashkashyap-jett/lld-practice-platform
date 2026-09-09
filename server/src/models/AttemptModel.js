const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'EVALUATING', 'COMPLETED', 'FAILED'],
      default: 'IN_PROGRESS',
    },
    // Session identity: persisted in browser localStorage, sent as header
    sessionId: { type: String, index: true },
    // Retry chain: points to the previous attempt this was created from
    previousAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      default: null,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    evaluatingAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attempt', attemptSchema);
