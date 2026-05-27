import "dotenv/config";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
import Question from "../models/Question.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/my-math";

const students = []
const admins = [
  {
    email: "teacher@mymath.com",
    password: "admin1234",
    name: "ครูคณิต",
    role: "teacher",
    managedLevels: ["m1", "m2", "m3"],
  },
  {
    email: "admin@mymath.com",
    password: "admin1234",
    name: "ผู้ดูแลระบบ",
    role: "superadmin",
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Student.deleteMany({});
  await Admin.deleteMany({});
  await Question.deleteMany({});

  // Seed
  await Student.create(students);
  console.log("Seeded students");

  await Admin.create(admins);
  console.log("Seeded admins");

  // await Question.insertMany(questions);
  // console.log("Seeded questions");

  console.log("Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
