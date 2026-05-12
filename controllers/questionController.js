import Question from '../models/Question.js'

export async function getQuestions(req, res) {
  try {
    const { level, active } = req.query
    const filter = {}
    if (level) filter.level = level
    if (active !== undefined) filter.isActive = active === 'true'

    // teacher เห็นเฉพาะระดับที่จัดการ
    if (req.user.role === 'teacher' && req.user.managedLevels?.length > 0) {
      if (filter.level) {
        if (!req.user.managedLevels.includes(filter.level)) {
          return res.json([])
        }
      } else {
        filter.level = { $in: req.user.managedLevels }
      }
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 })
    res.json(questions)
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

export async function createQuestion(req, res) {
  try {
    const question = await Question.create(req.body)
    res.status(201).json(question)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function updateQuestion(req, res) {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
