import { Router } from 'express'
import { authAdmin } from '../middleware/auth.js'
import {
  getStudents, createStudent, updateStudent, deleteStudent,
} from '../controllers/studentController.js'

const router = Router()

router.get('/', authAdmin, getStudents)
router.post('/', authAdmin, createStudent)
router.put('/:id', authAdmin, updateStudent)
router.delete('/:id', authAdmin, deleteStudent)

export default router
