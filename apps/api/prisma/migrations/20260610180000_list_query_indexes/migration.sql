-- List / inbox / enrichment query indexes
CREATE INDEX IF NOT EXISTS "Customer_businessId_updatedAt_idx" ON "Customer"("businessId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Lead_businessId_updatedAt_idx" ON "Lead"("businessId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Lead_businessId_customerId_idx" ON "Lead"("businessId", "customerId");
CREATE INDEX IF NOT EXISTS "SupportTicket_businessId_updatedAt_idx" ON "SupportTicket"("businessId", "updatedAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_businessId_customerId_idx" ON "SupportTicket"("businessId", "customerId");
CREATE INDEX IF NOT EXISTS "Appointment_businessId_customerId_status_startAt_idx" ON "Appointment"("businessId", "customerId", "status", "startAt");
CREATE INDEX IF NOT EXISTS "FeeRecord_studentId_paidAt_idx" ON "FeeRecord"("studentId", "paidAt");
