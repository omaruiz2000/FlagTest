-- Add attemptKey and lastSeenAt to TestSession
ALTER TABLE "TestSession" ADD COLUMN "attemptKey" TEXT NOT NULL DEFAULT concat('legacy-', md5(random()::text || clock_timestamp()::text));
ALTER TABLE "TestSession" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "TestSession_attemptKey_key" ON "TestSession"("attemptKey");

ALTER TABLE "TestSession" ALTER COLUMN "attemptKey" DROP DEFAULT;
