import Admin from '../models/Admin.js'

export async function getTeachers(req, res) {
  try {
    const teachers = await Admin.find({ role: 'teacher' }).select('-password -refreshTokenHash').sort({ createdAt: -1 })
    res.json(teachers)
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function createTeacher(req, res) {
  try {
    const { email, password, name, managedLevels } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    const existing = await Admin.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'อีเมลนี้มีอยู่แล้ว' })
    }
    const teacher = await Admin.create({
      email,
      password,
      name,
      role: 'teacher',
      managedLevels: managedLevels || [],
    })
    res.status(201).json({
      _id: teacher._id,
      email: teacher.email,
      name: teacher.name,
      role: teacher.role,
      managedLevels: teacher.managedLevels,
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function updateTeacher(req, res) {
  try {
    const teacher = await Admin.findById(req.params.id)
    if (!teacher) return res.status(404).json({ message: 'ไม่พบครู' })
    if (teacher.role !== 'teacher') return res.status(400).json({ message: 'ไม่ใช่ teacher account' })

    const { name, password, managedLevels } = req.body
    if (name) teacher.name = name
    if (password) teacher.password = password
    if (managedLevels !== undefined) teacher.managedLevels = managedLevels
    await teacher.save()

    res.json({
      _id: teacher._id,
      email: teacher.email,
      name: teacher.name,
      role: teacher.role,
      managedLevels: teacher.managedLevels,
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function deleteTeacher(req, res) {
  try {
    const teacher = await Admin.findById(req.params.id)
    if (!teacher) return res.status(404).json({ message: 'ไม่พบครู' })
    if (teacher.role !== 'teacher') return res.status(400).json({ message: 'ไม่ใช่ teacher account' })
    await teacher.deleteOne()
    res.json({ message: 'ลบครูแล้ว' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
