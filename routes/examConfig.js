import { Router } from 'express'
import { authAdmin } from '../middleware/auth.js'
import { getConfig, updateSessions, updatePrePostQuestions, updateSessionQuestion } from '../controllers/examConfigController.js'

const router = Router()

router.get('/:level', authAdmin, getConfig)
router.put('/:level/sessions', authAdmin, updateSessions)
router.put('/:level/pre-post-questions', authAdmin, updatePrePostQuestions)
router.put('/:level/session-question', authAdmin, updateSessionQuestion)

export default router
