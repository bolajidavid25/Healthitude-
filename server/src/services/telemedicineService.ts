import crypto from "crypto"
import { prisma } from "../config/prisma"
import { env } from "../config/env"
import { AppError } from "../errors/AppError"
import { AppointmentStatus } from "../generated/prisma/enums"
import {
  StartTelemedicineInput,
  EndTelemedicineInput,
} from "../validation/telemedicine"

export interface TelemedicineSessionRecord {
  sessionId: string
  sessionNumber: string // e.g. "TLS-2026-1048"
  appointmentId: string // appointment uuid
  appointmentNumber: string // "APT-2026-XXXX"
  patientId: string
  patientName: string
  doctorName: string
  doctorId?: string | null
  department?: string | null
  roomName: string // e.g. "healthitude-room-apt-2026-1048"
  roomToken: string
  schedulingUrl: string
  status: "IN_PROGRESS" | "ENDED"
  startedAt: Date
  endedAt?: Date | null
  durationSeconds?: number | null
  formattedDuration?: string | null
  exitReason?: string | null
  feedback?: string | null
  deviceType?: string | null
  browser?: string | null
}

// In-memory persistent session registry synchronized with Prisma appointment records
const sessionStore = new Map<string, TelemedicineSessionRecord>()

/**
 * Generate a unique session number: TLS-YYYY-XXXX
 */
function generateSessionNumber(): string {
  const year = new Date().getFullYear()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
  return `TLS-${year}-${randomSuffix}`
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Generate a cryptographically secure room token using HMAC SHA-256
 */
function generateRoomToken(
  sessionId: string,
  appointmentNumber: string,
  patientId: string,
): string {
  const secret =
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET ||
    "healthitude-telemedicine-secret"
  const payload = `${sessionId}:${appointmentNumber}:${patientId}:${Date.now()}`
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export const telemedicineService = {
  /**
   * Start or retrieve an active telemedicine session for an authorized appointment.
   */
  async startSession(
    patientId: string,
    appointmentIdOrNumber: string,
    input?: StartTelemedicineInput,
  ): Promise<TelemedicineSessionRecord> {
    // 1. Resolve appointment from Prisma
    const appointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { id: appointmentIdOrNumber },
          { appointmentNumber: appointmentIdOrNumber },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!appointment) {
      throw AppError.notFound("Appointment not found")
    }

    // 2. Strict IDOR Check: Ensure appointment belongs to the authenticated patient
    if (appointment.patientId !== patientId) {
      throw AppError.forbidden(
        "Access denied: You are not authorized to start a telemedicine session for another patient's appointment",
      )
    }

    // 3. Status checks: cannot start telemedicine for CANCELLED or COMPLETED appointments
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw AppError.badRequest(
        "Cannot initiate a telemedicine session for a cancelled appointment.",
      )
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw AppError.badRequest(
        "Cannot initiate a telemedicine session for an appointment that is already completed.",
      )
    }

    // 4. Check if an active session already exists for this appointment
    for (const existing of sessionStore.values()) {
      if (
        existing.appointmentId === appointment.id &&
        existing.patientId === patientId &&
        existing.status === "IN_PROGRESS"
      ) {
        return existing
      }
    }

    // 5. Generate new session
    const sessionId = crypto.randomUUID()
    const sessionNumber = generateSessionNumber()
    const roomName = `healthitude-room-${appointment.appointmentNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
    const roomToken = generateRoomToken(
      sessionId,
      appointment.appointmentNumber,
      patientId,
    )
    const schedulingUrl = `/telemedicine/room/${sessionNumber}`

    const newSession: TelemedicineSessionRecord = {
      sessionId,
      sessionNumber,
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      patientId: appointment.patientId,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      doctorName: appointment.doctorName,
      doctorId: appointment.doctorId,
      department: appointment.department,
      roomName,
      roomToken,
      schedulingUrl,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      formattedDuration: null,
      exitReason: null,
      feedback: null,
      deviceType: input?.deviceType || null,
      browser: input?.browser || null,
    }

    sessionStore.set(sessionId, newSession)
    sessionStore.set(sessionNumber, newSession)

    // 6. Update appointment's schedulingUrl in Prisma
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        schedulingUrl,
      },
    })

    return newSession
  },

  /**
   * Retrieve active or most recent telemedicine session for an appointment.
   */
  async getSessionByAppointment(
    patientId: string,
    appointmentIdOrNumber: string,
  ): Promise<TelemedicineSessionRecord> {
    const appointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { id: appointmentIdOrNumber },
          { appointmentNumber: appointmentIdOrNumber },
        ],
      },
    })

    if (!appointment) {
      throw AppError.notFound("Appointment not found")
    }

    if (appointment.patientId !== patientId) {
      throw AppError.forbidden(
        "Access denied: You are not authorized to view telemedicine sessions for another patient's appointment",
      )
    }

    // Find latest session for this appointment
    const matches: TelemedicineSessionRecord[] = []
    for (const session of sessionStore.values()) {
      if (session.appointmentId === appointment.id) {
        matches.push(session)
      }
    }

    if (matches.length === 0) {
      throw AppError.notFound(
        "No telemedicine session found for this appointment",
      )
    }

    // Sort by startedAt descending
    matches.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    return matches[0]
  },

  /**
   * Retrieve session by sessionId or sessionNumber.
   */
  async getSessionById(
    patientId: string,
    sessionIdOrNumber: string,
  ): Promise<TelemedicineSessionRecord> {
    const session = sessionStore.get(sessionIdOrNumber)

    if (!session) {
      throw AppError.notFound("Telemedicine session not found")
    }

    if (session.patientId !== patientId) {
      throw AppError.forbidden(
        "Access denied: You are not authorized to access another patient's telemedicine session",
      )
    }

    return session
  },

  /**
   * End an active telemedicine session.
   * CLINICAL GOVERNANCE ENFORCEMENT:
   * - Records endedAt and calculates actual duration.
   * - Updates session status to ENDED.
   * - MUST NOT mark appointment.status as COMPLETED (appointment completion is a doctor clinical action).
   * - MUST NOT synthesize doctor notes or clinical diagnoses.
   */
  async endSession(
    patientId: string,
    sessionIdOrNumber: string,
    input?: EndTelemedicineInput,
  ): Promise<TelemedicineSessionRecord> {
    // 1. Resolve session
    let session = sessionStore.get(sessionIdOrNumber)

    // If not found directly by ID, search by appointmentIdOrNumber
    if (!session) {
      for (const s of sessionStore.values()) {
        if (
          (s.appointmentId === sessionIdOrNumber ||
            s.appointmentNumber === sessionIdOrNumber) &&
          s.status === "IN_PROGRESS"
        ) {
          session = s
          break
        }
      }
    }

    if (!session) {
      throw AppError.notFound("Active telemedicine session not found")
    }

    // 2. Strict IDOR Check
    if (session.patientId !== patientId) {
      throw AppError.forbidden(
        "Access denied: You are not authorized to end another patient's telemedicine session",
      )
    }

    // 3. If already ended, return current state
    if (session.status === "ENDED") {
      return session
    }

    // 4. Record conclusion metrics
    const endedAt = new Date()
    const durationSeconds = Math.max(
      0,
      Math.round(
        (endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000,
      ),
    )
    const formattedDuration = formatDuration(durationSeconds)

    session.endedAt = endedAt
    session.durationSeconds = durationSeconds
    session.formattedDuration = formattedDuration
    session.status = "ENDED"
    if (input?.exitReason) session.exitReason = input.exitReason
    if (input?.feedback) session.feedback = input.feedback

    // 5. Update both keys in sessionStore
    sessionStore.set(session.sessionId, session)
    sessionStore.set(session.sessionNumber, session)

    // Note: appointment.status is deliberately NOT modified here.
    // Preserves clinical governance rule: Exiting call does NOT complete appointment.

    return session
  },

  /**
   * Rule: Patient deletion of telemedicine consultation records is strictly prohibited.
   */
  rejectPatientSessionDelete(): never {
    throw AppError.forbidden(
      "Patient deletion of telemedicine consultation session audit records is prohibited for clinical compliance.",
    )
  },

  /**
   * Utility for tests to reset in-memory store
   */
  _clearForTesting() {
    sessionStore.clear()
  },
}
