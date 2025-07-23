/*
  Warnings:

  - A unique constraint covering the columns `[caseId]` on the table `PaybackSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaybackSetting_caseId_key" ON "PaybackSetting"("caseId");
