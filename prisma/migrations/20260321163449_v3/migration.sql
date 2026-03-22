/*
  Warnings:

  - Added the required column `updatedAt` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StackBundle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tool` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GovernanceCategory" AS ENUM ('BEHAVIOR_POLICY', 'SAFEGUARDING', 'ACADEMIC_POLICY', 'SCHOOL_PHILOSOPHY', 'PARENT_COMMUNICATION', 'INCIDENT_ESCALATION', 'AI_USAGE_POLICY', 'CLASSROOM_OPERATIONS', 'TRANSFORMATION_NOTES', 'OTHER');

-- CreateEnum
CREATE TYPE "GovernanceDocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PackPillar" AS ENUM ('AI_ENABLEMENT', 'INDIVIDUALIZED_LEARNING', 'PROJECTS', 'SEL');

-- CreateEnum
CREATE TYPE "AdoptionStatus" AS ENUM ('RECOMMENDED', 'PLANNING', 'IN_PROGRESS', 'ACTIVE', 'DEFERRED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ToolVisibility" AS ENUM ('INTERNAL_ONLY', 'CONSULTANT_ONLY', 'RECOMMENDABLE', 'SCHOOL_VISIBLE');

-- CreateEnum
CREATE TYPE "ToolMaturity" AS ENUM ('EMERGING', 'PILOT_READY', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "ToolCostTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ToolRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DEFERRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CopilotRecommendationKind" AS ENUM ('BLOCKER', 'NEXT_ACTION', 'BUNDLE', 'PACK', 'TRAINING', 'EXEC_SUMMARY');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GrowthAssetType" AS ENUM ('FAQ', 'DECK_OUTLINE', 'LANDING_PAGE_COPY', 'WEEKLY_UPDATE_TEMPLATE', 'WHATSAPP_TEMPLATE', 'EXPLAINER');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "bundleKey" TEXT,
ADD COLUMN     "packKey" TEXT,
ADD COLUMN     "requestContext" JSONB;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "aiAdoptionGoal" TEXT,
ADD COLUMN     "budgetSensitivity" "ToolCostTier",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "currentTooling" JSONB,
ADD COLUMN     "curriculumNotes" TEXT,
ADD COLUMN     "deviceRatio" TEXT,
ADD COLUMN     "enrollment" INTEGER,
ADD COLUMN     "individualizedLearningGoal" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maturityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nonNegotiables" TEXT,
ADD COLUMN     "projectBasedLearningGoal" TEXT,
ADD COLUMN     "readinessScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "school2Vision" TEXT,
ADD COLUMN     "schoolNotes" TEXT,
ADD COLUMN     "selGoal" TEXT,
ADD COLUMN     "staffCount" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "SchoolTool" ADD COLUMN     "implementationNotes" TEXT,
ADD COLUMN     "recommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StackBundle" ADD COLUMN     "overview" TEXT,
ADD COLUMN     "recommendedRoles" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "category" TEXT,
ADD COLUMN     "connectivityRequirement" "Connectivity",
ADD COLUMN     "costTier" "ToolCostTier" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deviceRequirements" TEXT,
ADD COLUMN     "gradeSuitability" JSONB,
ADD COLUMN     "maturity" "ToolMaturity" NOT NULL DEFAULT 'ESTABLISHED',
ADD COLUMN     "prerequisiteNotes" TEXT,
ADD COLUMN     "providerName" TEXT,
ADD COLUMN     "providerNotes" TEXT,
ADD COLUMN     "recommendedRoles" JSONB,
ADD COLUMN     "regionFit" JSONB,
ADD COLUMN     "riskLevel" "ToolRiskLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "useCase" TEXT,
ADD COLUMN     "visibility" "ToolVisibility" NOT NULL DEFAULT 'SCHOOL_VISIBLE';

-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN     "attestationText" TEXT,
ADD COLUMN     "checklist" JSONB,
ADD COLUMN     "pillar" "PackPillar",
ADD COLUMN     "quiz" JSONB,
ADD COLUMN     "requiredRoles" JSONB,
ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "TransformationPack" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pillar" "PackPillar" NOT NULL,
    "description" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "readinessChecklist" JSONB,
    "implementationMilestones" JSONB,
    "templateResources" JSONB,
    "recommendedToolCategories" JSONB,
    "optionalBundleKeys" JSONB,
    "proofPoints" JSONB,
    "nextActions" JSONB,
    "suggestedTrainingKeys" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransformationPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolPackAdoption" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "status" "AdoptionStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "ownerId" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPackAdoption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolBundleAdoption" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "status" "AdoptionStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "ownerId" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolBundleAdoption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolRecommendation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "recommendedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceDocument" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "GovernanceCategory" NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "GovernanceDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "storagePath" TEXT,
    "body" TEXT NOT NULL,
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceChunk" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "keywordText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceQuery" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "usedFallback" BOOLEAN NOT NULL DEFAULT true,
    "lowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "escalationRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceQuerySource" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "documentId" TEXT,
    "versionId" TEXT,
    "chunkId" TEXT,
    "quote" TEXT,
    "relevance" DOUBLE PRECISION,

    CONSTRAINT "GovernanceQuerySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL DEFAULT 'School 2.0 Copilot Run',
    "readinessScore" INTEGER NOT NULL,
    "maturityScore" INTEGER NOT NULL,
    "maturitySummary" TEXT NOT NULL,
    "blockers" JSONB,
    "nextActions" JSONB,
    "recommendedBundleKeys" JSONB,
    "recommendedPackKeys" JSONB,
    "suggestedTrainingKeys" JSONB,
    "plan30" JSONB,
    "plan60" JSONB,
    "plan90" JSONB,
    "executiveSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotRecommendation" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" "CopilotRecommendationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopilotRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "toolId" TEXT,
    "name" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'PLANNING',
    "seatsPurchased" INTEGER,
    "seatsAssigned" INTEGER,
    "renewalDate" TIMESTAMP(3),
    "costNotes" TEXT,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "implementationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthAsset" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GrowthAssetType" NOT NULL,
    "audience" TEXT,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransformationPack_key_key" ON "TransformationPack"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TransformationPack_slug_key" ON "TransformationPack"("slug");

-- CreateIndex
CREATE INDEX "TransformationPack_pillar_idx" ON "TransformationPack"("pillar");

-- CreateIndex
CREATE INDEX "SchoolPackAdoption_schoolId_status_idx" ON "SchoolPackAdoption"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolPackAdoption_schoolId_packId_key" ON "SchoolPackAdoption"("schoolId", "packId");

-- CreateIndex
CREATE INDEX "SchoolBundleAdoption_schoolId_status_idx" ON "SchoolBundleAdoption"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolBundleAdoption_schoolId_bundleId_key" ON "SchoolBundleAdoption"("schoolId", "bundleId");

-- CreateIndex
CREATE INDEX "ToolRecommendation_schoolId_status_idx" ON "ToolRecommendation"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ToolRecommendation_schoolId_toolId_key" ON "ToolRecommendation"("schoolId", "toolId");

-- CreateIndex
CREATE INDEX "GovernanceDocument_schoolId_category_idx" ON "GovernanceDocument"("schoolId", "category");

-- CreateIndex
CREATE INDEX "GovernanceDocument_schoolId_pinned_idx" ON "GovernanceDocument"("schoolId", "pinned");

-- CreateIndex
CREATE INDEX "GovernanceDocumentVersion_documentId_createdAt_idx" ON "GovernanceDocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceDocumentVersion_documentId_version_key" ON "GovernanceDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "GovernanceChunk_versionId_ordinal_idx" ON "GovernanceChunk"("versionId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceChunk_versionId_ordinal_key" ON "GovernanceChunk"("versionId", "ordinal");

-- CreateIndex
CREATE INDEX "GovernanceQuery_schoolId_createdAt_idx" ON "GovernanceQuery"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "GovernanceQuerySource_queryId_idx" ON "GovernanceQuerySource"("queryId");

-- CreateIndex
CREATE INDEX "CopilotRun_schoolId_createdAt_idx" ON "CopilotRun"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "CopilotRecommendation_schoolId_kind_idx" ON "CopilotRecommendation"("schoolId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_key_key" ON "Vendor"("key");

-- CreateIndex
CREATE INDEX "License_schoolId_status_idx" ON "License"("schoolId", "status");

-- CreateIndex
CREATE INDEX "License_vendorId_idx" ON "License"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthAsset_slug_key" ON "GrowthAsset"("slug");

-- CreateIndex
CREATE INDEX "GrowthAsset_schoolId_type_idx" ON "GrowthAsset"("schoolId", "type");

-- CreateIndex
CREATE INDEX "School_transformationStage_idx" ON "School"("transformationStage");

-- CreateIndex
CREATE INDEX "School_readinessScore_idx" ON "School"("readinessScore");

-- CreateIndex
CREATE INDEX "Tool_visibility_costTier_idx" ON "Tool"("visibility", "costTier");

-- AddForeignKey
ALTER TABLE "SchoolPackAdoption" ADD CONSTRAINT "SchoolPackAdoption_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolPackAdoption" ADD CONSTRAINT "SchoolPackAdoption_packId_fkey" FOREIGN KEY ("packId") REFERENCES "TransformationPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolPackAdoption" ADD CONSTRAINT "SchoolPackAdoption_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBundleAdoption" ADD CONSTRAINT "SchoolBundleAdoption_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "StackBundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBundleAdoption" ADD CONSTRAINT "SchoolBundleAdoption_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolBundleAdoption" ADD CONSTRAINT "SchoolBundleAdoption_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolRecommendation" ADD CONSTRAINT "ToolRecommendation_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolRecommendation" ADD CONSTRAINT "ToolRecommendation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolRecommendation" ADD CONSTRAINT "ToolRecommendation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDocument" ADD CONSTRAINT "GovernanceDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDocument" ADD CONSTRAINT "GovernanceDocument_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDocumentVersion" ADD CONSTRAINT "GovernanceDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GovernanceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDocumentVersion" ADD CONSTRAINT "GovernanceDocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceChunk" ADD CONSTRAINT "GovernanceChunk_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GovernanceDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuery" ADD CONSTRAINT "GovernanceQuery_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuery" ADD CONSTRAINT "GovernanceQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuerySource" ADD CONSTRAINT "GovernanceQuerySource_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "GovernanceQuery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuerySource" ADD CONSTRAINT "GovernanceQuerySource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GovernanceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuerySource" ADD CONSTRAINT "GovernanceQuerySource_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "GovernanceDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceQuerySource" ADD CONSTRAINT "GovernanceQuerySource_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "GovernanceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotRun" ADD CONSTRAINT "CopilotRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotRun" ADD CONSTRAINT "CopilotRun_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotRecommendation" ADD CONSTRAINT "CopilotRecommendation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CopilotRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotRecommendation" ADD CONSTRAINT "CopilotRecommendation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthAsset" ADD CONSTRAINT "GrowthAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthAsset" ADD CONSTRAINT "GrowthAsset_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
