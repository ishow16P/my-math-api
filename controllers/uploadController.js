import { uploadToR2 } from '../services/r2Upload.js'

export async function uploadCanvas(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'ไม่พบไฟล์' })
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: 'ไฟล์ใหญ่เกิน 2MB' })
    }

    const url = await uploadToR2(req.file.buffer, req.file.mimetype, 'canvas')
    res.json({ url })
  } catch (error) {
    res.status(500).json({ message: 'อัปโหลดไม่สำเร็จ', error: error.message })
  }
}
