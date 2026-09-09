const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    constraints: [{ type: String }],
    expectedConsiderations: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Problem', problemSchema);
