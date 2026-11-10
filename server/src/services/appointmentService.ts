import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import { AppointmentStatus, NotificationType } from "../generated/prisma/enums"
import { createNotification } from "./notificationService"
import {
  CreateAppointmentInput,
  UpdateAppointmentIntakeInput,
  RescheduleAppointmentInput,
} from "../validation/appointment"

export interface FormattedAppointment {
  id: string // appointmentNumber matching UI (e.g. APT-2026-0192)
  uuid: string
  appointmentNumber: string
  date: string // e.g. "Sep 18, 2026"
  rawDate: string // "2026-09-18"
  time: string // "10:00 AM"
  doctor: string // "Dr. K. Boateng"
  doctorId?: string | null
  department?: string | null
  type: string // "Follow-up Consultation"
  reason: string
  status: AppointmentStatus
  symptoms?: string | null
  duration?: string | null
  severity?: string | null
  notes?: string | null
  documents: string[]
  referralDoc?: string | null
  schedulingUrl?: string | null
  cancellationReason?: string | null
  cancelledAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function formatDisplayDate(d: Date): string {
  const month = MONTH_NAMES[d.getUTCMonth()]
  const day = d.getUTCDate()
  const year = d.getUTCFullYear()
  return `${month} ${day}, ${year}`
}

export async function generateAppointmentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  let appointmentNumber = ""
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    attempts++
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    appointmentNumber = `APT-${currentYear}-${randomSuffix}`
    const existing = await prisma.appointment.findUnique({
      where: { appointmentNumber },
    })
    if (!existing) {
      isUnique = true
    }
  }

  if (!isUnique) {
    appointmentNumber = `APT-${currentYear}-${Date.now().toString().slice(-4)}`
  }

  return appointmentNumber
}

function mapToFormatted(apt: any): FormattedAppointment {
  return {
    id: apt.appointmentNumber,
    uuid: apt.id,
    appointmentNumber: apt.appointmentNumber,
    date: formatDisplayDate(apt.date),
    rawDate: apt.date.toISOString().slice(0, 10),
    time: apt.time,
    doctor: apt.doctorName,
    doctorId: apt.doctorId,
    department: apt.department,
    type: apt.type,
    reason: apt.reason,
    status: apt.status,
    symptoms: apt.symptoms,
    duration: apt.duration,
    severity: apt.severity,
    notes: apt.notes,
    documents: apt.documents || [],
    referralDoc: apt.referralDoc,
    schedulingUrl: apt.schedulingUrl,
    cancellationReason: apt.cancellationReason,
    cancelledAt: apt.cancelledAt,
    createdAt: apt.createdAt,
    updatedAt: apt.updatedAt,
  }
}

/**
 * Retrieves appointments for the authorized patient, optionally filtered by tab.
 */
export async function getPatientAppointments(
  patientId: string,
  tab?: "upcoming" | "completed" | "cancelled",
): Promise<FormattedAppointment[]> {
  const where: any = { patientId }

  if (tab === "upcoming") {
    where.status = {
      in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING_CONFIRMATION],
    }
  } else if (tab === "completed") {
    where.status = AppointmentStatus.COMPLETED
  } else if (tab === "cancelled") {
    where.status = {
      in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { date: tab === "upcoming" ? "asc" : "desc" },
  })

  return appointments.map(mapToFormatted)
}

/**
 * Retrieves a single appointment by UUID or appointmentNumber.
 * Strictly verifies patient ownership (IDOR defense).
 */
export async function getPatientAppointmentById(
  patientId: string,
  idOrNumber: string,
): Promise<FormattedAppointment> {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  if (apt.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to view another patient's appointment",
    )
  }

  return mapToFormatted(apt)
}

/**
 * Books/creates a new appointment for the patient.
 */
export async function createAppointment(
  patientId: string,
  input: CreateAppointmentInput,
): Promise<FormattedAppointment> {
  const appointmentNumber = await generateAppointmentNumber()
  const dateObj = new Date(`${input.date}T00:00:00.000Z`)

  const apt = await prisma.appointment.create({
    data: {
      appointmentNumber,
      patientId,
      doctorName: input.doctorName,
      doctorId: input.doctorId,
      department: input.department,
      type: input.type || "General Consultation",
      reason: input.reason,
      date: dateObj,
      time: input.time,
      status: AppointmentStatus.CONFIRMED,
      symptoms: input.symptoms,
      duration: input.duration,
      severity: input.severity,
      notes: input.notes,
      documents: input.documents || [],
      referralDoc: input.referralDoc,
      schedulingUrl: input.schedulingUrl,
    },
  })

  // Trigger appointment confirmed notification (Rule 8, 9)
  await createNotification({
    userId: patientId,
    type: NotificationType.APPOINTMENT_CONFIRMED,
    title: "Appointment Confirmed",
    message: `Your appointment with ${input.doctorName} on ${formatDisplayDate(dateObj)} at ${input.time} has been confirmed.`,
    eventId: `evt_apt_create_${apt.appointmentNumber}`,
    referenceType: "appointment",
    referenceId: apt.appointmentNumber,
    link: "/patient?tab=appointments",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating appointment notification:",
      err,
    ),
  )

  return mapToFormatted(apt)
}

/**
 * Submits or updates the post-booking intake form.
 */
export async function submitAppointmentIntake(
  patientId: string,
  idOrNumber: string,
  input: UpdateAppointmentIntakeInput,
): Promise<FormattedAppointment> {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  if (apt.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to update another patient's appointment",
    )
  }

  const updated = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      ...(input.symptoms !== undefined && { symptoms: input.symptoms }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.severity !== undefined && { severity: input.severity }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.documents !== undefined && { documents: input.documents }),
      ...(input.referralDoc !== undefined && {
        referralDoc: input.referralDoc,
      }),
    },
  })

  return mapToFormatted(updated)
}

/**
 * Reschedules an upcoming appointment.
 */
export async function rescheduleAppointment(
  patientId: string,
  idOrNumber: string,
  input: RescheduleAppointmentInput,
): Promise<FormattedAppointment> {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  if (apt.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to reschedule another patient's appointment",
    )
  }

  if (
    apt.status === AppointmentStatus.CANCELLED ||
    apt.status === AppointmentStatus.NO_SHOW
  ) {
    throw AppError.badRequest(
      "Cannot reschedule a cancelled appointment. Please book a new appointment.",
    )
  }

  if (apt.status === AppointmentStatus.COMPLETED) {
    throw AppError.badRequest("Cannot reschedule a completed appointment.")
  }

  const dateObj = new Date(`${input.date}T00:00:00.000Z`)

  const updated = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      date: dateObj,
      time: input.time,
      status: AppointmentStatus.CONFIRMED,
      notes: input.reason
        ? apt.notes
          ? `${apt.notes}\n[Rescheduled: ${input.reason}]`
          : `Rescheduled: ${input.reason}`
        : apt.notes,
    },
  })

  // Trigger appointment rescheduled notification (Rule 8, 9)
  await createNotification({
    userId: patientId,
    type: NotificationType.APPOINTMENT_RESCHEDULED,
    title: "Appointment Rescheduled",
    message: `Your appointment ${apt.appointmentNumber} has been rescheduled to ${formatDisplayDate(dateObj)} at ${input.time}.`,
    eventId: `evt_apt_resched_${apt.appointmentNumber}_${input.date}_${input.time}`,
    referenceType: "appointment",
    referenceId: apt.appointmentNumber,
    link: "/patient?tab=appointments",
  }).catch((err) =>
    console.error(
      "[Notification] Error creating reschedule notification:",
      err,
    ),
  )

  return mapToFormatted(updated)
}

/**
 * Cancels an upcoming appointment (soft cancellation).
 */
export async function cancelAppointment(
  patientId: string,
  idOrNumber: string,
  reason?: string,
): Promise<FormattedAppointment> {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  if (apt.patientId !== patientId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to cancel another patient's appointment",
    )
  }

  if (apt.status === AppointmentStatus.CANCELLED) {
    throw AppError.badRequest("Appointment is already cancelled.")
  }

  if (apt.status === AppointmentStatus.COMPLETED) {
    throw AppError.badRequest("Cannot cancel a completed appointment.")
  }

  const updated = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason || "Cancelled by patient",
      cancelledAt: new Date(),
    },
  })

  // Trigger appointment cancelled notification (Rule 8, 9)
  await createNotification({
    userId: patientId,
    type: NotificationType.APPOINTMENT_CANCELLED,
    title: "Appointment Cancelled",
    message: `Your appointment ${apt.appointmentNumber} has been cancelled.`,
    eventId: `evt_apt_cancel_${apt.appointmentNumber}`,
    referenceType: "appointment",
    referenceId: apt.appointmentNumber,
    link: "/patient?tab=appointments",
  }).catch((err) =>
    console.error("[Notification] Error creating cancel notification:", err),
  )

  return mapToFormatted(updated)
}

/**
 * Rejection handler for physical deletion
 */
export function rejectPatientAppointmentDelete(): never {
  throw AppError.forbidden(
    "Appointments form a legal clinical audit trail and cannot be permanently deleted. Please cancel the appointment instead.",
  )
}
