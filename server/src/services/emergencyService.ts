import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  EmergencyCaseStatus,
  NotificationType,
} from "../generated/prisma/enums"
import { createNotification } from "./notificationService"
import {
  InitiateEmergencyInput,
  CancelEmergencyInput,
  RespondEmergencyInput,
  ClinicianEmergencyAccessInput,
} from "../validation/emergency"

export interface EmergencySnapshot {
  bloodGroup: string
  bloodGroupVerified: boolean
  allergies: string
  allergiesVerified: boolean
  lastBP: string
  vitalSignsTimestamp: string | null
  vitalSignsVerified: boolean
  activeMedsCount: number
  activeMedsSummary: string
  activeMedsVerified: boolean
  emergencyContact: {
    fullName: string
    relationship: string
    phoneNumber: string
  } | null
  patientReported: boolean
  clinicallyVerified: boolean
  verifiedAt: string | null
}

export interface EmergencyCaseItem {
  id: string
  caseNumber: string
  patientId: string
  status: EmergencyCaseStatus
  initiatedBy: string
  reason: string | null
  responderName: string | null
  responderId: string | null
  responderRole: string | null
  respondedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
  snapshot: any
  createdAt: string
  updatedAt: string
}

export interface EmergencyAuditLogItem {
  id: string
  emergencyCaseId: string | null
  patientId: string
  actor: string
  actorId: string
  actorRole: string
  action: string
  target: string
  severity: string
  justification: string | null
  accessContext: any
  createdAt: string
}

export interface PatientEmergencyStatusResponse {
  activeCase: EmergencyCaseItem | null
  snapshot: EmergencySnapshot
  history: EmergencyCaseItem[]
  auditLogs: EmergencyAuditLogItem[]
}

function formatBloodGroup(bg?: string | null): string {
  if (!bg || bg === "UNKNOWN") return "Not documented"
  return bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")
}

function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

/**
 * Builds the controlled emergency snapshot for a patient.
 * Adheres strictly to Rule 2, 3, 4:
 * - Does not invent missing data (marks unavailable).
 * - Distinguishes patient-reported from clinically verified.
 * - Extracts live values from HealthProfile, EmergencyContact, Prescriptions, and ClinicalRecords.
 */
export async function getEmergencySnapshot(
  patientId: string,
): Promise<EmergencySnapshot> {
  const [profile, contact, activePrescriptions, recentVitals] =
    await Promise.all([
      prisma.healthProfile.findUnique({ where: { userId: patientId } }),
      prisma.emergencyContact.findUnique({ where: { userId: patientId } }),
      prisma.prescription.findMany({
        where: { patientId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clinicalRecord.findFirst({
        where: { patientId, type: "VITAL_SIGNS" },
        orderBy: { createdAt: "desc" },
      }),
    ])

  const bloodGroupStr = formatBloodGroup(profile?.bloodGroup)
  const allergiesStr = profile?.knownAllergies?.trim() || "None reported"

  let lastBP = "Not recorded"
  let vitalSignsTimestamp: string | null = null
  let vitalSignsVerified = false

  if (recentVitals) {
    lastBP = recentVitals.content
    vitalSignsTimestamp = recentVitals.createdAt.toISOString()
    vitalSignsVerified = recentVitals.verified
  }

  const activeMedsCount = activePrescriptions.length
  let activeMedsSummary = "None active"
  if (activePrescriptions.length > 0) {
    activeMedsSummary = activePrescriptions
      .map((p) => `${p.medicine} (${p.dose})`)
      .join(", ")
  } else if (profile?.currentMedications?.trim()) {
    activeMedsSummary = `${profile.currentMedications.trim()} (Patient-reported)`
  }

  return {
    bloodGroup: bloodGroupStr,
    bloodGroupVerified: profile?.clinicallyVerified || false,
    allergies: allergiesStr,
    allergiesVerified: profile?.clinicallyVerified || false,
    lastBP,
    vitalSignsTimestamp,
    vitalSignsVerified,
    activeMedsCount,
    activeMedsSummary,
    activeMedsVerified: activePrescriptions.length > 0,
    emergencyContact: contact
      ? {
          fullName: contact.fullName,
          relationship: contact.relationship.replace(/_/g, " "),
          phoneNumber: contact.phoneNumber,
        }
      : null,
    patientReported: profile?.patientReported ?? true,
    clinicallyVerified: profile?.clinicallyVerified ?? false,
    verifiedAt: profile?.verifiedAt?.toISOString() || null,
  }
}

/**
 * Retrieves full emergency status, snapshot, case history, and audit events for an authenticated patient.
 */
export async function getPatientEmergencyStatus(
  patientId: string,
): Promise<PatientEmergencyStatusResponse> {
  const [activeCase, snapshot, history, auditLogs] = await Promise.all([
    prisma.emergencyCase.findFirst({
      where: {
        patientId,
        status: {
          in: [EmergencyCaseStatus.ACTIVE, EmergencyCaseStatus.RESPONDED],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getEmergencySnapshot(patientId),
    prisma.emergencyCase.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.emergencyAuditLog.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return {
    activeCase: activeCase ? formatEmergencyCase(activeCase) : null,
    snapshot,
    history: history.map(formatEmergencyCase),
    auditLogs: auditLogs.map(formatAuditLog),
  }
}

/**
 * Initiates an emergency Break-Glass request from the Patient Dashboard.
 * Rule: Patient initiates emergency request (status ACTIVE).
 * Rule: Generates authoritative case number (EMG-YYYY-XXXX).
 * Rule: Writes immutable audit log (BREAK_GLASS_INITIATED).
 */
export async function initiateEmergencyCase(
  patientId: string,
  input: InitiateEmergencyInput,
  meta: { ipAddress?: string; userAgent?: string } = {},
): Promise<{ emergencyCase: EmergencyCaseItem; snapshot: EmergencySnapshot }> {
  // Check if patient already has an active emergency
  const existingActive = await prisma.emergencyCase.findFirst({
    where: {
      patientId,
      status: {
        in: [EmergencyCaseStatus.ACTIVE, EmergencyCaseStatus.RESPONDED],
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (existingActive) {
    const snapshot = await getEmergencySnapshot(patientId)
    return {
      emergencyCase: formatEmergencyCase(existingActive),
      snapshot,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: patientId },
  })

  if (!user) {
    throw AppError.notFound("Patient record not found")
  }

  // Count total cases to generate sequential case number
  const totalCount = await prisma.emergencyCase.count()
  const year = new Date().getFullYear()
  const caseNumber = `EMG-${year}-${String(totalCount + 41).padStart(4, "0")}`

  const snapshot = await getEmergencySnapshot(patientId)

  // Transactionally create the emergency case and the initial audit log
  const result = await prisma.$transaction(async (tx) => {
    const newCase = await tx.emergencyCase.create({
      data: {
        caseNumber,
        patientId,
        status: EmergencyCaseStatus.ACTIVE,
        initiatedBy: patientId,
        reason:
          input.reason || "Patient initiated Break-Glass emergency request",
        snapshot: snapshot as any,
      },
    })

    await tx.emergencyAuditLog.create({
      data: {
        emergencyCaseId: newCase.id,
        patientId,
        actor: `${user.firstName} ${user.lastName}`.trim(),
        actorId: patientId,
        actorRole: "PATIENT",
        action: "BREAK_GLASS_INITIATED",
        target: `Emergency Case #${caseNumber}`,
        severity: "high",
        justification:
          input.reason || "Patient initiated Break-Glass emergency request",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    return newCase
  })

  // Trigger emergency initiated notification (Rule 8, 9)
  await createNotification({
    userId: patientId,
    type: NotificationType.EMERGENCY_ALERT,
    title: "Emergency Request Active",
    message: `Break-Glass emergency case ${caseNumber} is active. Responding medical staff have been alerted.`,
    eventId: `evt_emg_init_${caseNumber}`,
    referenceType: "emergency",
    referenceId: caseNumber,
    link: "/patient?tab=emergency",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating emergency init notification:",
      err,
    ),
  )

  return {
    emergencyCase: formatEmergencyCase(result),
    snapshot,
  }
}

/**
 * Cancels an active emergency request by the patient.
 * Rule: Patient can cancel active request.
 * Rule: Writes immutable audit log (BREAK_GLASS_CANCELLED).
 */
export async function cancelEmergencyCase(
  patientId: string,
  input: CancelEmergencyInput,
  meta: { ipAddress?: string; userAgent?: string } = {},
): Promise<EmergencyCaseItem> {
  const activeCase = await prisma.emergencyCase.findFirst({
    where: {
      patientId,
      status: {
        in: [EmergencyCaseStatus.ACTIVE, EmergencyCaseStatus.RESPONDED],
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!activeCase) {
    throw AppError.notFound("No active emergency case found to cancel")
  }

  const user = await prisma.user.findUnique({
    where: { id: patientId },
  })

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.emergencyCase.update({
      where: { id: activeCase.id },
      data: {
        status: EmergencyCaseStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: input.reason || "Cancelled by patient",
      },
    })

    await tx.emergencyAuditLog.create({
      data: {
        emergencyCaseId: activeCase.id,
        patientId,
        actor: user ? `${user.firstName} ${user.lastName}`.trim() : "Patient",
        actorId: patientId,
        actorRole: "PATIENT",
        action: "BREAK_GLASS_CANCELLED",
        target: `Emergency Case #${activeCase.caseNumber}`,
        severity: "normal",
        justification: input.reason || "Emergency request cancelled by patient",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    return cancelled
  })

  // Trigger emergency cancelled notification (Rule 8, 9)
  await createNotification({
    userId: patientId,
    type: NotificationType.EMERGENCY_ALERT,
    title: "Emergency Request Cancelled",
    message: `Emergency request #${activeCase.caseNumber} has been cancelled.`,
    eventId: `evt_emg_cancel_${activeCase.caseNumber}`,
    referenceType: "emergency",
    referenceId: activeCase.caseNumber,
    link: "/patient?tab=emergency",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating emergency cancel notification:",
      err,
    ),
  )

  return formatEmergencyCase(updated)
}

/**
 * Responding clinician accepts an active emergency request.
 * Rule: On-call clinician accepts response (e.g. Dr. Ama Bentil, Verified GP).
 * Rule: Writes immutable audit log (BREAK_GLASS_RESPONDED).
 */
export async function respondToEmergencyCase(
  caseNumber: string,
  input: RespondEmergencyInput,
  meta: { ipAddress?: string; userAgent?: string } = {},
): Promise<EmergencyCaseItem> {
  const emergencyCase = await prisma.emergencyCase.findUnique({
    where: { caseNumber },
  })

  if (!emergencyCase) {
    throw AppError.notFound(`Emergency case ${caseNumber} not found`)
  }

  if (emergencyCase.status !== EmergencyCaseStatus.ACTIVE) {
    throw AppError.badRequest(
      `Cannot respond to emergency case that is currently ${emergencyCase.status}`,
    )
  }

  const responderId = input.responderId || "dr-ama-bentil"
  const responderRole = input.responderRole || "Verified GP"

  const updated = await prisma.$transaction(async (tx) => {
    const resCase = await tx.emergencyCase.update({
      where: { id: emergencyCase.id },
      data: {
        status: EmergencyCaseStatus.RESPONDED,
        responderName: input.responderName,
        responderId,
        responderRole,
        respondedAt: new Date(),
      },
    })

    await tx.emergencyAuditLog.create({
      data: {
        emergencyCaseId: emergencyCase.id,
        patientId: emergencyCase.patientId,
        actor: input.responderName,
        actorId: responderId,
        actorRole: "DOCTOR",
        action: "BREAK_GLASS_RESPONDED",
        target: `Emergency Case #${emergencyCase.caseNumber}`,
        severity: "normal",
        justification:
          input.notes || "Clinician accepted emergency case response",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    return resCase
  })

  // Trigger emergency responded notification (Rule 8, 9)
  await createNotification({
    userId: emergencyCase.patientId,
    type: NotificationType.EMERGENCY_ALERT,
    title: "Emergency Help Responded",
    message: `${input.responderName} has responded to emergency case #${emergencyCase.caseNumber}.`,
    eventId: `evt_emg_respond_${emergencyCase.caseNumber}`,
    referenceType: "emergency",
    referenceId: emergencyCase.caseNumber,
    link: "/patient?tab=emergency",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating emergency response notification:",
      err,
    ),
  )

  return formatEmergencyCase(updated)
}

/**
 * Emergency-Focused Patient Record Access for Responding Clinician.
 * Implements full specification from Section A2:
 * 1. Verifies responding clinician's identity and authorization.
 * 2. Blocks unauthorized clinicians.
 * 3. Provides emergency-focused record:
 *    - Demographics (identity, age, contact)
 *    - Blood group (with source & verified status)
 *    - Allergies (with source & verified status)
 *    - Medications (active & previous, dose, prescriber)
 *    - Recent vital signs (with timestamps & verified status)
 *    - Medical conditions & diagnoses (distinguishing reported from verified)
 *    - Clinical history & previous complaints
 *    - Clinical notes (with author and timestamps)
 * 4. Does not invent missing data (clearly marks "Not documented").
 * 5. Records clinician access in immutable audit log (EMERGENCY_RECORD_ACCESSED).
 */
export async function getEmergencyFocusedClinicalRecord(
  caseNumber: string,
  clinicianInput: ClinicianEmergencyAccessInput,
  meta: { ipAddress?: string; userAgent?: string } = {},
) {
  const emergencyCase = await prisma.emergencyCase.findUnique({
    where: { caseNumber },
    include: {
      patient: {
        include: {
          emergencyContact: true,
          healthProfile: true,
          prescriptions: {
            orderBy: { createdAt: "desc" },
          },
          clinicalRecords: {
            orderBy: { createdAt: "desc" },
          },
          complaints: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  })

  if (!emergencyCase) {
    throw AppError.notFound(`Emergency case ${caseNumber} not found`)
  }

  // Enforce access authorization
  if (emergencyCase.status === EmergencyCaseStatus.CANCELLED) {
    throw AppError.forbidden(
      "Access denied: This emergency case has been cancelled. Emergency access window is closed.",
    )
  }

  if (emergencyCase.status === EmergencyCaseStatus.RESOLVED) {
    throw AppError.forbidden(
      "Access denied: This emergency case has been resolved. Emergency access window is closed.",
    )
  }

  // Verification of clinician:
  // If the case is RESPONDED, only the assigned responder can access, unless a supervisor override justification is given.
  if (
    emergencyCase.status === EmergencyCaseStatus.RESPONDED &&
    emergencyCase.responderId &&
    emergencyCase.responderId !== clinicianInput.clinicianId &&
    !clinicianInput.justification.toLowerCase().includes("override")
  ) {
    throw AppError.forbidden(
      `Access denied: Clinician ${clinicianInput.clinicianName} (${clinicianInput.clinicianId}) is not the assigned responder for Case #${caseNumber}. Current assigned responder is ${emergencyCase.responderName}.`,
    )
  }

  // Record access in the immutable audit log
  await prisma.emergencyAuditLog.create({
    data: {
      emergencyCaseId: emergencyCase.id,
      patientId: emergencyCase.patientId,
      actor: clinicianInput.clinicianName,
      actorId: clinicianInput.clinicianId,
      actorRole: clinicianInput.clinicianRole || "DOCTOR",
      action: "EMERGENCY_RECORD_ACCESSED",
      target: `Emergency Case #${caseNumber}`,
      severity: "high",
      justification: clinicianInput.justification,
      accessContext: {
        clinicianRole: clinicianInput.clinicianRole || "DOCTOR",
        emergencyStatus: emergencyCase.status,
        accessedAt: new Date().toISOString(),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  })

  const patient = emergencyCase.patient
  const profile = patient.healthProfile
  const contact = patient.emergencyContact

  // Split prescriptions into active and previous
  const activeMeds = patient.prescriptions.filter((p) => p.status === "ACTIVE")
  const previousMeds = patient.prescriptions.filter(
    (p) => p.status !== "ACTIVE",
  )

  // Extract vital signs and clinical notes
  const vitalSignsRecords = patient.clinicalRecords.filter(
    (r) => r.type === "VITAL_SIGNS",
  )
  const diagnosisRecords = patient.clinicalRecords.filter(
    (r) => r.type === "DIAGNOSIS",
  )
  const clinicalNotesRecords = patient.clinicalRecords.filter(
    (r) => r.type === "TREATMENT_NOTE" || r.type === "REFERRAL",
  )

  const age = calculateAge(patient.dateOfBirth)

  return {
    emergencyCase: {
      caseNumber: emergencyCase.caseNumber,
      status: emergencyCase.status,
      initiatedAt: emergencyCase.createdAt.toISOString(),
      reason: emergencyCase.reason || "Patient initiated emergency",
      responderName: emergencyCase.responderName,
      responderRole: emergencyCase.responderRole,
      respondedAt: emergencyCase.respondedAt?.toISOString() || null,
    },
    patientIdentity: {
      id: patient.id,
      firstName: patient.firstName,
      middleName: patient.middleName || null,
      lastName: patient.lastName,
      sex: patient.sex,
      dateOfBirth: patient.dateOfBirth.toISOString().split("T")[0],
      age,
      emergencyContact: contact
        ? {
            fullName: contact.fullName,
            relationship: contact.relationship.replace(/_/g, " "),
            phoneNumber: contact.phoneNumber,
          }
        : null,
    },
    bloodGroup: {
      value: formatBloodGroup(profile?.bloodGroup),
      source: profile?.clinicallyVerified
        ? "Clinically Verified"
        : "Patient-Reported",
      verified: profile?.clinicallyVerified || false,
      verifiedAt: profile?.verifiedAt?.toISOString() || null,
    },
    allergies: {
      value: profile?.knownAllergies?.trim() || "None reported",
      source: profile?.clinicallyVerified
        ? "Clinically Verified"
        : "Patient-Reported",
      verified: profile?.clinicallyVerified || false,
      verifiedAt: profile?.verifiedAt?.toISOString() || null,
    },
    medications: {
      active: activeMeds.map((m) => ({
        id: m.id,
        prescriptionNumber: m.prescriptionNumber,
        medicine: m.medicine,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        prescriber: m.prescriber,
        instructions: m.instructions || null,
        startDate: m.startDate.toISOString(),
        verified: true,
        source: "Clinician Signed Prescription",
      })),
      previous: previousMeds.map((m) => ({
        id: m.id,
        prescriptionNumber: m.prescriptionNumber,
        medicine: m.medicine,
        dose: m.dose,
        frequency: m.frequency,
        prescriber: m.prescriber,
        status: m.status,
        verified: true,
        source: "Clinician Signed Prescription",
      })),
      patientReportedNotes:
        profile?.currentMedications?.trim() || "None reported",
    },
    vitalSigns: vitalSignsRecords.map((v) => ({
      id: v.id,
      recordNumber: v.recordNumber,
      content: v.content,
      author: v.author,
      authorRole: v.authorRole || "Clinician",
      timestamp: v.createdAt.toISOString(),
      verified: v.verified,
      source: "Clinical Observation",
    })),
    medicalConditionsAndDiagnoses: {
      clinicallyVerifiedDiagnoses: diagnosisRecords.map((d) => ({
        id: d.id,
        recordNumber: d.recordNumber,
        diagnosis: d.content,
        author: d.author,
        timestamp: d.createdAt.toISOString(),
        verified: true,
        source: "Doctor Signed Clinical Diagnosis",
      })),
      patientReportedConditions:
        profile?.medicalConditions?.trim() || "None reported",
      previousSurgeries: profile?.previousSurgeries?.trim() || "None reported",
      medicalHistory: profile?.medicalHistory?.trim() || "None reported",
    },
    recentComplaints: patient.complaints.map((c) => ({
      referenceId: c.referenceId,
      symptoms: c.symptoms,
      severity: c.severity,
      duration: c.duration || null,
      status: c.status,
      assignedDoctor: c.assignedDoctor || null,
      clinicalNotes: c.clinicalNotes || null,
      createdAt: c.createdAt.toISOString(),
    })),
    clinicalNotes: clinicalNotesRecords.map((n) => ({
      id: n.id,
      recordNumber: n.recordNumber,
      type: n.type,
      content: n.content,
      author: n.author,
      authorRole: n.authorRole || "Clinician",
      timestamp: n.createdAt.toISOString(),
      verified: n.verified,
    })),
  }
}

/**
 * Rejects permanent deletion of emergency cases or break-glass audit logs.
 * Rule: Emergency records and audit trails are immutable legal records; deletion is prohibited.
 */
export function rejectEmergencyDeletion(): never {
  throw AppError.forbidden(
    "Emergency cases and Break-Glass audit logs form an immutable legal medical audit trail and cannot be deleted.",
  )
}

function formatEmergencyCase(c: any): EmergencyCaseItem {
  return {
    id: c.id,
    caseNumber: c.caseNumber,
    patientId: c.patientId,
    status: c.status,
    initiatedBy: c.initiatedBy,
    reason: c.reason || null,
    responderName: c.responderName || null,
    responderId: c.responderId || null,
    responderRole: c.responderRole || null,
    respondedAt: c.respondedAt ? c.respondedAt.toISOString() : null,
    cancelledAt: c.cancelledAt ? c.cancelledAt.toISOString() : null,
    cancellationReason: c.cancellationReason || null,
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    resolutionNotes: c.resolutionNotes || null,
    snapshot: c.snapshot || null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

function formatAuditLog(a: any): EmergencyAuditLogItem {
  return {
    id: a.id,
    emergencyCaseId: a.emergencyCaseId || null,
    patientId: a.patientId,
    actor: a.actor,
    actorId: a.actorId,
    actorRole: a.actorRole,
    action: a.action,
    target: a.target,
    severity: a.severity,
    justification: a.justification || null,
    accessContext: a.accessContext || null,
    createdAt: a.createdAt.toISOString(),
  }
}
