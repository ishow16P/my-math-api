import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  title: { type: String, enum: ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว', ''], default: '' },
  name: { type: String, required: true },
  level: { type: String, enum: ['m1', 'm2', 'm3'], required: true },
  classroom: { type: Number, default: null },
  refreshTokenHash: { type: String, default: null },
}, { timestamps: true })

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

studentSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('Student', studentSchema)
