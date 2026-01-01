-- Add soft delete tracking
ALTER TABLE "Evaluation"
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- Indexes to support filtering and listing
CREATE INDEX "Evaluation_deletedAt_idx" ON "Evaluation"("deletedAt");
CREATE INDEX "Evaluation_ownerUserId_idx" ON "Evaluation"("ownerUserId");
CREATE INDEX "Evaluation_organizationId_idx" ON "Evaluation"("organizationId");

-- Track who performed the deletion
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
