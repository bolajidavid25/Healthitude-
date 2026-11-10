-- AlterEnum
ALTER TYPE "ProfessionalVerificationStatus" ADD VALUE IF NOT EXISTS 'VERIFIED_WITH_RESTRICTIONS';
ALTER TYPE "ProfessionalVerificationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "ProfessionalVerificationStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "ProfessionalVerificationStatus" ADD VALUE IF NOT EXISTS 'REVOKED';

-- AlterTable Professional
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "middleName" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "profession" TEXT NOT NULL DEFAULT 'Medical Doctor';
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "specialistQualification" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "qualification" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "institution" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "graduationYear" INTEGER;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "restrictions" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "decisionNotes" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "revalidationDate" DATE;

-- AlterTable ProfessionalVerificationLog
ALTER TABLE "ProfessionalVerificationLog" ADD COLUMN IF NOT EXISTS "action" TEXT;
ALTER TABLE "ProfessionalVerificationLog" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "ProfessionalVerificationLog" ADD COLUMN IF NOT EXISTS "restrictions" TEXT;

-- CreateTable ProfessionalCredentialDocument
CREATE TABLE IF NOT EXISTS "ProfessionalCredentialDocument" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentRef" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalCredentialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProfessionalCredentialDocument_professionalId_idx" ON "ProfessionalCredentialDocument"("professionalId");
CREATE INDEX IF NOT EXISTS "ProfessionalCredentialDocument_documentType_idx" ON "ProfessionalCredentialDocument"("documentType");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProfessionalCredentialDocument_professionalId_fkey'
    ) THEN
        ALTER TABLE "ProfessionalCredentialDocument" ADD CONSTRAINT "ProfessionalCredentialDocument_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
