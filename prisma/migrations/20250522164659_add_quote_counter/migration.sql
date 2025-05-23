-- CreateTable
CREATE TABLE "QuoteCounter" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteCounter_caseId_key" ON "QuoteCounter"("caseId");
