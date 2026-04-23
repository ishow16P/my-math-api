import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import Student from '../models/Student.js'
import Admin from '../models/Admin.js'

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  })
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function studentLogin(req, res) {
  try {
    const { studentId, password } = req.body
    if (!studentId || !password) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสนักเรียนและรหัสผ่าน' })
    }

    const student = await Student.findOne({ studentId })
    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: 'รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง' })
    }

    const payload = { id: student._id, studentId: student.studentId, role: 'student' }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    student.refreshTokenHash = hashToken(refreshToken)
    await student.save()

    res.json({
      accessToken,
      refreshToken,
      student: {
        studentId: student.studentId,
        name: student.name,
        level: student.level,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
    }

    const admin = await Admin.findOne({ email })
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    const payload = { id: admin._id, email: admin.email, role: admin.role, managedLevels: admin.managedLevels || [] }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    admin.refreshTokenHash = hashToken(refreshToken)
    await admin.save()

    res.json({
      accessToken,
      refreshToken,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        managedLevels: admin.managedLevels || [],
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshTokenHandler(req, res) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ message: 'ไม่พบ refresh token' })
    }

    // ตรวจสอบ JWT signature และ expiry
    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ message: 'Refresh token ไม่ถูกต้องหรือหมดอายุ' })
    }

    const tokenHash = hashToken(refreshToken)

    // ค้นหา user และตรวจสอบ hash ว่าตรงกับใน DB
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id)
      if (!student || student.refreshTokenHash !== tokenHash) {
        return res.status(401).json({ message: 'Refresh token ไม่ถูกต้อง' })
      }

      const payload = { id: student._id, studentId: student.studentId, role: 'student' }
      const newAccessToken = signAccessToken(payload)
      const newRefreshToken = signRefreshToken(payload)

      // Rotate: บันทึก hash ใหม่ invalidate ตัวเก่า
      student.refreshTokenHash = hashToken(newRefreshToken)
      await student.save()

      return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
    }

    if (['teacher', 'superadmin'].includes(decoded.role)) {
      const admin = await Admin.findById(decoded.id)
      if (!admin || admin.refreshTokenHash !== tokenHash) {
        return res.status(401).json({ message: 'Refresh token ไม่ถูกต้อง' })
      }

      const payload = { id: admin._id, email: admin.email, role: admin.role, managedLevels: admin.managedLevels || [] }
      const newAccessToken = signAccessToken(payload)
      const newRefreshToken = signRefreshToken(payload)

      admin.refreshTokenHash = hashToken(newRefreshToken)
      await admin.save()

      return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
    }

    return res.status(401).json({ message: 'Role ไม่ถูกต้อง' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function studentLogout(req, res) {
  try {
    await Student.findByIdAndUpdate(req.user.id, { refreshTokenHash: null })
    res.json({ message: 'ออกจากระบบสำเร็จ' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

export async function adminLogout(req, res) {
  try {
    await Admin.findByIdAndUpdate(req.user.id, { refreshTokenHash: null })
    res.json({ message: 'ออกจากระบบสำเร็จ' })
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}
