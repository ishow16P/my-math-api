import Submission from '../models/Submission.js'
import Question from '../models/Question.js'
import Student from '../models/Student.js'
import { parsePagination, escapeRegex } from '../services/pagination.js'

// Student: get my submissions
export async function getMySubmissions(req, res) {
  try {
    const submissions = await Submission.find({
      studentId: req.user.id,
      status: { $ne: 'draft' },
    }).sort({ createdAt: -1 })
    res.json(submissions)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// Admin: get all submissions
export async function getAllSubmissions(req, res) {
  try {
    const { status, level, page, search } = req.query
    const filter = { status: { $ne: 'draft' } }
    if (status) filter.status = status
    if (level) filter.level = level

    // teacher ดูได้เฉพาะระดับที่จัดการ
    if (req.user.role === 'teacher' && req.user.managedLevels?.length > 0) {
      if (level && req.user.managedLevels.includes(level)) {
        filter.level = level
      } else {
        filter.level = { $in: req.user.managedLevels }
      }
    }

    if (search) {
      const escaped = escapeRegex(search)
      const matchingStudents = await Student.find({
        $or: [
          { studentId: { $regex: escaped, $options: 'i' } },
          { name: { $regex: escaped, $options: 'i' } },
        ],
      }).select('_id').limit(500)
      filter.studentId = { $in: matchingStudents.map((s) => s._id) }
    }

    // ไม่ส่ง page → return array (backward compat กับ dashboard)
    if (!page) {
      const submissions = await Submission.find(filter)
        .populate('studentId', 'studentId name level classroom')
        .populate('gradedBy', 'name email')
        .sort({ createdAt: -1 })
      return res.json(submissions)
    }

    const { pageNum, limitNum, skip } = parsePagination(req.query)
    const [total, data] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.find(filter)
        .populate('studentId', 'studentId name level classroom')
        .populate('gradedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ])
    res.json({ data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// Admin: get single submission
export async function getSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'studentId name level classroom')
      .populate('gradedBy', 'name email')
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })

    // teacher ตรวจสิทธิ์ระดับ
    if (req.user.role === 'teacher') {
      if (!req.user.managedLevels?.includes(submission.level)) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงระดับนี้' })
      }
    }

    const result = submission.toObject()
    const questionIds = result.answers.map((a) => a.questionId)
    const questions = await Question.find({ _id: { $in: questionIds } }).select('stepFeedbacks')
    const qMap = Object.fromEntries(questions.map((q) => [q._id.toString(), q.stepFeedbacks || {}]))
    result.answers = result.answers.map((a) => ({
      ...a,
      stepFeedbacks: qMap[a.questionId.toString()] || {},
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

function applyGradedAnswers(submissionAnswers, gradedAnswers) {
  for (const graded of gradedAnswers) {
    const ans = submissionAnswers.find((a) => a.questionId.toString() === graded.questionId)
    if (!ans) continue
    if (graded.scoreGiven !== undefined) ans.scoreGiven = graded.scoreGiven
    if (graded.step1Score !== undefined) ans.step1Score = graded.step1Score
    if (graded.step2Score !== undefined) ans.step2Score = graded.step2Score
    if (graded.step3Score !== undefined) ans.step3Score = graded.step3Score
    if (graded.step4Score !== undefined) ans.step4Score = graded.step4Score
    if (graded.step1Feedback !== undefined) ans.step1Feedback = graded.step1Feedback
    if (graded.step2Feedback !== undefined) ans.step2Feedback = graded.step2Feedback
    if (graded.step3Feedback !== undefined) ans.step3Feedback = graded.step3Feedback
    if (graded.step4Feedback !== undefined) ans.step4Feedback = graded.step4Feedback
    if (graded.teacherComment !== undefined) ans.teacherComment = graded.teacherComment
  }
}

// Admin/Teacher: grade submission
export async function gradeSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id)
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })

    if (req.user.role === 'teacher' && !req.user.managedLevels?.includes(submission.level)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ตรวจข้อสอบระดับนี้' })
    }

    const { answers, overallFeedback, maxScore } = req.body

    if (Array.isArray(answers)) {
      applyGradedAnswers(submission.answers, answers)
    }

    submission.totalScore = submission.answers.reduce((sum, a) => sum + (a.scoreGiven || 0), 0)
    if (maxScore !== undefined) submission.maxScore = maxScore
    if (overallFeedback !== undefined) submission.overallFeedback = overallFeedback
    submission.status = 'graded'
    submission.gradedBy = req.user.id
    submission.gradedAt = new Date()
    await submission.save()

    res.json({ message: 'ตรวจข้อสอบเรียบร้อย', submission })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
