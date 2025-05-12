-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "projectDetails" TEXT NOT NULL,
    "uploadToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "schoolAddress" TEXT NOT NULL,
    "num2FtLinearHighBay" INTEGER NOT NULL DEFAULT 0,
    "num150WUFOHighBay" INTEGER NOT NULL DEFAULT 0,
    "num240WUFOHighBay" INTEGER NOT NULL DEFAULT 0,
    "num2x2LEDPanel" INTEGER NOT NULL DEFAULT 0,
    "num2x4LEDPanel" INTEGER NOT NULL DEFAULT 0,
    "num1x4LEDPanel" INTEGER NOT NULL DEFAULT 0,
    "num4FtStripLight" INTEGER NOT NULL DEFAULT 0,
    "lightingPurpose" TEXT NOT NULL,
    "facilitiesUsedIn" TEXT NOT NULL,
    "installationService" TEXT NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedViaLink" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "customName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "customName" TEXT,
    "caseId" TEXT NOT NULL,
    "uploadedViaLink" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LightFixtureType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LightFixtureType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFixtureCount" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fixtureTypeId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CaseFixtureCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationDetail" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "ceilingHeight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationDetailTag" (
    "id" TEXT NOT NULL,
    "installationDetailId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "InstallationDetailTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteVisit" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnSiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteVisitRoom" (
    "id" TEXT NOT NULL,
    "onSiteVisitId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "locationTagId" TEXT,
    "lightingIssue" TEXT NOT NULL,
    "customerRequest" TEXT NOT NULL,
    "mountingKitQty" INTEGER NOT NULL,
    "motionSensorQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnSiteVisitRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteVisitPhoto" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnSiteVisitPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteVisitPhotoTagPivot" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "OnSiteVisitPhotoTagPivot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteSuggestedProduct" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OnSiteSuggestedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSiteLocationTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnSiteLocationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnSitePhotoTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnSitePhotoTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LightFixtureType_name_key" ON "LightFixtureType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationDetail_caseId_key" ON "InstallationDetail"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationTag_name_key" ON "InstallationTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnSiteVisit_caseId_key" ON "OnSiteVisit"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "OnSiteLocationTag_name_key" ON "OnSiteLocationTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnSitePhotoTag_name_key" ON "OnSitePhotoTag"("name");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFixtureCount" ADD CONSTRAINT "CaseFixtureCount_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFixtureCount" ADD CONSTRAINT "CaseFixtureCount_fixtureTypeId_fkey" FOREIGN KEY ("fixtureTypeId") REFERENCES "LightFixtureType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationDetail" ADD CONSTRAINT "InstallationDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationDetailTag" ADD CONSTRAINT "InstallationDetailTag_installationDetailId_fkey" FOREIGN KEY ("installationDetailId") REFERENCES "InstallationDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationDetailTag" ADD CONSTRAINT "InstallationDetailTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "InstallationTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisit" ADD CONSTRAINT "OnSiteVisit_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisitRoom" ADD CONSTRAINT "OnSiteVisitRoom_locationTagId_fkey" FOREIGN KEY ("locationTagId") REFERENCES "OnSiteLocationTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisitRoom" ADD CONSTRAINT "OnSiteVisitRoom_onSiteVisitId_fkey" FOREIGN KEY ("onSiteVisitId") REFERENCES "OnSiteVisit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisitPhoto" ADD CONSTRAINT "OnSiteVisitPhoto_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "OnSiteVisitRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisitPhotoTagPivot" ADD CONSTRAINT "OnSiteVisitPhotoTagPivot_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "OnSiteVisitPhoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteVisitPhotoTagPivot" ADD CONSTRAINT "OnSiteVisitPhotoTagPivot_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "OnSitePhotoTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnSiteSuggestedProduct" ADD CONSTRAINT "OnSiteSuggestedProduct_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "OnSiteVisitRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
