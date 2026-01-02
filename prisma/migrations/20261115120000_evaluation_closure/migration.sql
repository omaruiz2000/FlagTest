-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedByUserId" TEXT,
ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Evaluation_closedAt_idx" ON "Evaluation"("closedAt");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
