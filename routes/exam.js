import { Router } from 'express'
import { authStudent } from '../middleware/auth.js'
import { startExam, saveDraft, submitExam, forceSubmit } from '../controllers/examController.js'

const router = Router()

router.post('/start', authStudent, startExam)
router.put('/:id/draft', authStudent, saveDraft)
router.post('/:id/submit', authStudent, submitExam)
router.post('/:id/force-submit', authStudent, forceSubmit)

export default router
