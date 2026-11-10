import crypto from "crypto"
import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  CreateComplaintInput,
  UpdateComplaintInput,
} from "../validation/complaint"
import {
  ComplaintStatus,
  ComplaintSeverity,
  NotificationType,
} from "../generated/prisma/enums"
import { createNotification } from "./notificationService"

export interface SafeComplaint {
  id: string
  referenceId: string
  patientId: string
  symptoms: string
  severity: ComplaintSeverity
  duration: string | null
  status: ComplaintStatus
  assignedDoctor: string | null
  clinicalNotes: string | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Generates a human-friendly unique reference ID (e.g. CPL-0041).
 */
async function generateReferenceId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomNum = crypto.randomInt(1000, 9999)
    const ref = `CPL-${randomNum}`
    const existing = await prisma.complaint.findUnique({
      where: { referenceId: ref },
    })
    if (!existing) {
      return ref
    }
  }
  // Fallback to timestamp-based reference
  return `CPL-${Date.now().toString().slice(-4)}`
}

/**
 * Creates a new complaint for the authenticated patient.
 * Status defaults to NEW.
 */
export async function createComplaint(
  patientId: string,
  input: CreateComplaintInput,
): Promise<SafeComplaint> {
  const user = await prisma.user.findUnique({
    where: { id: patientId },
  })
  if (!user) {
    throw AppError.notFound("Patient account not found")
  }

  const referenceId = await generateReferenceId()

  const complaint = await prisma.complaint.create({
    data: {
      referenceId,
      patientId,
      symptoms: input.symptoms,
      severity: input.severity,
      duration: input.duration ?? null,
      status: ComplaintStatus.NEW,
    },
  })

  // Trigger complaint submitted notification (Rule 8, 9, 11)
  await createNotification({
    userId: patientId,
    type: NotificationType.COMPLAINT_SUBMITTED,
    title: "Complaint Submitted",
    message: `Your health complaint ${referenceId} has been submitted for clinical review.`,
    eventId: `evt_cpl_create_${referenceId}`,
    referenceType: "complaint",
    referenceId: referenceId,
    link: "/patient?tab=complaints",
  }).catch((err) =>
    console.error("[Notification] Error creating complaint notification:", err),
  )

  return complaint
}

/**
 * Clinician/system updates complaint status and triggers notification.
 */
export async function updateComplaintStatus(
  complaintIdOrRef: string,
  newStatus: ComplaintStatus,
  clinicalNotes?: string,
  assignedDoctor?: string,
): Promise<SafeComplaint> {
  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [{ id: complaintIdOrRef }, { referenceId: complaintIdOrRef }],
    },
  })
  if (!complaint) throw AppError.notFound("Complaint not found")

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: newStatus,
      ...(clinicalNotes !== undefined && { clinicalNotes }),
      ...(assignedDoctor !== undefined && { assignedDoctor }),
      ...(newStatus === ComplaintStatus.RESOLVED && { resolvedAt: new Date() }),
    },
  })

  await createNotification({
    userId: complaint.patientId,
    type: NotificationType.COMPLAINT_UPDATED,
    title: "Complaint Update",
    message: `Your complaint ${complaint.referenceId} status has changed to ${newStatus}.`,
    eventId: `evt_cpl_status_${complaint.referenceId}_${newStatus}`,
    referenceType: "complaint",
    referenceId: complaint.referenceId,
    link: "/patient?tab=complaints",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating complaint status notification:",
      err,
    ),
  )

  return updated
}

/**
 * Retrieves all complaints submitted by the authenticated patient.
 * Ordered by most recent first.
 */
export async function getPatientComplaints(
  patientId: string,
): Promise<SafeComplaint[]> {
  const complaints = await prisma.complaint.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  })
  return complaints
}

/**
 * Retrieves a single complaint by ID, enforcing patient ownership.
 */
export async function getPatientComplaintById(
  patientId: string,
  complaintIdOrRef: string,
): Promise<SafeComplaint> {
  // Support lookup by UUID id or referenceId (e.g. CPL-0041)
  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [{ id: complaintIdOrRef }, { referenceId: complaintIdOrRef }],
    },
  })

  if (!complaint) {
    throw AppError.notFound("Complaint not found")
  }

  if (complaint.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to view another patient's complaint",
    )
  }

  return complaint
}

/**
 * Updates patient-reported fields of a complaint while it remains in NEW status.
 * Rejects modifications once clinical review has begun (Rule 4).
 */
export async function updatePatientComplaint(
  patientId: string,
  complaintIdOrRef: string,
  input: UpdateComplaintInput,
): Promise<SafeComplaint> {
  const complaint = await getPatientComplaintById(patientId, complaintIdOrRef)

  if (complaint.status !== ComplaintStatus.NEW) {
    throw AppError.badRequest(
      `Cannot edit complaint while status is ${complaint.status}. Once clinical review has commenced, complaints cannot be altered.`,
    )
  }

  const updated = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      ...(input.symptoms ? { symptoms: input.symptoms } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(input.duration !== undefined ? { duration: input.duration } : {}),
    },
  })

  return updated
}

/**
 * Handles patient deletion request.
 * Rule 3: Clinical audit trail preservation prohibits permanent deletion of patient complaints.
 */
export async function deletePatientComplaint(
  patientId: string,
  complaintIdOrRef: string,
): Promise<never> {
  // Verify existence and ownership first (so 404 or 403 is returned appropriately)
  await getPatientComplaintById(patientId, complaintIdOrRef)

  throw AppError.forbidden(
    "Clinical complaints form part of your medical record audit trail and cannot be deleted. If your symptoms have resolved, your doctor will mark the complaint as resolved.",
  )
}
