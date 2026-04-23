import jwt from 'jsonwebtoken'

export function authStudent(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    if (decoded.role !== 'student') return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' })
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ', detail: err.message })
  }
}

export function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    if (!['teacher', 'superadmin'].includes(decoded.role)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' })
    }
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }
}

export function authSuperAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'เฉพาะ superadmin เท่านั้น' })
    }
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }
}

/**
 * Middleware factory: ตรวจว่า teacher มีสิทธิ์จัดการ level นั้น
 * ใช้กับ query param หรือ body param ที่ชื่อ `level`
 * superadmin ผ่านได้เสมอ
 */
export function checkTeacherLevel(levelSource = 'query') {
  return (req, res, next) => {
    if (req.user.role === 'superadmin') return next()

    const level = levelSource === 'body' ? req.body.level : req.query.level
    if (!level) return next()

    if (!req.user.managedLevels?.includes(level)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์จัดการระดับนี้' })
    }
    next()
  }
}
