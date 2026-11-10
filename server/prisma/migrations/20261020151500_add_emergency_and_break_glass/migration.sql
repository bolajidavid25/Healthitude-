-- CreateEnum
CREATE TYPE "EmergencyCaseStatus" AS ENUM ('ACTIVE', 'RESPONDED', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EmergencyCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "EmergencyCaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "initiatedBy" TEXT NOT NULL,
    "reason" TEXT,
    "responderName" TEXT,
    "responderId" TEXT,
    "responderRole" TEXT,
    "respondedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyAuditLog" (
    "id" TEXT NOT NULL,
    "emergencyCaseId" TEXT,
    "patientId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "justification" TEXT,
    "accessContext" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyCase_caseNumber_key" ON "EmergencyCase"("caseNumber");

-- CreateIndex
CREATE INDEX "EmergencyCase_patientId_idx" ON "EmergencyCase"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyCase_status_idx" ON "EmergencyCase"("status");

-- CreateIndex
CREATE INDEX "EmergencyCase_caseNumber_idx" ON "EmergencyCase"("caseNumber");

-- CreateIndex
CREATE INDEX "EmergencyCase_createdAt_idx" ON "EmergencyCase"("createdAt");

-- CreateIndex
CREATE INDEX "EmergencyAuditLog_patientId_idx" ON "EmergencyAuditLog"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyAuditLog_emergencyCaseId_idx" ON "EmergencyAuditLog"("emergencyCaseId");

-- CreateIndex
CREATE INDEX "EmergencyAuditLog_action_idx" ON "EmergencyAuditLog"("action");

-- CreateIndex
CREATE INDEX "EmergencyAuditLog_createdAt_idx" ON "EmergencyAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "EmergencyCase" ADD CONSTRAINT "EmergencyCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAuditLog" ADD CONSTRAINT "EmergencyAuditLog_emergencyCaseId_fkey" FOREIGN KEY ("emergencyCaseId") REFERENCES "EmergencyCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
