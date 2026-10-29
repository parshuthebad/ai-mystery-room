import mongoose from 'mongoose';
const { Schema } = mongoose;

const schema = new Schema(
  {
    title: String,
    story: String,
    premise: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    suspects: [{ _id: false, id: String, name: String, role: String, description: String, alibi: String }],
    clues: [{ _id: false, id: String, title: String, text: String, discovered: { type: Boolean, default: false } }],
    hints: [{ _id: false, text: String }],
    hintsUsed: { type: Number, default: 0 },
    interrogations: [{ _id: false, suspectId: String, question: String, answer: String }],
    // Never returned unless explicitly selected with '+solution'.
    solution: {
      type: { culpritId: String, explanation: String, supportingClueIds: [String] },
      select: false,
    },
    status: { type: String, enum: ['active', 'solved', 'failed'], default: 'active' },
    accusation: { suspectId: String, correct: Boolean },
    score: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Case', schema);
