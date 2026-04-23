import { Router } from 'express'
import multer from 'multer'
import { authStudent } from '../middleware/auth.js'
import { uploadCanvas } from '../controllers/uploadController.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'))
    }
    cb(null, true)
  },
})

const router = Router()

router.post('/canvas', authStudent, upload.single('image'), uploadCanvas)

export default router
