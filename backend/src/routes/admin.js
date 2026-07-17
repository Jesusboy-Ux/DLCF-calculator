import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin); // every route below requires an admin token

// GET /admin/students — every student, with their name, email, and current CGPA
adminRouter.get("/students", async (_req, res) => {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { fullName: true, email: true, createdAt: true } },
      cgpaRecords: { orderBy: { computedAt: "desc" }, take: 1 },
    },
  });

  const data = students.map((s) => ({
    id: s.id,
    fullName: s.user.fullName,
    email: s.user.email,
    joined: s.user.createdAt,
    cgpa: s.cgpaRecords[0]?.cgpa ?? 0,
  }));

  res.json({ data });
});

// GET /admin/dashboard — platform-wide stats for the overview cards
adminRouter.get("/dashboard", async (_req, res) => {
  const totalStudents = await prisma.student.count();

  const latestCgpas = await prisma.cgpaRecord.findMany({
    orderBy: { computedAt: "desc" },
    distinct: ["studentId"],
  });

  const cgpaValues = latestCgpas.map((r) => r.cgpa);
  const avgCgpa = cgpaValues.length ? cgpaValues.reduce((a, b) => a + b, 0) / cgpaValues.length : 0;
  const highestCgpa = cgpaValues.length ? Math.max(...cgpaValues) : 0;
  const lowestCgpa = cgpaValues.length ? Math.min(...cgpaValues) : 0;
  const onProbation = cgpaValues.filter((c) => c < 2).length; // adjust threshold as needed

  res.json({
    totalStudents,
    avgCgpa,
    highestCgpa,
    lowestCgpa,
    onProbation,
  });
});
