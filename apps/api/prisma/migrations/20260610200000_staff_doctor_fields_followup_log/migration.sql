-- AlterTable StaffProfile: doctor/clinic fields
ALTER TABLE "StaffProfile" ADD COLUMN IF NOT EXISTS "specialization" TEXT;
ALTER TABLE "StaffProfile" ADD COLUMN IF NOT EXISTS "consultationFeeCents" INTEGER;
ALTER TABLE "StaffProfile" ADD COLUMN IF NOT EXISTS "consultationDurationMin" INTEGER NOT NULL DEFAULT 15;

-- CreateTable FollowUpLog
CREATE TABLE IF NOT EXISTS "FollowUpLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FollowUpLog_businessId_customerId_kind_intervalDays_appointmentId_key" ON "FollowUpLog"("businessId", "customerId", "kind", "intervalDays", "appointmentId");
CREATE INDEX IF NOT EXISTS "FollowUpLog_businessId_sentAt_idx" ON "FollowUpLog"("businessId", "sentAt");

ALTER TABLE "FollowUpLog" ADD CONSTRAINT "FollowUpLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
