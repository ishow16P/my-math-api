import 'dotenv/config'
import mongoose from 'mongoose'
import Student from '../models/Student.js'
import Admin from '../models/Admin.js'
import Question from '../models/Question.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my-math'

const students = [
  { studentId: 'S0001', password: '1234', name: 'สมชาย ใจดี', level: 'm1' },
  { studentId: 'S0002', password: '1234', name: 'สมหญิง รักเรียน', level: 'm2' },
  { studentId: 'S0003', password: '1234', name: 'สมศักดิ์ เก่งมาก', level: 'm3' },
]

const admins = [
  { email: 'teacher@mymath.com', password: 'admin1234', name: 'ครูคณิต', role: 'teacher' },
  { email: 'admin@mymath.com', password: 'admin1234', name: 'ผู้ดูแลระบบ', role: 'superadmin' },
]

const questions = [
  // ม.1
  { level: 'm1', problemText: 'จงหาค่า x จากสมการ 2x + 5 = 15', referenceSolution: '2x = 15 - 5 = 10, x = 5', answer: 'x = 5' },
  { level: 'm1', problemText: 'จงหา ห.ร.ม. ของ 24 และ 36', referenceSolution: '24 = 2³ × 3, 36 = 2² × 3², ห.ร.ม. = 2² × 3 = 12', answer: '12' },
  { level: 'm1', problemText: 'สี่เหลี่ยมผืนผ้ามีความกว้าง 8 ซม. ยาว 12 ซม. จงหาพื้นที่และเส้นรอบรูป', referenceSolution: 'พื้นที่ = 8 × 12 = 96 ตร.ซม., เส้นรอบรูป = 2(8+12) = 40 ซม.', answer: 'พื้นที่ 96 ตร.ซม., เส้นรอบรูป 40 ซม.' },
  { level: 'm1', problemText: 'จงเรียงลำดับเศษส่วน 3/4, 2/3, 5/6 จากน้อยไปมาก', referenceSolution: '2/3 = 8/12, 3/4 = 9/12, 5/6 = 10/12 ∴ 2/3 < 3/4 < 5/6', answer: '2/3, 3/4, 5/6' },
  { level: 'm1', problemText: 'ร้านค้าลดราคาสินค้า 20% จากราคาเดิม 450 บาท จงหาราคาที่ต้องจ่าย', referenceSolution: 'ส่วนลด = 450 × 20/100 = 90, ราคาจ่าย = 450 - 90 = 360', answer: '360 บาท' },
  { level: 'm1', problemText: 'จงหาค่า 3² + 4² - 5', referenceSolution: '9 + 16 - 5 = 20', answer: '20' },

  // ม.2
  { level: 'm2', problemText: 'จงหาค่า x จากสมการ 3(x - 2) = 2x + 7', referenceSolution: '3x - 6 = 2x + 7, x = 13', answer: 'x = 13' },
  { level: 'm2', problemText: 'สามเหลี่ยมมุมฉากมีด้านประกอบมุมฉากยาว 5 ซม. และ 12 ซม. จงหาด้านตรงข้ามมุมฉาก', referenceSolution: 'c² = 5² + 12² = 25 + 144 = 169, c = 13', answer: '13 ซม.' },
  { level: 'm2', problemText: 'จงแยกตัวประกอบ x² + 7x + 12', referenceSolution: 'หาตัวเลข 2 จำนวนที่คูณกันได้ 12 บวกกันได้ 7 คือ 3 และ 4', answer: '(x + 3)(x + 4)' },
  { level: 'm2', problemText: 'วงกลมมีรัศมี 7 ซม. จงหาพื้นที่และเส้นรอบวง (ใช้ π = 22/7)', referenceSolution: 'พื้นที่ = πr² = 22/7 × 49 = 154, เส้นรอบวง = 2πr = 2 × 22/7 × 7 = 44', answer: 'พื้นที่ 154 ตร.ซม., เส้นรอบวง 44 ซม.' },
  { level: 'm2', problemText: 'ข้อมูลชุดหนึ่ง: 5, 8, 12, 7, 8, 10 จงหาค่าเฉลี่ย มัธยฐาน และฐานนิยม', referenceSolution: 'เฉลี่ย = 50/6 ≈ 8.33, เรียง: 5,7,8,8,10,12 มัธยฐาน = (8+8)/2 = 8, ฐานนิยม = 8', answer: 'เฉลี่ย ≈ 8.33, มัธยฐาน = 8, ฐานนิยม = 8' },
  { level: 'm2', problemText: 'จงทำให้เป็นเศษส่วนอย่างต่ำ: 48/72', referenceSolution: 'ห.ร.ม.(48,72) = 24, 48/72 = 2/3', answer: '2/3' },

  // ม.3
  { level: 'm3', problemText: 'จงแก้สมการ x² - 5x + 6 = 0', referenceSolution: '(x-2)(x-3) = 0, x = 2 หรือ x = 3', answer: 'x = 2, x = 3' },
  { level: 'm3', problemText: 'จงหาค่า sin 30° + cos 60° + tan 45°', referenceSolution: 'sin30° = 1/2, cos60° = 1/2, tan45° = 1 ∴ 1/2 + 1/2 + 1 = 2', answer: '2' },
  { level: 'm3', problemText: 'จงหาพื้นที่ผิวและปริมาตรของทรงกระบอกที่มีรัศมี 5 ซม. สูง 10 ซม. (ใช้ π ≈ 3.14)', referenceSolution: 'พื้นที่ผิว = 2πr(r+h) = 2(3.14)(5)(15) = 471 ตร.ซม., ปริมาตร = πr²h = 3.14(25)(10) = 785 ลบ.ซม.', answer: 'พื้นที่ผิว 471 ตร.ซม., ปริมาตร 785 ลบ.ซม.' },
  { level: 'm3', problemText: 'กำหนดให้ f(x) = 2x² - 3x + 1 จงหาค่า f(3) และ f(-1)', referenceSolution: 'f(3) = 2(9) - 9 + 1 = 10, f(-1) = 2(1) + 3 + 1 = 6', answer: 'f(3) = 10, f(-1) = 6' },
  { level: 'm3', problemText: 'จงแก้ระบบสมการ\n2x + y = 7\nx - y = 2', referenceSolution: 'บวกสมการ: 3x = 9, x = 3, y = 7 - 6 = 1', answer: 'x = 3, y = 1' },
  { level: 'm3', problemText: 'ลำดับเลขคณิต: 3, 7, 11, 15, ... จงหาพจน์ที่ 20 และผลรวม 20 พจน์แรก', referenceSolution: 'a₁ = 3, d = 4, a₂₀ = 3 + 19(4) = 79, S₂₀ = 20/2(3+79) = 820', answer: 'พจน์ที่ 20 = 79, ผลรวม = 820' },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  // Clear existing data
  await Student.deleteMany({})
  await Admin.deleteMany({})
  await Question.deleteMany({})

  // Seed
  await Student.create(students)
  console.log('Seeded students')

  await Admin.create(admins)
  console.log('Seeded admins')

  await Question.insertMany(questions)
  console.log('Seeded questions')

  console.log('Seed complete!')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
