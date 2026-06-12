-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateTable
CREATE TABLE "BusinessSubcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isOther" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationRedemption" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivationRedemption_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "subcategoryId" TEXT,
ADD COLUMN "customSpecialization" TEXT,
ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "planExpiresAt" TIMESTAMP(3),
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredByBusinessId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSubcategory_categoryId_key_key" ON "BusinessSubcategory"("categoryId", "key");

-- CreateIndex
CREATE INDEX "BusinessSubcategory_categoryId_idx" ON "BusinessSubcategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- CreateIndex
CREATE INDEX "ActivationCode_isActive_expiresAt_idx" ON "ActivationCode"("isActive", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationRedemption_codeId_businessId_key" ON "ActivationRedemption"("codeId", "businessId");

-- CreateIndex
CREATE INDEX "ActivationRedemption_businessId_idx" ON "ActivationRedemption"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_referralCode_key" ON "Business"("referralCode");

-- AddForeignKey
ALTER TABLE "BusinessSubcategory" ADD CONSTRAINT "BusinessSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "BusinessSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_referredByBusinessId_fkey" FOREIGN KEY ("referredByBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRedemption" ADD CONSTRAINT "ActivationRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ActivationCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationRedemption" ADD CONSTRAINT "ActivationRedemption_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
