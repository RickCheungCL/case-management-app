/*
  Warnings:

  - Added the required column `wattage` to the `OnSiteExistingProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OnSiteExistingProduct" ADD COLUMN     "wattage" INTEGER NOT NULL;
