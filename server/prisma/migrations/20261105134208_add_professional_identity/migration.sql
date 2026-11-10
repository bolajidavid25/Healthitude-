-- CreateEnum
CREATE TYPE "ProfessionalCategory" AS ENUM ('DOCTOR', 'NURSE', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "ProfessionalVerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfessionalAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "category" "ProfessionalCategory" NOT NULL DEFAULT 'DOCTOR',
    "specialty" TEXT NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "licenceExpiry" DATE NOT NULL,
    "regulatoryBody" TEXT NOT NULL,
    "facility" TEXT NOT NULL,
    "verificationStatus" "ProfessionalVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "accountStatus" "ProfessionalAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "profilePhoto" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalSession" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalVerificationLog" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "fromStatus" "ProfessionalVerificationStatus" NOT NULL,
    "toStatus" "ProfessionalVerificationStatus" NOT NULL,
    "adminId" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_phoneNumber_key" ON "Professional"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_licenceNumber_key" ON "Professional"("licenceNumber");

-- CreateIndex
CREATE INDEX "Professional_email_idx" ON "Professional"("email");

-- CreateIndex
CREATE INDEX "Professional_licenceNumber_idx" ON "Professional"("licenceNumber");

-- CreateIndex
CREATE INDEX "Professional_verificationStatus_idx" ON "Professional"("verificationStatus");

-- CreateIndex
CREATE INDEX "Professional_category_idx" ON "Professional"("category");

-- CreateIndex
CREATE INDEX "Professional_accountStatus_idx" ON "Professional"("accountStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalSession_tokenHash_key" ON "ProfessionalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ProfessionalSession_professionalId_idx" ON "ProfessionalSession"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalSession_tokenHash_idx" ON "ProfessionalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ProfessionalSession_expiresAt_idx" ON "ProfessionalSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalVerificationLog_professionalId_idx" ON "ProfessionalVerificationLog"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalVerificationLog_createdAt_idx" ON "ProfessionalVerificationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ProfessionalSession" ADD CONSTRAINT "ProfessionalSession_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalVerificationLog" ADD CONSTRAINT "ProfessionalVerificationLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
