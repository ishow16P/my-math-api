import { Router } from 'express'
import {
  studentLogin,
  adminLogin,
  refreshTokenHandler,
  studentLogout,
  adminLogout,
} from '../controllers/authController.js'
import { authStudent, authAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/student/login', studentLogin)
router.post('/admin/login', adminLogin)
router.post('/refresh', refreshTokenHandler)
router.post('/student/logout', authStudent, studentLogout)
router.post('/admin/logout', authAdmin, adminLogout)

export default router
