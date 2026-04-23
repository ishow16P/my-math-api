import Student from '../models/Student.js'

export async function getStudents(req, res) {
  try {
    const { level, classroom } = req.query
    const filter = {}
    if (level) filter.level = level
    if (classroom) filter.classroom = classroom

    // teacher ดูได้เฉพาะระดับที่จัดการ
    if (req.user.role === 'teacher' && req.user.managedLevels?.length > 0) {
      filter.level = { $in: req.user.managedLevels }
    }

    const students = await Student.find(filter).select('-password -refreshTokenHash').sort({ createdAt: -1 })
    res.json(students)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function createStudent(req, res) {
  try {
    const { studentId, password, name, level, classroom } = req.body
    if (!studentId || !password || !name || !level) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    const existing = await Student.findOne({ studentId })
    if (existing) {
      return res.status(409).json({ message: 'รหัสนักเรียนนี้มีอยู่แล้ว' })
    }
    const student = await Student.create({ studentId, password, name, level, classroom: classroom || '' })
    res.status(201).json({ _id: student._id, studentId: student.studentId, name: student.name, level: student.level, classroom: student.classroom })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function updateStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'ไม่พบนักเรียน' })

    const { name, level, password, classroom } = req.body
    if (name) student.name = name
    if (level) student.level = level
    if (password) student.password = password
    if (classroom !== undefined) student.classroom = classroom
    await student.save()

    res.json({ _id: student._id, studentId: student.studentId, name: student.name, level: student.level, classroom: student.classroom })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function deleteStudent(req, res) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id)
    if (!student) return res.status(404).json({ message: 'ไม่พบนักเรียน' })
    res.json({ message: 'ลบนักเรียนแล้ว' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
