-- Clinic live queue fields on Appointment

DO $$ BEGIN
  CREATE TYPE "BookingType" AS ENUM ('ONLINE', 'WALK_IN', 'PHONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClinicPaymentStatus" AS ENUM ('PENDING', 'PAID_CASH', 'PAID_UPI');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "tokenNumber" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "bookingType" "BookingType" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "queueStatus" "QueueStatus";
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentStatus" "ClinicPaymentStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "Appointment_businessId_staffId_tokenNumber_idx" ON "Appointment"("businessId", "staffId", "tokenNumber");
CREATE INDEX IF NOT EXISTS "Appointment_businessId_staffId_startAt_idx" ON "Appointment"("businessId", "staffId", "startAt");
