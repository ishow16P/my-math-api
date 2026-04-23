import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true },
  problemText: { type: String, required: true },
  problemImageUrl: { type: String },
  referenceSolution: { type: String, required: true },
  answer: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Question', questionSchema)
