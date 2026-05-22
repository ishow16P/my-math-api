import mongoose from 'mongoose'

const selfAssessmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true },
  q1: { type: String, default: '' },
  q2: { type: String, default: '' },
  q3: { type: String, default: '' },
  q4: { type: String, default: '' },
  q5: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('SelfAssessment', selfAssessmentSchema)
