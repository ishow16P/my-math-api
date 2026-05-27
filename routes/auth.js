import { Router } from 'express'
import {
  studentLogin,
  adminLogin,
  refreshTokenHandler,
  getStudentMe,
  studentChangePassword,
  studentLogout,
  adminLogout,
} from '../controllers/authController.js'
import { authStudent, authAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/student/login', studentLogin)
router.post('/admin/login', adminLogin)
router.post('/refresh', refreshTokenHandler)
router.get('/student/me', authStudent, getStudentMe)
router.post('/student/change-password', authStudent, studentChangePassword)
router.post('/student/logout', authStudent, studentLogout)
router.post('/admin/logout', authAdmin, adminLogout)

export default router
