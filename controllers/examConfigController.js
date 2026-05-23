import ExamConfig from '../models/ExamConfig.js'
import Question from '../models/Question.js'
import { EXAM_TYPES } from '../constants/examSessions.js'

// GET /api/exam-config/:level — ดึง config ของ level นั้น (สร้างใหม่ถ้าไม่มี)
export async function getConfig(req, res) {
  try {
    const { level } = req.params
    if (!['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'ระดับชั้นไม่ถูกต้อง' })
    }

    let config = await ExamConfig.findOne({ level })
      .populate('prePostQuestionIds', 'problemText problemImageUrls level')
      .populate('sessions.in_class_1.questionId', 'problemText problemImageUrls level')
      .populate('sessions.in_class_2.questionId', 'problemText problemImageUrls level')
      .populate('sessions.in_class_3.questionId', 'problemText problemImageUrls level')
    if (!config) {
      config = await ExamConfig.create({ level })
    }

    res.json({ config })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// PUT /api/exam-config/:level/sessions — เปิด/ปิด sessions
export async function updateSessions(req, res) {
  try {
    const { level } = req.params
    if (!['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'ระดับชั้นไม่ถูกต้อง' })
    }

    const { sessions } = req.body
    if (!sessions || typeof sessions !== 'object') {
      return res.status(400).json({ message: 'ข้อมูล sessions ไม่ถูกต้อง' })
    }

    let config = await ExamConfig.findOne({ level })
    if (!config) {
      config = new ExamConfig({ level })
    }

    for (const type of EXAM_TYPES) {
      if (sessions[type] !== undefined) {
        config.sessions[type].isOpen = Boolean(sessions[type].isOpen)
      }
    }

    await config.save()
    res.json({ message: 'อัปเดต sessions เรียบร้อย', config })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// PUT /api/exam-config/:level/pre-post-questions — กำหนดข้อสำหรับ pre/post test
export async function updatePrePostQuestions(req, res) {
  try {
    const { level } = req.params
    if (!['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'ระดับชั้นไม่ถูกต้อง' })
    }

    const { questionIds } = req.body
    if (!Array.isArray(questionIds) || questionIds.length !== 2) {
      return res.status(400).json({ message: 'ต้องเลือกข้อสอบ 2 ข้อ' })
    }

    // ตรวจว่า question อยู่ใน level ที่ถูกต้อง
    const questions = await Question.find({ _id: { $in: questionIds }, level, isActive: true })
    if (questions.length !== 2) {
      return res.status(400).json({ message: 'ไม่พบข้อสอบที่เลือก หรือไม่ใช่ระดับนี้' })
    }

    let config = await ExamConfig.findOne({ level })
    if (!config) {
      config = new ExamConfig({ level })
    }

    config.prePostQuestionIds = questionIds
    await config.save()

    res.json({ message: 'กำหนดข้อสอบ pre/post test เรียบร้อย', config })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// PUT /api/exam-config/:level/session-question — กำหนดข้อสำหรับ in_class session
export async function updateSessionQuestion(req, res) {
  try {
    const { level } = req.params
    if (!['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'ระดับชั้นไม่ถูกต้อง' })
    }

    const { sessionType, questionId } = req.body
    const inClassTypes = ['in_class_1', 'in_class_2', 'in_class_3']
    if (!inClassTypes.includes(sessionType)) {
      return res.status(400).json({ message: 'รองรับเฉพาะ in_class_1/2/3' })
    }

    // questionId เป็น null = ล้างค่า (กลับไปสุ่ม)
    if (questionId) {
      const question = await Question.findOne({ _id: questionId, level, isActive: true })
      if (!question) {
        return res.status(400).json({ message: 'ไม่พบข้อสอบที่เลือก หรือไม่ใช่ระดับนี้' })
      }
    }

    let config = await ExamConfig.findOne({ level })
    if (!config) {
      config = new ExamConfig({ level })
    }

    config.sessions[sessionType].questionId = questionId || null
    await config.save()

    res.json({ message: 'กำหนดข้อสอบเรียบร้อย', config })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
