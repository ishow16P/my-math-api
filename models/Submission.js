import mongoose from 'mongoose'

const stepSchema = new mongoose.Schema({
  inputType: { type: String, enum: ['text', 'canvas'], default: 'text' },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { _id: false })

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  problemSnapshot: { type: String, required: true },
  problemImageSnapshot: { type: String, default: '' },

  step1: { type: stepSchema, default: () => ({}) },
  step2: { type: stepSchema, default: () => ({}) },
  step3: { type: stepSchema, default: () => ({}) },
  step4: { type: stepSchema, default: () => ({}) },

  scoreGiven: { type: Number, default: 0 },
  step1Score: { type: Number, default: 0 },
  step2Score: { type: Number, default: 0 },
  step3Score: { type: Number, default: 0 },
  step4Score: { type: Number, default: 0 },
  step1Feedback: { type: String, default: '' },
  step2Feedback: { type: String, default: '' },
  step3Feedback: { type: String, default: '' },
  step4Feedback: { type: String, default: '' },
  teacherComment: { type: String, default: '' },
}, { _id: false })

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true },
  status: { type: String, enum: ['draft', 'submitted', 'graded'], default: 'draft' },
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  overallFeedback: { type: String, default: '' },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  gradedAt: { type: Date, default: null },
  answers: [answerSchema],
}, { timestamps: true })

export default mongoose.model('Submission', submissionSchema)
