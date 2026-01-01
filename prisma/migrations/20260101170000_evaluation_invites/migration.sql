-- CreateTable
CREATE TABLE "EvaluationInvite" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationInvite_evaluationId_idx" ON "EvaluationInvite"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationInvite_code_key" ON "EvaluationInvite"("code");

-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "inviteId" TEXT;

-- CreateIndex
CREATE INDEX "TestSession_inviteId_idx" ON "TestSession"("inviteId");

-- AddForeignKey
ALTER TABLE "EvaluationInvite" ADD CONSTRAINT "EvaluationInvite_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "EvaluationInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
