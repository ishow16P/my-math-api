import Question from '../models/Question.js'
import Submission from '../models/Submission.js'
import Student from '../models/Student.js'
import ExamConfig from '../models/ExamConfig.js'
import { EXAM_SESSION_CONFIG, EXAM_TYPES } from '../constants/examSessions.js'

export async function getOpenSessions(req, res) {
  try {
    const student = await Student.findById(req.user.id)
    if (!student) return res.status(404).json({ message: 'ไม่พบข้อมูลนักเรียน' })

    const [config, doneSubmissions] = await Promise.all([
      ExamConfig.findOne({ level: student.level }),
      Submission.find({
        studentId: req.user.id,
        status: { $in: ['submitted', 'graded'] },
      }).select('examType'),
    ])

    const doneTypes = new Set(doneSubmissions.map((s) => s.examType))

    const sessions = EXAM_TYPES.map((type) => ({
      type,
      label: EXAM_SESSION_CONFIG[type].label,
      questionCount: EXAM_SESSION_CONFIG[type].questionCount,
      duration: EXAM_SESSION_CONFIG[type].duration,
      isOpen: config?.sessions[type]?.isOpen ?? false,
      isDone: doneTypes.has(type),
    }))

    res.json({ sessions })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function startExam(req, res) {
  try {
    const { level, examType } = req.body

    if (!level || !['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'กรุณาเลือกระดับชั้น' })
    }
    if (!examType || !EXAM_TYPES.includes(examType)) {
      return res.status(400).json({ message: 'ประเภทการสอบไม่ถูกต้อง' })
    }

    const student = await Student.findById(req.user.id)
    if (!student) return res.status(404).json({ message: 'ไม่พบข้อมูลนักเรียน' })
    if (student.level !== level) {
      return res.status(403).json({ message: 'ไม่สามารถทำข้อสอบระดับอื่นได้' })
    }

    // ตรวจ config ว่า session นี้เปิดอยู่ไหม
    const config = await ExamConfig.findOne({ level })
    if (!config || !config.sessions[examType]?.isOpen) {
      return res.status(403).json({ message: 'ยังไม่เปิดให้ทำแบบทดสอบนี้' })
    }

    // ตรวจว่าทำแล้วหรือยัง
    const alreadyDone = await Submission.findOne({
      studentId: req.user.id,
      level,
      examType,
      status: { $in: ['submitted', 'graded'] },
    })
    if (alreadyDone) {
      return res.status(403).json({ message: 'คุณทำแบบทดสอบนี้ไปแล้ว' })
    }

    const sessionMeta = EXAM_SESSION_CONFIG[examType]
    let questions = []

    if (examType === 'pre_test') {
      // ใช้ข้อที่ admin กำหนดไว้
      if (!config.prePostQuestionIds?.length) {
        return res.status(404).json({ message: 'ยังไม่มีข้อสอบสำหรับรอบนี้ กรุณาติดต่อครู' })
      }
      questions = await Question.find({
        _id: { $in: config.prePostQuestionIds },
        isActive: true,
      })
    } else if (examType === 'post_test') {
      // ใช้ข้อเดียวกับ pre_test เลย ไม่สุ่ม
      if (!config.prePostQuestionIds?.length) {
        return res.status(404).json({ message: 'ยังไม่มีข้อสอบสำหรับรอบนี้ กรุณาติดต่อครู' })
      }
      questions = await Question.find({
        _id: { $in: config.prePostQuestionIds },
        isActive: true,
      })
    } else {
      // in_class_1/2/3 — ใช้ข้อที่ admin กำหนด ถ้ายังไม่กำหนดจึงสุ่ม
      const assignedId = config.sessions[examType]?.questionId
      if (assignedId) {
        questions = await Question.find({ _id: assignedId, isActive: true })
      } else {
        questions = await Question.aggregate([
          { $match: { level, isActive: true, pool: { $in: ['in_class', 'any'] } } },
          { $sample: { size: sessionMeta.questionCount } },
        ])
      }
    }

    if (questions.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อสอบในรอบนี้' })
    }

    const submission = await Submission.create({
      studentId: req.user.id,
      level,
      examType,
      status: 'draft',
      maxScore: questions.length,
      answers: questions.map((q) => ({
        questionId: q._id,
        problemSnapshot: q.problemText,
        problemImageSnapshots: q.problemImageUrls || [],
        step1: { inputType: 'text', text: '', imageUrl: '' },
        step2: { inputType: 'text', text: '', imageUrl: '' },
        step3: { inputType: 'text', text: '', imageUrl: '' },
        step4: { inputType: 'text', text: '', imageUrl: '' },
      })),
    })

    res.json({
      submissionId: submission._id,
      examType,
      examLabel: sessionMeta.label,
      duration: sessionMeta.duration,
      questions: questions.map((q) => ({
        _id: q._id,
        problemText: q.problemText,
        problemImageUrls: q.problemImageUrls || [],
      })),
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function saveDraft(req, res) {
  try {
    const submission = await Submission.findById(req.params.id)
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    if (submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }
    if (submission.status !== 'draft') {
      return res.status(400).json({ message: 'ข้อสอบถูกส่งไปแล้ว' })
    }

    submission.answers = req.body.answers
    await submission.save()
    res.json({ message: 'บันทึกแล้ว' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function submitExam(req, res) {
  try {
    const submission = await Submission.findById(req.params.id)
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    if (submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }
    if (submission.status === 'submitted' || submission.status === 'graded') {
      return res.status(400).json({ message: 'ข้อสอบถูกส่งไปแล้ว' })
    }

    submission.answers = req.body.answers
    submission.status = 'submitted'
    await submission.save()

    res.json({
      message: 'ส่งข้อสอบเรียบร้อย รอครูตรวจ',
      submission: {
        _id: submission._id,
        level: submission.level,
        examType: submission.examType,
        status: submission.status,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function forceSubmit(req, res) {
  try {
    const submission = await Submission.findById(req.params.id)
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อสอบ' })
    if (submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }
    if (submission.status === 'submitted' || submission.status === 'graded') {
      return res.json({ message: 'ข้อสอบถูกส่งไปแล้ว' })
    }

    if (req.body.answers) {
      submission.answers = req.body.answers
    }
    submission.status = 'submitted'
    await submission.save()

    res.json({ message: 'บันทึกและส่งข้อสอบเรียบร้อย' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
