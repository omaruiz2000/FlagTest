-- AlterTable
ALTER TABLE "EvaluationTest" ADD COLUMN     "camouflageSetId" TEXT;

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
CREATE INDEX "EvaluationTest_camouflageSetId_idx" ON "EvaluationTest"("camouflageSetId");

-- AddForeignKey
ALTER TABLE "EvaluationTest" ADD CONSTRAINT "EvaluationTest_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamouflageCharacter" ADD CONSTRAINT "CamouflageCharacter_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageOption" ADD CONSTRAINT "TestCamouflageOption_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCamouflageOption" ADD CONSTRAINT "TestCamouflageOption_camouflageSetId_fkey" FOREIGN KEY ("camouflageSetId") REFERENCES "CamouflageSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

