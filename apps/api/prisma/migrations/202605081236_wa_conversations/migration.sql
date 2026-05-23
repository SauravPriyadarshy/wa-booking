-- This migration is intentionally scoped to the WhatsApp Shared Inbox foundation.
-- It must be safe to run against an existing production schema.

DO $$
BEGIN
  CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerId" TEXT,
  "phone" TEXT,
  "name" TEXT,
  "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
  "assignedToStaffId" TEXT,
  "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastMessageAt" TIMESTAMP(3),
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "waMessageId" TEXT,
  "direction" "MessageDirection" NOT NULL,
  "body" TEXT NOT NULL,
  "status" "MessageStatus" NOT NULL DEFAULT 'RECEIVED',
  "sentAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Conversation_businessId_updatedAt_idx" ON "Conversation"("businessId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Conversation_businessId_lastMessageAt_idx" ON "Conversation"("businessId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_businessId_status_idx" ON "Conversation"("businessId", "status");
CREATE INDEX IF NOT EXISTS "Conversation_businessId_phone_idx" ON "Conversation"("businessId", "phone");
CREATE INDEX IF NOT EXISTS "Conversation_customerId_idx" ON "Conversation"("customerId");

CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_businessId_phone_key" ON "Conversation"("businessId", "phone");

CREATE UNIQUE INDEX IF NOT EXISTS "Message_waMessageId_key" ON "Message"("waMessageId");
CREATE INDEX IF NOT EXISTS "Message_businessId_receivedAt_idx" ON "Message"("businessId", "receivedAt");
CREATE INDEX IF NOT EXISTS "Message_conversationId_receivedAt_idx" ON "Message"("conversationId", "receivedAt");

DO $$
BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_assignedToStaffId_fkey"
    FOREIGN KEY ("assignedToStaffId") REFERENCES "StaffProfile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Message"
    ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
