import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } });
  }
  const { email, password, fullName } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: "CONFLICT", message: "An account with this email already exists" } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, student: { create: {} } },
      include: { student: true },
    });

    const token = signToken(user);
    res.status(201).json({ accessToken: token, user: publicUser(user) });
  } catch (err) {
    // P2002 = Prisma's "unique constraint violated" — happens if two signup
    // clicks land at nearly the same time. Respond politely instead of crashing.
    if (err.code === "P2002") {
      return res.status(409).json({ error: { code: "CONFLICT", message: "An account with this email already exists" } });
    }
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Registration failed" } });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { student: true } });
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Invalid email or password" } });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Invalid email or password" } });
    }

    const token = signToken(user);
    res.json({ accessToken: token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Login failed" } });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth.userId }, include: { student: true } });
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  res.json(publicUser(user));
});

function signToken(user) {
  return jwt.sign(
    { userId: user.id, studentId: user.student?.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, studentId: user.student?.id };
}