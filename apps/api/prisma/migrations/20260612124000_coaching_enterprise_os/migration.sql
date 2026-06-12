-- Coaching Center Operating System schema

CREATE TYPE "CoachingStreamKey" AS ENUM ('SCHOOLING', 'JEE', 'NEET', 'CIVIL_SERVICES', 'SSC');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "StaffProfile" ADD COLUMN IF NOT EXISTS "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "key" "CoachingStreamKey" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomNumber" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "daysOfWeek" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BatchEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BatchEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BatchStaff" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchStaff_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "paidAmountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "courseName" TEXT;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "installmentIndex" INTEGER;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "installmentTotal" INTEGER;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "installmentGroupId" TEXT;

CREATE UNIQUE INDEX "Stream_businessId_key_key" ON "Stream"("businessId", "key");
CREATE INDEX "Stream_businessId_idx" ON "Stream"("businessId");
CREATE INDEX "Course_businessId_idx" ON "Course"("businessId");
CREATE INDEX "Course_streamId_idx" ON "Course"("streamId");
CREATE INDEX "Batch_businessId_idx" ON "Batch"("businessId");
CREATE INDEX "Batch_courseId_idx" ON "Batch"("courseId");
CREATE INDEX "Batch_businessId_roomNumber_idx" ON "Batch"("businessId", "roomNumber");
CREATE UNIQUE INDEX "BatchEnrollment_studentId_batchId_key" ON "BatchEnrollment"("studentId", "batchId");
CREATE INDEX "BatchEnrollment_studentId_idx" ON "BatchEnrollment"("studentId");
CREATE INDEX "BatchEnrollment_batchId_idx" ON "BatchEnrollment"("batchId");
CREATE UNIQUE INDEX "BatchStaff_batchId_staffId_key" ON "BatchStaff"("batchId", "staffId");
CREATE INDEX "BatchStaff_staffId_idx" ON "BatchStaff"("staffId");
CREATE INDEX "FeeRecord_installmentGroupId_idx" ON "FeeRecord"("installmentGroupId");

ALTER TABLE "Stream" ADD CONSTRAINT "Stream_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchEnrollment" ADD CONSTRAINT "BatchEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchEnrollment" ADD CONSTRAINT "BatchEnrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchStaff" ADD CONSTRAINT "BatchStaff_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchStaff" ADD CONSTRAINT "BatchStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
