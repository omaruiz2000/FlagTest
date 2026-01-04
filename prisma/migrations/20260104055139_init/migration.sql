-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TestSessionStatus" AS ENUM ('CREATED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantFeedbackMode" AS ENUM ('THANK_YOU_ONLY', 'CAMOUFLAGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "participantFeedbackMode" "ParticipantFeedbackMode" NOT NULL DEFAULT 'THANK_YOU_ONLY',
    "organizationId" TEXT,
    "ownerUserId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "alias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "code" TEXT NOT NULL,
    "grade" TEXT,
    "section" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "styleId" TEXT NOT NULL DEFAULT 'classic',
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "status" "TestSessionStatus" NOT NULL DEFAULT 'CREATED',
    "attemptKey" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "participantTokenHash" TEXT,
    "evaluationId" TEXT,
    "inviteId" TEXT,
    "rosterEntryId" TEXT,
    "studentRecordId" TEXT,
    "groupId" TEXT,
    "initiatedById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationRosterEntry" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "grade" TEXT,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationRosterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPackage" (
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
CREATE TABLE "TestPackageItem" (
    "id" TEXT NOT NULL,
    "testPackageId" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTest" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "camouflageSetId" TEXT,

    CONSTRAINT "EvaluationTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamouflageSet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamouflageSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamouflageCharacter" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CamouflageCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCamouflageOption" (
    "id" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "camouflageSetId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestCamouflageOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCamouflageSlot" (
    "id" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestCamouflageSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCamouflageMapping" (
    "id" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "camouflageSetId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "TestCamouflageMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCamouflageCopy" (
    "id" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "camouflageSetId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tips" JSONB,

    CONSTRAINT "TestCamouflageCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "testSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "testSessionId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "organizationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_userId_organizationId_key" ON "OrgMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Evaluation_deletedAt_idx" ON "Evaluation"("deletedAt");

-- CreateIndex
CREATE INDEX "Evaluation_ownerUserId_idx" ON "Evaluation"("ownerUserId");

-- CreateIndex
CREATE INDEX "Evaluation_organizationId_idx" ON "Evaluation"("organizationId");

-- CreateIndex
CREATE INDEX "Evaluation_closedAt_idx" ON "Evaluation"("closedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_evaluationId_idx" ON "Invite"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecord_code_key" ON "StudentRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestDefinition_slug_version_key" ON "TestDefinition"("slug", "version");

-- CreateIndex
CREATE UNIQUE INDEX "TestSession_attemptKey_key" ON "TestSession"("attemptKey");

-- CreateIndex
CREATE INDEX "TestSession_participantTokenHash_idx" ON "TestSession"("participantTokenHash");

-- CreateIndex
CREATE INDEX "TestSession_inviteId_idx" ON "TestSession"("inviteId");

-- CreateIndex
CREATE INDEX "TestSession_rosterEntryId_idx" ON "TestSession"("rosterEntryId");

-- CreateIndex
CREATE INDEX "EvaluationRosterEntry_evaluationId_studentCode_idx" ON "EvaluationRosterEntry"("evaluationId", "studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRosterEntry_evaluationId_studentCode_key" ON "EvaluationRosterEntry"("evaluationId", "studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "TestPackage_slug_key" ON "TestPackage"("slug");

-- CreateIndex
CREATE INDEX "TestPackageItem_testPackageId_sortOrder_idx" ON "TestPackageItem"("testPackageId", "sortOrder");

-- CreateIndex
CREATE INDEX "TestPackageItem_testDefinitionId_idx" ON "TestPackageItem"("testDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestPackageItem_testPackageId_testDefinitionId_key" ON "TestPackageItem"("testPackageId", "testDefinitionId");

-- CreateIndex
CREATE INDEX "EvaluationTest_evaluationId_sortOrder_idx" ON "EvaluationTest"("evaluationId", "sortOrder");

-- CreateIndex
CREATE INDEX "EvaluationTest_testDefinitionId_idx" ON "EvaluationTest"("testDefinitionId");

-- CreateIndex
CREATE INDEX "EvaluationTest_camouflageSetId_idx" ON "EvaluationTest"("camouflageSetId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTest_evaluationId_testDefinitionId_key" ON "EvaluationTest"("evaluationId", "testDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CamouflageSet_slug_key" ON "CamouflageSet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CamouflageCharacter_setId_key_key" ON "CamouflageCharacter"("setId", "key");

-- CreateIndex
CREATE INDEX "TestCamouflageOption_testDefinitionId_idx" ON "TestCamouflageOption"("testDefinitionId");

-- CreateIndex
CREATE INDEX "TestCamouflageOption_camouflageSetId_idx" ON "TestCamouflageOption"("camouflageSetId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCamouflageOption_testDefinitionId_camouflageSetId_key" ON "TestCamouflageOption"("testDefinitionId", "camouflageSetId");

-- CreateIndex
CREATE INDEX "TestCamouflageSlot_testDefinitionId_rank_idx" ON "TestCamouflageSlot"("testDefinitionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "TestCamouflageSlot_testDefinitionId_key_key" ON "TestCamouflageSlot"("testDefinitionId", "key");

-- CreateIndex
CREATE INDEX "TestCamouflageMapping_testDefinitionId_camouflageSetId_idx" ON "TestCamouflageMapping"("testDefinitionId", "camouflageSetId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCamouflageMapping_testDefinitionId_camouflageSetId_slot_key" ON "TestCamouflageMapping"("testDefinitionId", "camouflageSetId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "TestCamouflageCopy_testDefinitionId_camouflageSetId_slotKey_key" ON "TestCamouflageCopy"("testDefinitionId", "camouflageSetId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_testSessionId_questionId_key" ON "Answer"("testSessionId", "questionId");

-- CreateIndex
CREATE INDEX "Score_dimension_idx" ON "Score"("dimension");

-- CreateIndex
CREATE UNIQUE INDEX "Score_testSessionId_dimension_key" ON "Score"("testSessionId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecord" ADD CONSTRAINT "StudentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_rosterEntryId_fkey" FOREIGN KEY ("rosterEntryId") REFERENCES "EvaluationRosterEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_studentRecordId_fkey" FOREIGN KEY ("studentRecordId") REFERENCES "StudentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRosterEntry" ADD CONSTRAINT "EvaluationRosterEntry_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPackageItem" ADD CONSTRAINT "TestPackageItem_testPackageId_fkey" FOREIGN KEY ("testPackageId") REFERENCES "TestPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPackageItem" ADD CONSTRAINT "TestPackageItem_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamouflageCharacter" ADD CONSTRAINT "CamouflageCharacter_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageOption" ADD CONSTRAINT "TestCamouflageOption_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageOption" ADD CONSTRAINT "TestCamouflageOption_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageSlot" ADD CONSTRAINT "TestCamouflageSlot_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageMapping" ADD CONSTRAINT "TestCamouflageMapping_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageMapping" ADD CONSTRAINT "TestCamouflageMapping_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageMapping" ADD CONSTRAINT "TestCamouflageMapping_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CamouflageCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageCopy" ADD CONSTRAINT "TestCamouflageCopy_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageCopy" ADD CONSTRAINT "TestCamouflageCopy_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_testSessionId_fkey" FOREIGN KEY ("testSessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_testSessionId_fkey" FOREIGN KEY ("testSessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
