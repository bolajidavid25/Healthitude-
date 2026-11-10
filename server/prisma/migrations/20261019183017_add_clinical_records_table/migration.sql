-- CreateEnum
CREATE TYPE "ClinicalRecordType" AS ENUM ('DIAGNOSIS', 'VITAL_SIGNS', 'LAB_RESULT', 'TREATMENT_NOTE', 'REFERRAL');

-- CreateTable
CREATE TABLE "ClinicalRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ClinicalRecordType" NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachmentName" TEXT,
    "attachmentUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalRecord_recordNumber_key" ON "ClinicalRecord"("recordNumber");

-- CreateIndex
CREATE INDEX "ClinicalRecord_patientId_idx" ON "ClinicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalRecord_type_idx" ON "ClinicalRecord"("type");

-- CreateIndex
CREATE INDEX "ClinicalRecord_createdAt_idx" ON "ClinicalRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "ClinicalRecord" ADD CONSTRAINT "ClinicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
