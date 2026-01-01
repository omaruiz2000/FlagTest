-- Add composite index for ordered listing of tests inside an evaluation
CREATE INDEX "EvaluationTest_evaluationId_sortOrder_idx" ON "EvaluationTest"("evaluationId", "sortOrder");

-- Add composite index for ordered listing of items inside a package
CREATE INDEX "TestPackageItem_testPackageId_sortOrder_idx" ON "TestPackageItem"("testPackageId", "sortOrder");
