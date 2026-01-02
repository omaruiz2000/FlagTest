-- Ensure hashing helpers are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the legacy invite reference
ALTER TABLE "TestSession" DROP CONSTRAINT IF EXISTS "TestSession_inviteId_fkey";

-- Create the new Invite table
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "alias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- Migrate existing evaluation invites when present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EvaluationInvite') THEN
    INSERT INTO "Invite" ("id", "evaluationId", "token", "tokenHash", "alias", "createdAt")
    SELECT "id", "evaluationId", "code", encode(digest("code", 'sha256'), 'hex'), "label", "createdAt"
    FROM "EvaluationInvite";
  END IF;
END$$;

-- Clean up the legacy table
DROP TABLE IF EXISTS "EvaluationInvite";

CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");
CREATE INDEX "Invite_evaluationId_idx" ON "Invite"("evaluationId");

ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
