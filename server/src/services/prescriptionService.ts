import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  PrescriptionStatus,
  AdherenceStatus,
  NotificationType,
} from "../generated/prisma/enums"
import {
  CreatePrescriptionInput,
  RecordAdherenceInput,
} from "../validation/prescription"
import { createNotification } from "./notificationService"

export interface PrescriptionWithAdherence {
  id: string
  prescriptionNumber: string
  medicine: string
  dose: string
  frequency: string
  duration: string
  prescriber: string
  prescriberId: string | null
  status: PrescriptionStatus
  instructions: string | null
  startDate: Date
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  adherence: (boolean | null)[]
  adherenceLogs?: {
    id: string
    date: string
    status: AdherenceStatus
    notes?: string | null
  }[]
}

/**
 * Generates dates for the last N days (including today) formatted as YYYY-MM-DD.
 * Default is 7 days to match UI's "(last 7 days)".
 */
export function getLastNDays(n = 7): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(now.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

/**
 * Generates unique prescription tracking number: RX-YYYY-XXXX
 */
export async function generatePrescriptionNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  let prescriptionNumber = ""
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    attempts++
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    prescriptionNumber = `RX-${currentYear}-${randomSuffix}`
    const existing = await prisma.prescription.findUnique({
      where: { prescriptionNumber },
    })
    if (!existing) {
      isUnique = true
    }
  }

  if (!isUnique) {
    prescriptionNumber = `RX-${currentYear}-${Date.now().toString().slice(-4)}`
  }

  return prescriptionNumber
}

/**
 * Retrieves all prescriptions for an authorized patient with 7-day adherence mapping.
 */
export async function getPatientPrescriptions(
  patientId: string,
): Promise<PrescriptionWithAdherence[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
    include: {
      adherenceLogs: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const last7Days = getLastNDays(7)

  return prescriptions.map((rx) => {
    const logMap = new Map<string, AdherenceStatus>()
    rx.adherenceLogs.forEach((log) => {
      const dateKey = log.date.toISOString().slice(0, 10)
      logMap.set(dateKey, log.status)
    })

    const adherence = last7Days.map((dateStr) => {
      const status = logMap.get(dateStr)
      if (status === AdherenceStatus.TAKEN) return true
      if (status === AdherenceStatus.SKIPPED) return false
      return null
    })

    return {
      id: rx.id,
      prescriptionNumber: rx.prescriptionNumber,
      medicine: rx.medicine,
      dose: rx.dose,
      frequency: rx.frequency,
      duration: rx.duration,
      prescriber: rx.prescriber,
      prescriberId: rx.prescriberId,
      status: rx.status,
      instructions: rx.instructions,
      startDate: rx.startDate,
      endDate: rx.endDate,
      createdAt: rx.createdAt,
      updatedAt: rx.updatedAt,
      adherence,
      adherenceLogs: rx.adherenceLogs.map((l) => ({
        id: l.id,
        date: l.date.toISOString().slice(0, 10),
        status: l.status,
        notes: l.notes,
      })),
    }
  })
}

/**
 * Retrieves a single prescription for an authorized patient.
 * Supports lookup by UUID or prescriptionNumber (e.g. RX-2026-0841).
 * Strictly enforces patient ownership (IDOR defense).
 */
export async function getPatientPrescriptionById(
  patientId: string,
  idOrNumber: string,
): Promise<PrescriptionWithAdherence> {
  const prescription = await prisma.prescription.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { prescriptionNumber: idOrNumber }],
    },
    include: {
      adherenceLogs: {
        orderBy: { date: "asc" },
      },
    },
  })

  if (!prescription) {
    throw AppError.notFound(`Prescription '${idOrNumber}' not found`)
  }

  if (prescription.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to view another patient's prescription",
    )
  }

  const last7Days = getLastNDays(7)
  const logMap = new Map<string, AdherenceStatus>()
  prescription.adherenceLogs.forEach((log) => {
    const dateKey = log.date.toISOString().slice(0, 10)
    logMap.set(dateKey, log.status)
  })

  const adherence = last7Days.map((dateStr) => {
    const status = logMap.get(dateStr)
    if (status === AdherenceStatus.TAKEN) return true
    if (status === AdherenceStatus.SKIPPED) return false
    return null
  })

  return {
    id: prescription.id,
    prescriptionNumber: prescription.prescriptionNumber,
    medicine: prescription.medicine,
    dose: prescription.dose,
    frequency: prescription.frequency,
    duration: prescription.duration,
    prescriber: prescription.prescriber,
    prescriberId: prescription.prescriberId,
    status: prescription.status,
    instructions: prescription.instructions,
    startDate: prescription.startDate,
    endDate: prescription.endDate,
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt,
    adherence,
    adherenceLogs: prescription.adherenceLogs.map((l) => ({
      id: l.id,
      date: l.date.toISOString().slice(0, 10),
      status: l.status,
      notes: l.notes,
    })),
  }
}

/**
 * Records or updates a patient's daily adherence for an active prescription.
 */
export async function recordPatientAdherence(
  patientId: string,
  idOrNumber: string,
  input: RecordAdherenceInput,
): Promise<PrescriptionWithAdherence> {
  const prescription = await prisma.prescription.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { prescriptionNumber: idOrNumber }],
    },
  })

  if (!prescription) {
    throw AppError.notFound(`Prescription '${idOrNumber}' not found`)
  }

  if (prescription.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to record adherence for another patient's prescription",
    )
  }

  if (prescription.status !== PrescriptionStatus.ACTIVE) {
    throw AppError.badRequest(
      `Cannot record adherence for prescription with status '${prescription.status}'. Only ACTIVE prescriptions allow adherence tracking.`,
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const targetDateStr = input.date || todayStr

  // Validate not in the future
  if (targetDateStr > todayStr) {
    throw AppError.badRequest("Adherence cannot be recorded for a future date.")
  }

  // Validate within last 14 days
  const minAllowedDate = new Date()
  minAllowedDate.setUTCDate(minAllowedDate.getUTCDate() - 14)
  const minAllowedStr = minAllowedDate.toISOString().slice(0, 10)
  if (targetDateStr < minAllowedStr) {
    throw AppError.badRequest(
      "Adherence cannot be logged for dates older than 14 days.",
    )
  }

  const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`)

  await prisma.medicationAdherence.upsert({
    where: {
      prescriptionId_date: {
        prescriptionId: prescription.id,
        date: targetDate,
      },
    },
    update: {
      status: input.status,
      notes: input.notes,
      recordedAt: new Date(),
    },
    create: {
      prescriptionId: prescription.id,
      patientId,
      date: targetDate,
      status: input.status,
      notes: input.notes,
    },
  })

  return getPatientPrescriptionById(patientId, prescription.id)
}

/**
 * Internal / Clinician: Creates a new prescription.
 */
export async function createPrescription(
  data: CreatePrescriptionInput,
): Promise<PrescriptionWithAdherence> {
  const prescriptionNumber = await generatePrescriptionNumber()

  const prescription = await prisma.prescription.create({
    data: {
      prescriptionNumber,
      patientId: data.patientId,
      medicine: data.medicine,
      dose: data.dose,
      frequency: data.frequency,
      duration: data.duration,
      prescriber: data.prescriber,
      prescriberId: data.prescriberId,
      status: data.status || PrescriptionStatus.ACTIVE,
      instructions: data.instructions,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  })

  // Trigger prescription added notification (Rule 8, 9, 11)
  await createNotification({
    userId: data.patientId,
    type: NotificationType.PRESCRIPTION_ADDED,
    title: "New Prescription Added",
    message: `${data.prescriber} has prescribed ${data.medicine} (${data.dose}).`,
    eventId: `evt_rx_add_${prescriptionNumber}`,
    referenceType: "prescription",
    referenceId: prescriptionNumber,
    link: "/patient?tab=medications",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating prescription notification:",
      err,
    ),
  )

  return getPatientPrescriptionById(data.patientId, prescription.id)
}

/**
 * Rejection handlers for unauthorized patient operations
 */
export function rejectPatientPrescriptionCreate(): never {
  throw AppError.forbidden(
    "Only authorized healthcare professionals can issue prescriptions. Patients cannot prescribe medications.",
  )
}

export function rejectPatientPrescriptionUpdate(): never {
  throw AppError.forbidden(
    "Prescription details (medicine, dose, frequency, duration) cannot be modified by patients. You may only record daily adherence.",
  )
}

export function rejectPatientPrescriptionDelete(): never {
  throw AppError.forbidden(
    "Prescriptions form an immutable legal medical audit trail and cannot be deleted by patients.",
  )
}
