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

