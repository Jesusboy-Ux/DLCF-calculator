import { prisma } from "../lib/prisma.js";

// Recomputes a semester's GpaRecord from its CourseRecords, then recomputes
// the student's overall CgpaRecord from every semester. Called after any
// course create/update/delete so the two never drift out of sync.
export async function recomputeGpaAndCgpa(semesterId) {
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { courses: true },
  });
  if (!semester) throw new Error("Semester not found");

  let totalUnits = 0;
  let totalQualityPoints = 0;
  for (const c of semester.courses) {
    if (c.gradePoint == null || !c.unit) continue;
    totalUnits += c.unit;
    totalQualityPoints += c.unit * c.gradePoint;
  }
  const gpa = totalUnits ? totalQualityPoints / totalUnits : 0;

  await prisma.gpaRecord.upsert({
    where: { semesterId },
    update: { totalUnits, totalQualityPoints, gpa },
    create: { semesterId, totalUnits, totalQualityPoints, gpa },
  });

  // Roll up every semester for this student into a fresh CGPA snapshot.
  const allSemesters = await prisma.semester.findMany({
    where: { studentId: semester.studentId },
    include: { gpaRecord: true },
  });
  const cgpaUnits = allSemesters.reduce((sum, s) => sum + (s.gpaRecord?.totalUnits || 0), 0);
  const cgpaQp = allSemesters.reduce((sum, s) => sum + (s.gpaRecord?.totalQualityPoints || 0), 0);
  const cgpa = cgpaUnits ? cgpaQp / cgpaUnits : 0;

  await prisma.cgpaRecord.create({
    data: { studentId: semester.studentId, totalUnits: cgpaUnits, totalQualityPoints: cgpaQp, cgpa },
  });

  return { gpa, cgpa };
}
