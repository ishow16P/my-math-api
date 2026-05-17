import Question from '../models/Question.js'
import { parsePagination } from '../services/pagination.js'

export async function getQuestions(req, res) {
  try {
    const { level, active, page } = req.query
    const filter = {}
    if (level) filter.level = level
    if (active !== undefined) filter.isActive = active === 'true'

    // teacher เห็นเฉพาะระดับที่จัดการ
    if (req.user.role === 'teacher' && req.user.managedLevels?.length > 0) {
      if (filter.level) {
        if (!req.user.managedLevels.includes(filter.level)) {
          if (!page) return res.json([])
          const { limitNum } = parsePagination(req.query)
          return res.json({ data: [], pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 } })
        }
      } else {
        filter.level = { $in: req.user.managedLevels }
      }
    }

    // ไม่ส่ง page → return array (backward compat)
    if (!page) {
      const questions = await Question.find(filter).sort({ createdAt: -1 })
      return res.json(questions)
    }

    const { pageNum, limitNum, skip } = parsePagination(req.query)
    const [total, data] = await Promise.all([
      Question.countDocuments(filter),
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ])
    res.json({ data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function getQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id)
    if (!question) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    res.json(question)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

function sanitizeStepFeedbacks(raw) {
  const result = {}
  for (const step of ['step1', 'step2', 'step3', 'step4']) {
    const arr = raw?.[step]
    result[step] = Array.isArray(arr) ? arr.filter(s => typeof s === 'string' && s.trim()) : []
  }
  return result
}

export async function createQuestion(req, res) {
  try {
    const { quickFeedbacks, stepFeedbacks, ...rest } = req.body
    const question = await Question.create({ ...rest, stepFeedbacks: sanitizeStepFeedbacks(stepFeedbacks) })
    res.status(201).json(question)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function updateQuestion(req, res) {
  try {
    const { quickFeedbacks, stepFeedbacks, ...rest } = req.body
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { ...rest, stepFeedbacks: sanitizeStepFeedbacks(stepFeedbacks) },
      { new: true }
    )
    if (!question) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    res.json(question)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function deleteQuestion(req, res) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id)
    if (!question) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    res.json({ message: 'ลบข้อสอบแล้ว' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
