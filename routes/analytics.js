import { Router } from 'express'
import { authAdmin } from '../middleware/auth.js'
import {
  getStudentProgress,
  getClassroomScores,
  exportClassroomScores,
} from '../controllers/analyticsController.js'

const router = Router()

router.get('/student/:studentId/progress', authAdmin, getStudentProgress)
router.get('/classroom/export', authAdmin, exportClassroomScores)
router.get('/classroom', authAdmin, getClassroomScores)

export default router
