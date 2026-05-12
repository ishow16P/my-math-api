import { Router } from 'express'
import multer from 'multer'
import { authStudent, authAdmin } from '../middleware/auth.js'
import { uploadCanvas, uploadQuestionImage } from '../controllers/uploadController.js'

const imageOnly = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'))
    }
    cb(null, true)
  },
})

const router = Router()

router.post('/canvas', authStudent, imageOnly.single('image'), uploadCanvas)
router.post('/question-image', authAdmin, imageOnly.single('image'), uploadQuestionImage)

export default router
