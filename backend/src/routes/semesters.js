import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { recomputeGpaAndCgpa } from "../utils/gpa.js";

export const semestersRouter = Router();
semestersRouter.use(requireAuth); // every route below requires a logged-in student

// GET /semesters — this student's full timeline, most recent first
semestersRouter.get("/", async (req, res) => {
  const semesters = await prisma.semester.findMany({
    where: { studentId: req.auth.studentId },
    include: { gpaRecord: true, gradeSystem: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: semesters });
});

const createSemesterSchema = z.object({
  session: z.string().min(1),
  term: z.string().min(1),
  gradeSystemId: z.string().min(1),
});

// POST /semesters — create a semester shell to add courses into
semestersRouter.post("/", async (req, res) => {
  const parsed = createSemesterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } });
  }
  const semester = await prisma.semester.create({
    data: { ...parsed.data, studentId: req.auth.studentId },
  });
  res.status(201).json(semester);
});

// GET /semesters/:id — one semester with its courses and GPA
semestersRouter.get("/:id", async (req, res) => {
  const semester = await prisma.semester.findFirst({
    where: { id: req.params.id, studentId: req.auth.studentId }, // scoped to this student, always
    include: { courses: true, gpaRecord: true, gradeSystem: { include: { scales: true } } },
  });
  if (!semester) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Semester not found" } });
  res.json(semester);
});

const addCourseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  unit: z.number().positive(),
  gradeLetter: z.string().optional(),
});

// POST /semesters/:id/courses — add a course line, then recompute GPA + CGPA
// in one place so the two numbers can never drift apart.
semestersRouter.post("/:id/courses", async (req, res) => {
  const parsed = addCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } });
  }

  const semester = await prisma.semester.findFirst({
    where: { id: req.params.id, studentId: req.auth.studentId },
    include: { gradeSystem: { include: { scales: true } } },
  });
  if (!semester) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Semester not found" } });
  if (semester.locked) return res.status(409).json({ error: { code: "CONFLICT", message: "Semester is locked" } });

  const { code, title, unit, gradeLetter } = parsed.data;
  const scale = semester.gradeSystem.scales.find((s) => s.letter === gradeLetter);

  const course = await prisma.courseRecord.create({
    data: {
      semesterId: semester.id,
      code,
      title,
      unit,
      gradeLetter: gradeLetter || null,
      gradePoint: scale ? scale.point : null,
      qualityPoint: scale ? scale.point * unit : null,
    },
  });

  const { gpa, cgpa } = await recomputeGpaAndCgpa(semester.id);
  res.status(201).json({ course, gpa, cgpa });
});

// DELETE /courses/:id is mounted separately below to keep the URL shape
// flat (matches the API design doc) while reusing the same recompute step.
export const coursesRouter = Router();
coursesRouter.use(requireAuth);

coursesRouter.delete("/:id", async (req, res) => {
  const course = await prisma.courseRecord.findUnique({
    where: { id: req.params.id },
    include: { semester: true },
  });
  if (!course || course.semester.studentId !== req.auth.studentId) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Course not found" } });
  }
  await prisma.courseRecord.delete({ where: { id: req.params.id } });
  const { gpa, cgpa } = await recomputeGpaAndCgpa(course.semesterId);
  res.json({ gpa, cgpa });
});
