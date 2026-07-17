import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { semestersRouter, coursesRouter } from "./routes/semesters.js";
import { gradeSystemsRouter } from "./routes/gradeSystems.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/semesters", semestersRouter);
app.use("/api/v1/courses", coursesRouter);
app.use("/api/v1/grade-systems", gradeSystemsRouter);
app.use("/api/v1/admin", adminRouter);

// Catch-all error handler — anything that throws inside a route lands here
// instead of crashing the process or leaking a stack trace to the client.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
