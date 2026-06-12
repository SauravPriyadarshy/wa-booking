-- Coaching institutional OS: roster, fee ledger, tests

CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "FeePaymentMode" AS ENUM ('CASH', 'UPI');

ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "feesAmountCents" INTEGER;
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentPhone" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "isFullyPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "paymentMode" "FeePaymentMode";

CREATE TABLE IF NOT EXISTS "CoachingTest" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachingTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TestResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Student_batchId_idx" ON "Student"("batchId");
CREATE INDEX IF NOT EXISTS "Student_businessId_batchId_idx" ON "Student"("businessId", "batchId");
CREATE INDEX IF NOT EXISTS "FeeRecord_batchId_month_idx" ON "FeeRecord"("batchId", "month");
CREATE INDEX IF NOT EXISTS "CoachingTest_batchId_testDate_idx" ON "CoachingTest"("batchId", "testDate");
CREATE UNIQUE INDEX IF NOT EXISTS "TestResult_testId_studentId_key" ON "TestResult"("testId", "studentId");
CREATE INDEX IF NOT EXISTS "TestResult_studentId_idx" ON "TestResult"("studentId");
CREATE INDEX IF NOT EXISTS "TestResult_testId_idx" ON "TestResult"("testId");

ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachingTest" ADD CONSTRAINT "CoachingTest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "CoachingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
