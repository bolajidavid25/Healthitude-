import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import { ClinicalRecordType, NotificationType } from "../generated/prisma/enums"
import { getFilePath } from "./storageService"
import type { CreateClinicalRecordInput } from "../validation/clinicalRecord"
import { createNotification } from "./notificationService"

/**
 * Generates a human-friendly unique clinical record number (e.g., 'REC-4821')
 */
async function generateUniqueRecordNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const candidate = `REC-${randomNum}`
    const existing = await prisma.clinicalRecord.findUnique({
      where: { recordNumber: candidate },
      select: { id: true },
    })
    if (!existing) {
      return candidate
    }
  }
  return `REC-${Date.now().toString().slice(-6)}`
}

/**
 * Retrieves all clinical records for an authenticated patient.
 * Supports optional category filtering.
 */
export async function getPatientClinicalRecords(
  patientId: string,
  filterType?: ClinicalRecordType,
) {
  return prisma.clinicalRecord.findMany({
    where: {
      patientId,
      ...(filterType ? { type: filterType } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

/**
 * Retrieves a single clinical record by UUID or recordNumber, verifying patient ownership.
 * Blocks unauthorized access (IDOR defense) with HTTP 403 Forbidden.
 */
export async function getPatientClinicalRecordById(
  patientId: string,
  recordIdOrNumber: string,
) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      recordIdOrNumber,
    )

  const record = await prisma.clinicalRecord.findFirst({
    where: isUuid
      ? { id: recordIdOrNumber }
      : { recordNumber: recordIdOrNumber },
  })

  if (!record) {
    throw AppError.notFound("Clinical record not found")
  }

  // IDOR Defense: verify record belongs to the requesting patient
  if (record.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to view another patient's clinical record",
    )
  }

  return record
}

/**
 * Creates a verified clinical record (authorized healthcare professional / clinical encounter).
 */
export async function createClinicalRecord(data: CreateClinicalRecordInput) {
  // Confirm patient exists
  const patient = await prisma.user.findUnique({
    where: { id: data.patientId },
    select: { id: true },
  })

  if (!patient) {
    throw AppError.notFound("Patient not found")
  }

  const recordNumber = await generateUniqueRecordNumber()

  const record = await prisma.clinicalRecord.create({
    data: {
      recordNumber,
      patientId: data.patientId,
      type: data.type,
      content: data.content,
      author: data.author,
      authorRole: data.authorRole,
      authorId: data.authorId,
      attachmentName: data.attachmentName,
      attachmentUrl: data.attachmentUrl,
      metadata: data.metadata,
      verified: true,
      verifiedAt: new Date(),
    },
  })

  // Trigger clinical record added notification (Rule 8, 9, 11)
  await createNotification({
    userId: data.patientId,
    type: NotificationType.CLINICAL_RECORD_ADDED,
    title: "New Clinical Record Added",
    message: `${data.author} has added a new clinical record to your file.`,
    eventId: `evt_rec_add_${recordNumber}`,
    referenceType: "clinicalRecord",
    referenceId: recordNumber,
    link: "/patient?tab=records",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating clinical record notification:",
      err,
    ),
  )

  return record
}

/**
 * Retrieves the filesystem path for an attached document, verifying patient ownership.
 */
export async function getClinicalRecordAttachment(
  patientId: string,
  recordIdOrNumber: string,
): Promise<{ filePath: string; attachmentName: string }> {
  const record = await getPatientClinicalRecordById(patientId, recordIdOrNumber)

  if (!record.attachmentUrl) {
    throw AppError.notFound("No attachment found for this clinical record")
  }

  const filePath = await getFilePath("documents", record.attachmentUrl)
  if (!filePath) {
    throw AppError.notFound("Clinical record attachment file not found on disk")
  }

  return {
    filePath,
    attachmentName: record.attachmentName || "clinical_document.pdf",
  }
}

/**
 * Strict policy enforcement: Patients cannot create clinical records.
 */
export function rejectPatientCreateRecord(): never {
  throw AppError.forbidden(
    "Only authorized healthcare professionals can create verified clinical records. Patients may view their records or submit complaints.",
  )
}

/**
 * Strict policy enforcement: Patients cannot edit clinical records.
 */
export function rejectPatientUpdateRecord(): never {
  throw AppError.forbidden(
    "Clinically verified records cannot be edited by patients. Please contact your healthcare provider to request an amendment.",
  )
}

/**
 * Strict policy enforcement: Patients cannot delete clinical records.
 */
export function rejectPatientDeleteRecord(): never {
  throw AppError.forbidden(
    "Clinical records form an immutable legal medical audit trail and cannot be deleted.",
  )
}
