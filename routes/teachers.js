import { Router } from 'express'
import { authSuperAdmin } from '../middleware/auth.js'
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacherController.js'

const router = Router()

router.get('/', authSuperAdmin, getTeachers)
router.post('/', authSuperAdmin, createTeacher)
router.put('/:id', authSuperAdmin, updateTeacher)
router.delete('/:id', authSuperAdmin, deleteTeacher)

export default router
