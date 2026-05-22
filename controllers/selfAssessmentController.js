import SelfAssessment from '../models/SelfAssessment.js'

export async function getSelfAssessmentByAdmin(req, res) {
  try {
    const sa = await SelfAssessment.findOne({ submissionId: req.params.submissionId })
    res.json(sa || null)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function getSelfAssessment(req, res) {
  try {
    const { submissionId } = req.params
    const studentId = req.user.id
    const sa = await SelfAssessment.findOne({ submissionId, studentId })
    res.json(sa || null)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function saveSelfAssessment(req, res) {
  try {
    const { submissionId } = req.params
    const studentId = req.user.id
    const { q1, q2, q3, q4, q5 } = req.body

    const sa = await SelfAssessment.findOneAndUpdate(
      { submissionId, studentId },
      { q1, q2, q3, q4, q5 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.json(sa)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
