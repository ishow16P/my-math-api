import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true },
  problemText: { type: String, required: true },
  problemImageUrl: { type: String },
  referenceSolution: { type: String },
  answer: { type: String },
  isActive: { type: Boolean, default: true },
  quickFeedbacks: [{ type: String }],
}, { timestamps: true })

export default mongoose.model('Question', questionSchema)
