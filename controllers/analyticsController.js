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
      totalScore: s.totalScore,
      maxScore: s.maxScore,
      createdAt: s.createdAt,
      gradedAt: s.gradedAt,
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
    if (classroom) studentFilter.classroom = classroom

    const students = await Student.find(studentFilter).select('-password -refreshTokenHash').sort({ studentId: 1 })
    const studentIds = students.map((s) => s._id)

    const submissions = await Submission.find({
      studentId: { $in: studentIds },
      status: 'graded',
    }).sort({ createdAt: 1 })

    const scoreMap = {}
    for (const sub of submissions) {
      const id = sub.studentId.toString()
      if (!scoreMap[id]) scoreMap[id] = []
      scoreMap[id].push({ _id: sub._id, totalScore: sub.totalScore, maxScore: sub.maxScore, createdAt: sub.createdAt })
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
    if (classroom) studentFilter.classroom = classroom

    const students = await Student.find(studentFilter).select('-password -refreshTokenHash').sort({ studentId: 1 })
    const studentIds = students.map((s) => s._id)

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

    const rows = [['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ระดับ', 'ห้อง', 'จำนวนครั้งที่สอบ', 'คะแนนครั้งแรก', 'คะแนนล่าสุด', 'วันที่สอบล่าสุด']]

    students.forEach((s, i) => {
      const subs = scoreMap[s._id.toString()] || []
      const first = subs[0]
      const last = subs[subs.length - 1]
      rows.push([
        i + 1,
        s.studentId,
        s.name,
        s.level,
        s.classroom || '-',
        subs.length,
        first ? `${first.totalScore}/${first.maxScore}` : '-',
        last ? `${last.totalScore}/${last.maxScore}` : '-',
        last ? new Date(last.createdAt).toLocaleDateString('th-TH') : '-',
      ])
    })

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const classroomSuffix = classroom ? `-${classroom.replace('/', '-')}` : ''
    const filename = `classroom-scores-${level}${classroomSuffix}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send('\uFEFF' + csv) // BOM for Excel Thai support
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
