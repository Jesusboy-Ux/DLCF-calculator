# Running this backend, step by step

This turns the database schema and API design from earlier into a real
server you can start on your own machine. It covers register → login →
create a semester → add a course → watch GPA/CGPA compute automatically.

## 1. Install prerequisites

- **Node.js 20+** — check with `node -v`. Get it from nodejs.org if needed.
- **PostgreSQL** — easiest local option is Postgres.app (Mac) or the
  official installer (Windows/Linux). Alternative: skip installing Postgres
  entirely and use a free hosted database from Neon.tech or Railway.app —
  you just paste their connection string into `.env` in step 3.

## 2. Install dependencies

```bash
cd backend
npm install
```

This reads `package.json` and downloads Express (the web server), Prisma
(the database toolkit), bcryptjs (password hashing), jsonwebtoken (login
tokens), and zod (input validation) into `node_modules`.

## 3. Configure your database connection

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to your Postgres connection string, and
`JWT_SECRET` to a random string (the file tells you a one-line command to
generate one).

## 4. Create the database tables

```bash
npx prisma migrate dev --name init
```

This reads `prisma/schema.prisma` and creates every table (User, Student,
Semester, CourseRecord, GpaRecord, CgpaRecord, GradeSystem) in your
database. Run this again any time you edit `schema.prisma`.

## 5. Seed the default grading scale

```bash
npm run seed
```

This runs `prisma/seed.js`, which inserts the 5.0 grading scale (A=5 … F=0)
so there's something to pick when you create a semester.

## 6. Start the server

```bash
npm run dev
```

You should see `API running on http://localhost:4000`. Leave this running.

## 7. Try it — the full flow with curl

**Register:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"amara@example.com","password":"password123","fullName":"Amara Chukwu"}'
```
Copy the `accessToken` from the response — every request below needs it.

**See the grading scale's ID** (you'll need it to create a semester):
```bash
curl http://localhost:4000/api/v1/grade-systems \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

**Create a semester** (use the `gradeSystemId` from above):
```bash
curl -X POST http://localhost:4000/api/v1/semesters \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"session":"2024/2025","term":"Semester 1","gradeSystemId":"PASTE_ID_HERE"}'
```
Copy the semester `id` from the response.

**Add a course** — this is the interesting one, watch the response:
```bash
curl -X POST http://localhost:4000/api/v1/semesters/PASTE_SEMESTER_ID/courses \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"code":"CSC201","title":"Data Structures","unit":3,"gradeLetter":"A"}'
```
The response includes `gpa` and `cgpa` — computed server-side, in one
transaction, the moment the course was added. Add a second course with a
different grade and call it again to watch both numbers update.

## 8. How the pieces fit together (the pattern to learn)

Every route in `src/routes/` follows the same shape:

1. **Validate the input** with a `zod` schema — `req.body` is never trusted
   as-is (see `addCourseSchema` in `semesters.js`).
2. **Scope the query to the logged-in user** — every `findFirst` includes
   `studentId: req.auth.studentId`. This is what makes it impossible for
   one student to read or edit another's data, even by guessing an ID.
3. **Do the write, then recompute derived numbers** — `recomputeGpaAndCgpa`
   in `src/utils/gpa.js` is the *only* place GPA math happens. Every route
   that changes a course calls it, so the calculator's GPA formula lives in
   exactly one function instead of being copy-pasted everywhere.
4. **`requireAuth` in `middleware/auth.js`** reads the `Authorization`
   header, verifies the JWT, and attaches `req.auth = { userId, studentId }`
   — that's how every route knows *which* student is asking, without a
   database lookup on every request.

To add a new feature (say, the `/predictions/simulate` endpoint from the
API design doc), you'd create `src/routes/predictions.js` following this
same four-step shape, then add one line to `server.js`:
`app.use("/api/v1/predictions", predictionsRouter);`

## 9. Connecting the frontend calculator to this API

Right now the React calculator artifact stores everything in local state
(`useState`), which resets on refresh. To make it real, you'd replace the
`useState(seedSemesters)` with a `fetch` on load:

```js
const res = await fetch("http://localhost:4000/api/v1/semesters", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { data } = await res.json();
```

and replace `updateCourse`/`addCourse` with `POST` calls to
`/semesters/:id/courses` instead of mutating local state directly — the
server response already includes the freshly computed `gpa`/`cgpa`, so you
set that straight into state rather than recalculating in the browser.

## 10. Deploying so it's not just on your laptop

- **Database:** Neon.tech or Railway.app — free tier, gives you a
  `DATABASE_URL` in under a minute.
- **API:** Railway.app or Render.com — connect your GitHub repo, set the
  same environment variables from `.env`, and it builds `npm install` +
  runs `npm start` automatically on every push.
- **Frontend:** Vercel — connect the same repo, it detects a React/Next.js
  app automatically.

## What's still missing

This covers the student auth + GPA flow end to end. Not yet implemented:
admin/school endpoints (they follow the exact pattern in step 8, scoped to
`schoolId` instead of `studentId`), 2FA, OAuth login, PDF/CSV export, and
the predictions endpoints. Happy to build any of those next the same way.
