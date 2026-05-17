import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true },
  problemText: { type: String, required: true },
  problemImageUrl: { type: String },
  referenceSolution: { type: String },
  answer: { type: String },
  isActive: { type: Boolean, default: true },
  stepFeedbacks: {
    step1: [{ type: String }],
    step2: [{ type: String }],
    step3: [{ type: String }],
    step4: [{ type: String }],
  },
}, { timestamps: true })

export default mongoose.model('Question', questionSchema)
