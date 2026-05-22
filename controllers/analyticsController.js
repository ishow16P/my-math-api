import Submission from '../models/Submission.js'
import Student from '../models/Student.js'

// GET /api/analytics/student/:studentId/progress
export async function getStudentProgress(req, res) {
  try {
    const student = await Student.findById(req.params.studentId).select('-password -refreshTokenHash')
    if (!student) return res.status(404).json({ message: 'ไม่พบนักเรียน' })

    // teacher ตรวจสิทธิ์ระดับ
    if (req.user.role === 'teacher') {
      if (!req.user.managedLevels?.includes(student.level)) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงนักเรียนระดับนี้' })
      }
    }

    const submissions = await Submission.find({
      studentId: req.params.studentId,
      status: 'graded',
    }).sort({ createdAt: 1 })

    const first = submissions[0] || null
    const latest = submissions.at(-1) || null

    const history = submissions.map((s) => ({
      _id: s._id,
      level: s.level,
      examType: s.examType,
      totalScore: s.totalScore,
      maxScore: s.maxScore,
      createdAt: s.createdAt,
      gradedAt: s.gradedAt,
      answers: s.answers.map((a) => ({
        scoreGiven: a.scoreGiven,
        step1Score: a.step1Score,
        step2Score: a.step2Score,
        step3Score: a.step3Score,
        step4Score: a.step4Score,
      })),
    }))

    res.json({ student, first, latest, history })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// GET /api/analytics/classroom?level=m1&classroom=1/1
export async function getClassroomScores(req, res) {
  try {
    const { level, classroom } = req.query
    if (!level) return res.status(400).json({ message: 'กรุณาระบุระดับ' })

    // teacher ตรวจสิทธิ์ระดับ
    if (req.user.role === 'teacher') {
      if (!req.user.managedLevels?.includes(level)) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงระดับนี้' })
      }
    }

    const studentFilter = { level }
    if (classroom) studentFilter.classroom = Number(classroom)

    const students = await Student.find(studentFilter).select('-password -refreshTokenHash').sort({ studentId: 1 })
    const studentIds = students.map((s) => s._id)

    const subFilter = { studentId: { $in: studentIds }, status: 'graded' }
    if (req.query.examType) subFilter.examType = req.query.examType

    const submissions = await Submission.find(subFilter).sort({ createdAt: 1 })

    const scoreMap = {}
    for (const sub of submissions) {
      const id = sub.studentId.toString()
      if (!scoreMap[id]) scoreMap[id] = []
      scoreMap[id].push({
        _id: sub._id,
        examType: sub.examType,
        totalScore: sub.totalScore,
        maxScore: sub.maxScore,
        createdAt: sub.createdAt,
        answerScores: (sub.answers || []).map((a) => ({
          total: a.scoreGiven ?? null,
          step1: a.step1Score ?? null,
          step2: a.step2Score ?? null,
          step3: a.step3Score ?? null,
          step4: a.step4Score ?? null,
        })),
      })
    }

    const result = students.map((s) => ({
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      level: s.level,
      classroom: s.classroom,
      submissions: scoreMap[s._id.toString()] || [],
    }))

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// GET /api/analytics/classroom/export?level=m1&classroom=1/1
export async function exportClassroomScores(req, res) {
  try {
    const { level, classroom } = req.query
    if (!level) return res.status(400).json({ message: 'กรุณาระบุระดับ' })

    // teacher ตรวจสิทธิ์ระดับ
    if (req.user.role === 'teacher') {
      if (!req.user.managedLevels?.includes(level)) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงระดับนี้' })
      }
    }

    const studentFilter = { level }
    if (classroom) studentFilter.classroom = Number(classroom)

    const students = await Student.find(studentFilter).select('-password -refreshTokenHash').sort({ studentId: 1 })
    const studentIds = students.map((s) => s._id)

    const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

    const submissions = await Submission.find({
      studentId: { $in: studentIds },
      status: 'graded',
    }).sort({ createdAt: 1 })

    const scoreMap = {}
    for (const sub of submissions) {
      const id = sub.studentId.toString()
      if (!scoreMap[id]) scoreMap[id] = []
      scoreMap[id].push(sub)
    }

    // หา จำนวนข้อสูงสุดจาก submissions
    const numQuestions = submissions.reduce((max, sub) => Math.max(max, sub.answers?.length || 0), 0) || 3

    // สร้าง header: 1.1 1.2 1.3 1.4 ข้อ1 | 2.1 ... | รวม
    const header = ['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ระดับ', 'ห้อง']
    for (let q = 1; q <= numQuestions; q++) {
      header.push(`${q}.1`, `${q}.2`, `${q}.3`, `${q}.4`, `${q}`)
    }
    header.push('รวม')

    const rows = [header]

    students.forEach((s, i) => {
      const subs = scoreMap[s._id.toString()] || []
      const last = subs[subs.length - 1]
      const answers = last?.answers || []

      const row = [
        i + 1,
        s.studentId,
        s.name,
        levelMap[s.level] || s.level,
        s.classroom ? `${s.level.replace('m', '')}/${s.classroom}` : '-',
      ]

      for (let q = 0; q < numQuestions; q++) {
        const ans = answers[q]
        row.push(
          ans?.step1Score ?? '-',
          ans?.step2Score ?? '-',
          ans?.step3Score ?? '-',
          ans?.step4Score ?? '-',
          ans?.scoreGiven ?? '-',
        )
      }

      row.push(last?.totalScore ?? '-')
      rows.push(row)
    })

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const classroomSuffix = classroom ? `-room${classroom}` : ''
    const filename = `classroom-scores-${level}${classroomSuffix}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send('\uFEFF' + csv) // BOM for Excel Thai support
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
