-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('LIVE', 'DEMO');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "tenantType" "TenantType" NOT NULL DEFAULT 'LIVE';

-- CreateIndex
CREATE INDEX "Business_tenantType_idx" ON "Business"("tenantType");
