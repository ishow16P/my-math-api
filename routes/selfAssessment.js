import { Router } from 'express'
import { authStudent, authAdmin } from '../middleware/auth.js'
import { getSelfAssessment, saveSelfAssessment, getSelfAssessmentByAdmin } from '../controllers/selfAssessmentController.js'

const router = Router()

router.get('/admin/:submissionId', authAdmin, getSelfAssessmentByAdmin)
router.get('/:submissionId', authStudent, getSelfAssessment)
router.post('/:submissionId', authStudent, saveSelfAssessment)

export default router
