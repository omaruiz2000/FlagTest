-- AlterTable
ALTER TABLE "Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_testDefinitionId_fkey";
ALTER TABLE "Evaluation"
  DROP COLUMN IF EXISTS "testDefinitionId",
  ALTER COLUMN "organizationId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
DROP INDEX IF EXISTS "TestSession_participantTokenHash_key";
CREATE INDEX IF NOT EXISTS "TestSession_participantTokenHash_idx" ON "TestSession"("participantTokenHash");

-- CreateTable
CREATE TABLE IF NOT EXISTS "TestPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "context" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TestPackageItem" (
    "id" TEXT NOT NULL,
    "testPackageId" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvaluationTest" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EvaluationTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TestPackage_slug_key" ON "TestPackage"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "TestPackageItem_testPackageId_testDefinitionId_key" ON "TestPackageItem"("testPackageId", "testDefinitionId");
CREATE INDEX IF NOT EXISTS "TestPackageItem_testDefinitionId_idx" ON "TestPackageItem"("testDefinitionId");
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationTest_evaluationId_testDefinitionId_key" ON "EvaluationTest"("evaluationId", "testDefinitionId");
CREATE INDEX IF NOT EXISTS "EvaluationTest_testDefinitionId_idx" ON "EvaluationTest"("testDefinitionId");

-- AddForeignKey
ALTER TABLE "TestPackageItem" ADD CONSTRAINT "TestPackageItem_testPackageId_fkey" FOREIGN KEY ("testPackageId") REFERENCES "TestPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestPackageItem" ADD CONSTRAINT "TestPackageItem_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
