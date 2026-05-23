-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "tokenPrefix" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "RefreshToken_tokenPrefix_idx" ON "RefreshToken"("tokenPrefix");
