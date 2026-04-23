import Question from '../models/Question.js'
import Submission from '../models/Submission.js'
import Student from '../models/Student.js'

export async function startExam(req, res) {
  try {
    const { level } = req.body
    if (!level || !['m1', 'm2', 'm3'].includes(level)) {
      return res.status(400).json({ message: 'กรุณาเลือกระดับชั้น' })
    }

    // ตรวจสอบว่านักเรียนทำได้เฉพาะระดับของตนเอง
    const student = await Student.findById(req.user.id)
    if (!student) return res.status(404).json({ message: 'ไม่พบข้อมูลนักเรียน' })
    if (student.level !== level) {
      return res.status(403).json({ message: 'ไม่สามารถทำข้อสอบระดับอื่นได้' })
    }

    // สุ่ม 3 ข้อจากระดับนั้น
    const questions = await Question.aggregate([
      { $match: { level, isActive: true } },
      { $sample: { size: 3 } },
    ])

    if (questions.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อสอบในระดับนี้' })
    }

    const submission = await Submission.create({
      studentId: req.user.id,
      level,
      status: 'draft',
      maxScore: questions.length,
      answers: questions.map((q) => ({
        questionId: q._id,
        problemSnapshot: q.problemText,
        problemImageSnapshot: q.problemImageUrl || '',
        step1: { inputType: 'text', text: '', imageUrl: '' },
        step2: { inputType: 'text', text: '', imageUrl: '' },
        step3: { inputType: 'text', text: '', imageUrl: '' },
        step4: { inputType: 'text', text: '', imageUrl: '' },
      })),
    })

    res.json({
      submissionId: submission._id,
      duration: 3600,
      questions: questions.map((q) => ({
        _id: q._id,
        problemText: q.problemText,
        problemImageUrl: q.problemImageUrl,
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
