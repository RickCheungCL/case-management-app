/*
  Warnings:

  - You are about to drop the column `wattage` on the `OnSiteExistingProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OnSiteExistingProduct" DROP COLUMN "wattage";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wattage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OnSiteExistingProduct" ADD CONSTRAINT "OnSiteExistingProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
