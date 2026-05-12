import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './configs/db.js'
import authRoutes from './routes/auth.js'
import questionRoutes from './routes/questions.js'
import examRoutes from './routes/exam.js'
import submissionRoutes from './routes/submissions.js'
import studentRoutes from './routes/students.js'
import teacherRoutes from './routes/teachers.js'
import analyticsRoutes from './routes/analytics.js'
import uploadRoutes from './routes/upload.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/exam', examRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/upload', express.json({ limit: '10mb' }), uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message)
  process.exit(1)
})
