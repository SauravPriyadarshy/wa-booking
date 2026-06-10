-- Composite indexes for hot tenant-scoped queries (hub, dashboard, automation crons)
CREATE INDEX IF NOT EXISTS "Appointment_businessId_startAt_status_idx" ON "Appointment"("businessId", "startAt", "status");
CREATE INDEX IF NOT EXISTS "Payment_businessId_verifiedAt_idx" ON "Payment"("businessId", "verifiedAt");
CREATE INDEX IF NOT EXISTS "Lead_businessId_stage_updatedAt_idx" ON "Lead"("businessId", "stage", "updatedAt");
CREATE INDEX IF NOT EXISTS "Customer_businessId_createdAt_idx" ON "Customer"("businessId", "createdAt");
