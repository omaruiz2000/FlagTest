-- Create new enum with desired statuses
CREATE TYPE "EvaluationStatus_new" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- IMPORTANT: drop old default BEFORE changing the column type
ALTER TABLE "Evaluation" ALTER COLUMN "status" DROP DEFAULT;

-- Update existing data while casting to the new enum
ALTER TABLE "Evaluation"
  ALTER COLUMN "status" TYPE "EvaluationStatus_new" USING (
    CASE "status"::text
      WHEN 'ACTIVE' THEN 'OPEN'
      WHEN 'ARCHIVED' THEN 'CLOSED'
      ELSE 'DRAFT'
    END::"EvaluationStatus_new"
  );

-- Align helper flags with the CLOSED state
UPDATE "Evaluation"
SET
  "isClosed" = ("status" = 'CLOSED'),
  "closedAt" = CASE WHEN "status" = 'CLOSED' THEN COALESCE("closedAt", NOW()) ELSE NULL END,
  "closedByUserId" = CASE WHEN "status" = 'CLOSED' THEN "closedByUserId" ELSE NULL END;

-- Replace the old enum with the new one
ALTER TYPE "EvaluationStatus" RENAME TO "EvaluationStatus_old";
ALTER TYPE "EvaluationStatus_new" RENAME TO "EvaluationStatus";
DROP TYPE "EvaluationStatus_old";

-- Keep defaults aligned with the final enum type name
ALTER TABLE "Evaluation" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
