-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxPoint" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GradeSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeScale" (
    "id" TEXT NOT NULL,
    "gradeSystemId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "point" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gradeSystemId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRecord" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit" DOUBLE PRECISION NOT NULL,
    "gradeLetter" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "qualityPoint" DOUBLE PRECISION,

    CONSTRAINT "CourseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpaRecord" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "totalUnits" DOUBLE PRECISION NOT NULL,
    "totalQualityPoints" DOUBLE PRECISION NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpaRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CgpaRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalUnits" DOUBLE PRECISION NOT NULL,
    "totalQualityPoints" DOUBLE PRECISION NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CgpaRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_gradeSystemId_letter_key" ON "GradeScale"("gradeSystemId", "letter");

-- CreateIndex
CREATE INDEX "Semester_studentId_idx" ON "Semester"("studentId");

-- CreateIndex
CREATE INDEX "CourseRecord_semesterId_idx" ON "CourseRecord"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "GpaRecord_semesterId_key" ON "GpaRecord"("semesterId");

-- CreateIndex
CREATE INDEX "CgpaRecord_studentId_idx" ON "CgpaRecord"("studentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeScale" ADD CONSTRAINT "GradeScale_gradeSystemId_fkey" FOREIGN KEY ("gradeSystemId") REFERENCES "GradeSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_gradeSystemId_fkey" FOREIGN KEY ("gradeSystemId") REFERENCES "GradeSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRecord" ADD CONSTRAINT "CourseRecord_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpaRecord" ADD CONSTRAINT "GpaRecord_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CgpaRecord" ADD CONSTRAINT "CgpaRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
