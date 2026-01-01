/*
  Warnings:

  - A unique constraint covering the columns `[participantTokenHash]` on the table `TestSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "participantTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TestSession_participantTokenHash_key" ON "TestSession"("participantTokenHash");
