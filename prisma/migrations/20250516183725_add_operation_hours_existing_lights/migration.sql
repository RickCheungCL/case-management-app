-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "operationDaysPerYear" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "operationHoursPerDay" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OnSiteVisitRoom" ADD COLUMN     "ceilingHeight" INTEGER;

-- CreateTable
CREATE TABLE "OnSiteExistingProduct" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OnSiteExistingProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OnSiteExistingProduct" ADD CONSTRAINT "OnSiteExistingProduct_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "OnSiteVisitRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
