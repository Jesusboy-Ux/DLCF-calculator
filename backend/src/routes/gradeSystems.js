import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const gradeSystemsRouter = Router();
gradeSystemsRouter.use(requireAuth);

// GET /grade-systems — list scales a student can pick when creating a semester
gradeSystemsRouter.get("/", async (_req, res) => {
  const systems = await prisma.gradeSystem.findMany({ include: { scales: true } });
  res.json({ data: systems });
});
