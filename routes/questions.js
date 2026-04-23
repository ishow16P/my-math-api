import { Router } from 'express'
import { authAdmin } from '../middleware/auth.js'
import {
  getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion,
} from '../controllers/questionController.js'

const router = Router()

router.get('/', authAdmin, getQuestions)
router.get('/:id', authAdmin, getQuestion)
router.post('/', authAdmin, createQuestion)
router.put('/:id', authAdmin, updateQuestion)
router.delete('/:id', authAdmin, deleteQuestion)

export default router
