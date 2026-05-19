import { Router } from 'express'
import { authStudent, authAdmin } from '../middleware/auth.js'
import {
  getMySubmissions, getAllSubmissions, getSubmission, gradeSubmission, deleteSubmission,
} from '../controllers/submissionController.js'

const router = Router()

// Student routes
router.get('/my', authStudent, getMySubmissions)

// Admin routes
router.get('/', authAdmin, getAllSubmissions)
router.get('/:id', authAdmin, getSubmission)
router.put('/:id/grade', authAdmin, gradeSubmission)
router.delete('/:id', authAdmin, deleteSubmission)

export default router
