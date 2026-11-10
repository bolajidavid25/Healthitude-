-- CreateEnum
CREATE TYPE "ComplaintSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'REFERRED_TO_SPECIALIST', 'RESOLVED');

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "severity" "ComplaintSeverity" NOT NULL,
    "duration" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'NEW',
    "assignedDoctor" TEXT,
    "clinicalNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_referenceId_key" ON "Complaint"("referenceId");

-- CreateIndex
CREATE INDEX "Complaint_patientId_idx" ON "Complaint"("patientId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
