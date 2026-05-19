import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: false },
  // ข้อสอบที่ admin กำหนดสำหรับ session นี้ (null = สุ่ม)
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
}, { _id: false })

const examConfigSchema = new mongoose.Schema({
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true, unique: true },
  sessions: {
    pre_test:   { type: sessionSchema, default: () => ({}) },
    in_class_1: { type: sessionSchema, default: () => ({}) },
    in_class_2: { type: sessionSchema, default: () => ({}) },
    in_class_3: { type: sessionSchema, default: () => ({}) },
    post_test:  { type: sessionSchema, default: () => ({}) },
  },
  // Admin กำหนด 2 ข้อสำหรับ pre-test และ post-test (ใช้ชุดเดียวกัน)
  prePostQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true })

export default mongoose.model('ExamConfig', examConfigSchema)
