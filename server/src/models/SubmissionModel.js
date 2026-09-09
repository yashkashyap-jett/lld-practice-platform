const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true, // one submission per attempt
      index: true,
    },
    // Discriminator field — supports future types: 'diagram', 'code'
    type: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    requirements: { type: String, default: '' },
    assumptions: { type: String, default: '' },
    classes: { type: String, default: '' },
    responsibilities: { type: String, default: '' },
    relationships: { type: String, default: '' },
    interfaces: { type: String, default: '' },
    patterns: { type: String, default: '' },
    edgeCases: { type: String, default: '' },
    explanation: { type: String, default: '' },
    optionalCode: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
