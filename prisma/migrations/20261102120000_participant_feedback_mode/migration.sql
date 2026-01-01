-- CreateEnum
CREATE TYPE "ParticipantFeedbackMode" AS ENUM ('THANK_YOU_ONLY', 'CAMOUFLAGE');

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "participantFeedbackMode" "ParticipantFeedbackMode" NOT NULL DEFAULT 'THANK_YOU_ONLY';
