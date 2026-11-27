import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  AppointmentStatus,
  ClinicalRecordType,
  ComplaintSeverity,
  ComplaintStatus,
  EmergencyCaseStatus,
  NotificationType,
  PrescriptionStatus,
  ProfessionalCategory,
} from "../generated/prisma/enums"
import type { SafeProfessional } from "./professionalAuthService"
import { createClinicalRecord } from "./clinicalRecordService"
import { createPrescription } from "./prescriptionService"
import { updateComplaintStatus } from "./complaintService"
import { createNotification } from "./notificationService"
import { formatDisplayDate } from "./appointmentService"
import {
  getEmergencyFocusedClinicalRecord,
  respondToEmergencyCase,
} from "./emergencyService"
import type {
  CompleteConsultationInput,
  ProfessionalAppointmentsQuery,
  ProfessionalComplaintsQuery,
  ProfessionalCreateClinicalRecordInput,
  ProfessionalCreatePrescriptionInput,
  UpdateProfessionalAppointmentStatusInput,
  UpdateProfessionalComplaintInput,
} from "../validation/professionalClinical"

/**
 * Formats the authoritative display name for a verified healthcare professional.
 */
export function formatProfessionalDisplayName(prof: SafeProfessional): string {
  const fullName = [prof.firstName, prof.lastName].filter(Boolean).join(" ").trim()
  if (prof.category === ProfessionalCategory.NURSE) {
    return `Nurse ${fullName}`
  }
  if (prof.category === ProfessionalCategory.PHARMACIST) {
    return `Pharm. ${fullName}`
  }
  return `Dr. ${fullName}`
}

function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

function getInitials(firstName: string, lastName: string): string {
  return `${(firstName || "P")[0]}${(lastName || "T")[0]}`.toUpperCase()
}

function formatBloodGroup(bg?: string | null): string {
  if (!bg || bg === "UNKNOWN") return "Not documented"
  return bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")
}

/**
 * Builds the Prisma WHERE clause matching appointments assigned to this professional
 * by authoritative `doctorId`, matching `doctorName`, or unassigned bookings (`doctorId: null`)
 * so patient appointments are never orphaned when booked against fallback directory entries.
 */
function buildDoctorAppointmentFilter(prof: SafeProfessional) {
  const displayName = formatProfessionalDisplayName(prof)
  const fullName = `${prof.firstName} ${prof.lastName}`.trim()
  return {
    OR: [
      { doctorId: prof.id },
      { doctorName: { equals: displayName, mode: "insensitive" as const } },
      { doctorName: { contains: fullName, mode: "insensitive" as const } },
      { doctorId: null },
    ],
  }
}

/**
 * GET /api/professional/dashboard
 * Returns real-time clinical metrics and verification/licence status for the doctor dashboard.
 */
export async function getProfessionalDashboard(prof: SafeProfessional) {
  const doctorFilter = buildDoctorAppointmentFilter(prof)
  const now = new Date()
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const endOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  )

  const [
    todayAppointmentsCount,
    upcomingAppointmentsCount,
    completedTodayCount,
    urgentComplaintsCount,
    pendingComplaintsCount,
    activeEmergenciesCount,
    distinctAppointmentPatients,
    distinctRecordPatients,
    distinctPrescriptionPatients,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        ...doctorFilter,
        date: { gte: startOfToday, lt: endOfToday },
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.PENDING_CONFIRMATION,
          ],
        },
      },
    }),
    prisma.appointment.count({
      where: {
        ...doctorFilter,
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.PENDING_CONFIRMATION,
          ],
        },
      },
    }),
    prisma.appointment.count({
      where: {
        ...doctorFilter,
        status: AppointmentStatus.COMPLETED,
        updatedAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.complaint.count({
      where: {
        severity: ComplaintSeverity.SEVERE,
        status: { in: [ComplaintStatus.NEW, ComplaintStatus.UNDER_REVIEW] },
      },
    }),
    prisma.complaint.count({
      where: {
        status: { in: [ComplaintStatus.NEW, ComplaintStatus.UNDER_REVIEW] },
      },
    }),
    prisma.emergencyCase.count({
      where: {
        status: {
          in: [EmergencyCaseStatus.ACTIVE, EmergencyCaseStatus.RESPONDED],
        },
      },
    }),
    prisma.appointment.findMany({
      where: doctorFilter,
      select: { patientId: true },
      distinct: ["patientId"],
    }),
    prisma.clinicalRecord.findMany({
      where: { authorId: prof.id },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
    prisma.prescription.findMany({
      where: { prescriberId: prof.id },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
  ])

  const connectedPatientIds = new Set<string>([
    ...distinctAppointmentPatients.map((r) => r.patientId),
    ...distinctRecordPatients.map((r) => r.patientId),
    ...distinctPrescriptionPatients.map((r) => r.patientId),
  ])

  const licenceExpiry = new Date(prof.licenceExpiry)
  const daysUntilLicenceExpiry = Math.ceil(
    (licenceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return {
    professional: {
      id: prof.id,
      displayName: formatProfessionalDisplayName(prof),
      firstName: prof.firstName,
      lastName: prof.lastName,
      category: prof.category,
      profession: prof.profession,
      specialty: prof.specialty,
      facility: prof.facility,
      licenceNumber: prof.licenceNumber,
      licenceExpiry: licenceExpiry.toISOString(),
      daysUntilLicenceExpiry,
      verificationStatus: prof.verificationStatus,
      verifiedAt: prof.verifiedAt ? new Date(prof.verifiedAt).toISOString() : null,
      restrictions: prof.restrictions,
    },
    metrics: {
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      urgentComplaintsCount,
      completedTodayCount,
      pendingReviewsCount: pendingComplaintsCount,
      activeEmergenciesCount,
      connectedPatientsCount: connectedPatientIds.size,
    },
  }
}

/**
 * GET /api/professional/patients
 * Lists registered patients with optional search, prioritizing patients connected to this doctor.
 * Rule D: Never exposes passwordHash.
 */
export async function getProfessionalPatients(
  prof: SafeProfessional,
  search?: string,
) {
  const doctorFilter = buildDoctorAppointmentFilter(prof)

  // Find patients who already have a clinical relationship with this professional
  const [aptPatients, recPatients, rxPatients] = await Promise.all([
    prisma.appointment.findMany({
      where: doctorFilter,
      select: { patientId: true },
      distinct: ["patientId"],
    }),
    prisma.clinicalRecord.findMany({
      where: { authorId: prof.id },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
    prisma.prescription.findMany({
      where: { prescriberId: prof.id },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
  ])

  const connectedIds = new Set<string>([
    ...aptPatients.map((p) => p.patientId),
    ...recPatients.map((p) => p.patientId),
    ...rxPatients.map((p) => p.patientId),
  ])

  const where: any = {}
  if (search && search.trim()) {
    const q = search.trim()
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phoneNumber: { contains: q, mode: "insensitive" } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      sex: true,
      dateOfBirth: true,
      healthProfile: {
        select: {
          bloodGroup: true,
          genotype: true,
          knownAllergies: true,
          medicalConditions: true,
          currentMedications: true,
          patientReported: true,
          clinicallyVerified: true,
          verifiedAt: true,
        },
      },
      patientCategory: {
        select: {
          category: true,
          verificationStatus: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const formatted = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    initials: getInitials(u.firstName, u.lastName),
    email: u.email,
    phoneNumber: u.phoneNumber,
    sex: u.sex,
    age: calculateAge(u.dateOfBirth),
    dateOfBirth: u.dateOfBirth.toISOString().slice(0, 10),
    bloodGroup: formatBloodGroup(u.healthProfile?.bloodGroup),
    genotype: u.healthProfile?.genotype || "Not documented",
    allergies: u.healthProfile?.knownAllergies || "None reported",
    conditions: u.healthProfile?.medicalConditions || "None reported",
    currentMedications: u.healthProfile?.currentMedications || "None reported",
    clinicallyVerified: u.healthProfile?.clinicallyVerified ?? false,
    category: u.patientCategory?.category || "GENERAL_PATIENT",
    isConnected: connectedIds.has(u.id),
  }))

  // Sort connected patients first
  formatted.sort((a, b) => Number(b.isConnected) - Number(a.isConnected))

  return formatted
}

/**
 * GET /api/professional/patients/:patientId
 * Retrieves full clinical dossier for a patient (Rule A: distinguishes patient-reported vs clinically verified).
 */
export async function getProfessionalPatientDetail(patientId: string) {
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      sex: true,
      dateOfBirth: true,
      profilePhoto: true,
      address: true,
      emergencyContact: true,
      healthProfile: true,
      patientCategory: true,
      appointments: {
        orderBy: { date: "desc" },
        take: 15,
      },
      complaints: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
      clinicalRecords: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      prescriptions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      createdAt: true,
    },
  })

  if (!patient) {
    throw AppError.notFound("Patient not found")
  }

  return {
    id: patient.id,
    name: `${patient.firstName} ${patient.lastName}`.trim(),
    firstName: patient.firstName,
    middleName: patient.middleName,
    lastName: patient.lastName,
    initials: getInitials(patient.firstName, patient.lastName),
    email: patient.email,
    phoneNumber: patient.phoneNumber,
    sex: patient.sex,
    age: calculateAge(patient.dateOfBirth),
    dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    healthProfile: patient.healthProfile,
    patientCategory: patient.patientCategory,
    appointments: patient.appointments,
    complaints: patient.complaints,
    clinicalRecords: patient.clinicalRecords,
    prescriptions: patient.prescriptions,
  }
}

/**
 * POST /api/professional/patients/:patientId/verify-health-profile
 * Rule A: Only a verified healthcare professional can mark a patient's HealthProfile as clinicallyVerified = true.
 */
export async function verifyPatientHealthProfile(
  prof: SafeProfessional,
  patientId: string,
) {
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: { healthProfile: true },
  })

  if (!patient) {
    throw AppError.notFound("Patient not found")
  }

  const now = new Date()
  const updatedProfile = patient.healthProfile
    ? await prisma.healthProfile.update({
        where: { userId: patientId },
        data: {
          clinicallyVerified: true,
          verifiedAt: now,
        },
      })
    : await prisma.healthProfile.create({
        data: {
          userId: patientId,
          patientReported: false,
          clinicallyVerified: true,
          verifiedAt: now,
        },
      })

  const doctorName = formatProfessionalDisplayName(prof)

  await createNotification({
    userId: patientId,
    type: NotificationType.GENERAL,
    title: "Health Profile Clinically Verified",
    message: `${doctorName} has clinically verified your health profile.`,
    eventId: `evt_hp_verify_${patientId}_${now.toISOString().slice(0, 10)}`,
    referenceType: "healthProfile",
    referenceId: updatedProfile.id,
    link: "/patient?tab=profile",
  }).catch(() => {})

  return updatedProfile
}

/**
 * GET /api/professional/appointments
 * Retrieves appointments assigned to the verified professional with rich patient pre-consultation data.
 */
export async function getProfessionalAppointments(
  prof: SafeProfessional,
  query: ProfessionalAppointmentsQuery,
) {
  const doctorFilter = buildDoctorAppointmentFilter(prof)
  const where: any = { ...doctorFilter }

  if (query.status) {
    where.status = query.status
  } else if (query.tab === "today") {
    const now = new Date()
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    const endOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    )
    where.date = { gte: startOfToday, lt: endOfToday }
    where.status = {
      in: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.PENDING_CONFIRMATION,
      ],
    }
  } else if (query.tab === "upcoming") {
    where.status = {
      in: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.PENDING_CONFIRMATION,
      ],
    }
  } else if (query.tab === "completed") {
    where.status = AppointmentStatus.COMPLETED
  } else if (query.tab === "cancelled") {
    where.status = {
      in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
    }
  }

  if (query.date) {
    const target = new Date(`${query.date}T00:00:00.000Z`)
    const nextDay = new Date(target.getTime() + 24 * 60 * 60 * 1000)
    where.date = { gte: target, lt: nextDay }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          sex: true,
          dateOfBirth: true,
          healthProfile: true,
          prescriptions: {
            where: { status: PrescriptionStatus.ACTIVE },
            select: {
              medicine: true,
              dose: true,
              frequency: true,
            },
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
  })

  return appointments.map((apt) => {
    const p = apt.patient
    const hp = p.healthProfile
    const symptomsList = apt.symptoms
      ? apt.symptoms
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    const activeMedsStr =
      p.prescriptions.length > 0
        ? p.prescriptions
            .map((rx) => `${rx.medicine} ${rx.dose} · ${rx.frequency}`)
            .join("; ")
        : hp?.currentMedications || "None reported"

    return {
      id: apt.appointmentNumber,
      uuid: apt.id,
      appointmentNumber: apt.appointmentNumber,
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`.trim(),
      initials: getInitials(p.firstName, p.lastName),
      age: calculateAge(p.dateOfBirth),
      sex: p.sex,
      date: formatDisplayDate(apt.date),
      rawDate: apt.date.toISOString().slice(0, 10),
      time: apt.time,
      type: apt.type,
      reason: apt.reason,
      status: apt.status,
      department: apt.department,
      symptoms: symptomsList,
      rawSymptoms: apt.symptoms || "",
      duration: apt.duration || "Not specified",
      severity: apt.severity || "Not specified",
      notes: apt.notes,
      documents: apt.documents || [],
      referralDoc: apt.referralDoc,
      conditions: hp?.medicalConditions || "No reported conditions",
      allergies: hp?.knownAllergies || "None reported",
      medications: activeMedsStr,
      bloodGroup: formatBloodGroup(hp?.bloodGroup),
      clinicallyVerified: hp?.clinicallyVerified ?? false,
      createdAt: apt.createdAt.toISOString(),
      updatedAt: apt.updatedAt.toISOString(),
    }
  })
}

/**
 * PATCH /api/professional/appointments/:id/status
 * Updates appointment status from the doctor's portal and notifies the patient.
 */
export async function updateProfessionalAppointmentStatus(
  prof: SafeProfessional,
  idOrNumber: string,
  input: UpdateProfessionalAppointmentStatusInput,
) {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  // Ensure doctor is authorized for this appointment (assigned by ID or name, or unassigned doctorId)
  const displayName = formatProfessionalDisplayName(prof)
  const fullName = `${prof.firstName} ${prof.lastName}`.trim().toLowerCase()
  const isOwner =
    apt.doctorId === prof.id ||
    apt.doctorName.toLowerCase().includes(fullName)

  if (apt.doctorId && !isOwner) {
    throw AppError.forbidden(
      "Access denied: This appointment is assigned to another healthcare professional",
    )
  }

  const updated = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      status: input.status,
      doctorId: apt.doctorId || prof.id,
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status === AppointmentStatus.CANCELLED && {
        cancellationReason:
          input.cancellationReason || `Cancelled by ${displayName}`,
        cancelledAt: new Date(),
      }),
    },
  })

  const notifType =
    input.status === AppointmentStatus.CANCELLED
      ? NotificationType.APPOINTMENT_CANCELLED
      : NotificationType.APPOINTMENT_CONFIRMED

  await createNotification({
    userId: apt.patientId,
    type: notifType,
    title:
      input.status === AppointmentStatus.CANCELLED
        ? "Appointment Cancelled by Doctor"
        : input.status === AppointmentStatus.COMPLETED
          ? "Appointment Completed"
          : "Appointment Status Updated",
    message: `${displayName} updated appointment ${apt.appointmentNumber} to ${input.status.replace(/_/g, " ")}.`,
    eventId: `evt_prof_apt_status_${apt.appointmentNumber}_${input.status}_${Date.now()}`,
    referenceType: "appointment",
    referenceId: apt.appointmentNumber,
    link: "/patient?tab=appointments",
  }).catch(() => {})

  return updated
}

/**
 * POST /api/professional/appointments/:id/complete
 * Completes a doctor consultation:
 * 1. Saves consultation notes & recommendations as a verified TREATMENT_NOTE ClinicalRecord
 * 2. Saves each diagnosis as a verified DIAGNOSIS ClinicalRecord
 * 3. Saves optional vital signs as a verified VITAL_SIGNS ClinicalRecord
 * 4. Issues all prescriptions (automatically visible in patient's medication adherence tracker)
 * 5. Marks appointment COMPLETED and notifies patient
 */
export async function completeProfessionalConsultation(
  prof: SafeProfessional,
  idOrNumber: string,
  input: CompleteConsultationInput,
) {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { appointmentNumber: idOrNumber }],
    },
  })

  if (!apt) {
    throw AppError.notFound(`Appointment '${idOrNumber}' not found`)
  }

  const fullName = `${prof.firstName} ${prof.lastName}`.trim().toLowerCase()
  const isOwner =
    apt.doctorId === prof.id ||
    apt.doctorName.toLowerCase().includes(fullName)

  if (apt.doctorId && !isOwner) {
    throw AppError.forbidden(
      "Access denied: You are not the assigned clinician for this appointment",
    )
  }

  if (apt.status === AppointmentStatus.CANCELLED) {
    throw AppError.badRequest("Cannot complete a cancelled appointment")
  }

  const doctorName = formatProfessionalDisplayName(prof)
  const authorRole = prof.specialty || prof.profession
  const createdRecords = []
  const createdPrescriptions = []

  // 1. Save Consultation Notes (+ recommendations + follow-up) as TREATMENT_NOTE
  const fullNotes = [
    input.consultationNotes,
    input.recommendations ? `\nRecommendations:\n${input.recommendations}` : "",
    input.followUp && input.followUp !== "none"
      ? `\nFollow-up: ${input.followUp}${input.followUpDate ? ` (${input.followUpDate})` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const noteRecord = await createClinicalRecord({
    patientId: apt.patientId,
    type: ClinicalRecordType.TREATMENT_NOTE,
    content: fullNotes,
    author: doctorName,
    authorRole,
    authorId: prof.id,
    metadata: {
      appointmentNumber: apt.appointmentNumber,
      followUp: input.followUp,
      followUpDate: input.followUpDate || null,
    },
  })
  createdRecords.push(noteRecord)

  // 2. Save non-empty diagnoses
  for (const diag of input.diagnoses || []) {
    if (diag && diag.trim().length >= 2) {
      const diagRecord = await createClinicalRecord({
        patientId: apt.patientId,
        type: ClinicalRecordType.DIAGNOSIS,
        content: diag.trim(),
        author: doctorName,
        authorRole,
        authorId: prof.id,
        metadata: { appointmentNumber: apt.appointmentNumber },
      })
      createdRecords.push(diagRecord)
    }
  }

  // 3. Save optional vital signs
  if (input.vitalSigns && input.vitalSigns.trim().length >= 2) {
    const vitalsRecord = await createClinicalRecord({
      patientId: apt.patientId,
      type: ClinicalRecordType.VITAL_SIGNS,
      content: input.vitalSigns.trim(),
      author: doctorName,
      authorRole,
      authorId: prof.id,
      metadata: { appointmentNumber: apt.appointmentNumber },
    })
    createdRecords.push(vitalsRecord)
  }

  // 4. Issue prescriptions
  for (const rx of input.prescriptions || []) {
    if (rx.medicine && rx.medicine.trim()) {
      const instructions = [
        rx.route ? `Route: ${rx.route}.` : "",
        rx.instructions || "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim()

      const createdRx = await createPrescription({
        patientId: apt.patientId,
        medicine: rx.medicine.trim(),
        dose: rx.dose.trim(),
        frequency: rx.frequency.trim(),
        duration: rx.duration.trim(),
        prescriber: doctorName,
        prescriberId: prof.id,
        status: PrescriptionStatus.ACTIVE,
        instructions: instructions || undefined,
      })
      createdPrescriptions.push(createdRx)
    }
  }

  // 5. Mark appointment COMPLETED
  const updatedAppointment = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      status: AppointmentStatus.COMPLETED,
      doctorId: apt.doctorId || prof.id,
      doctorName: apt.doctorName || doctorName,
      notes: input.consultationNotes,
    },
  })

  await createNotification({
    userId: apt.patientId,
    type: NotificationType.GENERAL,
    title: "Consultation Completed",
    message: `${doctorName} completed your consultation (${apt.appointmentNumber}). Your clinical notes and prescriptions are now available.`,
    eventId: `evt_consult_complete_${apt.appointmentNumber}`,
    referenceType: "appointment",
    referenceId: apt.appointmentNumber,
    link: "/patient?tab=records",
  }).catch(() => {})

  return {
    appointment: updatedAppointment,
    clinicalRecords: createdRecords,
    prescriptions: createdPrescriptions,
  }
}

/**
 * GET /api/professional/complaints
 * Retrieves the clinical complaint queue with patient details and urgency priority.
 */
export async function getProfessionalComplaints(
  prof: SafeProfessional,
  query: ProfessionalComplaintsQuery,
) {
  const displayName = formatProfessionalDisplayName(prof)
  const where: any = {}

  if (query.status) {
    where.status = query.status
  }
  if (query.severity) {
    where.severity = query.severity
  }
  if (query.assignedToMe) {
    where.assignedDoctor = { equals: displayName, mode: "insensitive" }
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          sex: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  })

  return complaints.map((c) => ({
    id: c.id,
    referenceId: c.referenceId,
    patientId: c.patientId,
    patientName: `${c.patient.firstName} ${c.patient.lastName}`.trim(),
    patientAge: calculateAge(c.patient.dateOfBirth),
    patientSex: c.patient.sex,
    symptoms: c.symptoms,
    severity: c.severity,
    duration: c.duration,
    status: c.status,
    priority: c.severity === ComplaintSeverity.SEVERE ? "URGENT" : "ROUTINE",
    assignedDoctor: c.assignedDoctor,
    clinicalNotes: c.clinicalNotes,
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))
}

/**
 * PATCH /api/professional/complaints/:id
 * Doctor claims/updates complaint status, adds clinical notes, and notifies patient.
 */
export async function updateProfessionalComplaint(
  prof: SafeProfessional,
  complaintIdOrRef: string,
  input: UpdateProfessionalComplaintInput,
) {
  const doctorName = formatProfessionalDisplayName(prof)
  return updateComplaintStatus(
    complaintIdOrRef,
    input.status,
    input.clinicalNotes,
    doctorName,
  )
}

/**
 * GET /api/professional/clinical-records
 * Lists verified clinical records authored by this professional (or filtered by patientId).
 */
export async function getProfessionalClinicalRecords(
  prof: SafeProfessional,
  patientId?: string,
) {
  const where: any = patientId ? { patientId } : { authorId: prof.id }

  const records = await prisma.clinicalRecord.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return records.map((r) => ({
    id: r.id,
    recordNumber: r.recordNumber,
    patientId: r.patientId,
    patientName: `${r.patient.firstName} ${r.patient.lastName}`.trim(),
    type: r.type,
    content: r.content,
    author: r.author,
    authorRole: r.authorRole,
    authorId: r.authorId,
    verified: r.verified,
    verifiedAt: r.verifiedAt.toISOString(),
    attachmentName: r.attachmentName,
    createdAt: r.createdAt.toISOString(),
  }))
}

/**
 * POST /api/professional/clinical-records
 * Authors a clinically verified record stamped with the authenticated verified professional's credentials.
 */
export async function createProfessionalClinicalRecord(
  prof: SafeProfessional,
  input: ProfessionalCreateClinicalRecordInput,
) {
  const doctorName = formatProfessionalDisplayName(prof)
  return createClinicalRecord({
    patientId: input.patientId,
    type: input.type,
    content: input.content,
    author: doctorName,
    authorRole: prof.specialty || prof.profession,
    authorId: prof.id,
    attachmentName: input.attachmentName,
    attachmentUrl: input.attachmentUrl,
    metadata: input.metadata,
  })
}

/**
 * GET /api/professional/prescriptions
 * Lists prescriptions issued by this professional (or filtered by patientId).
 */
export async function getProfessionalPrescriptions(
  prof: SafeProfessional,
  patientId?: string,
) {
  const where: any = patientId ? { patientId } : { prescriberId: prof.id }

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return prescriptions.map((rx) => ({
    id: rx.id,
    prescriptionNumber: rx.prescriptionNumber,
    patientId: rx.patientId,
    patientName: `${rx.patient.firstName} ${rx.patient.lastName}`.trim(),
    medicine: rx.medicine,
    dose: rx.dose,
    frequency: rx.frequency,
    duration: rx.duration,
    prescriber: rx.prescriber,
    prescriberId: rx.prescriberId,
    status: rx.status,
    instructions: rx.instructions,
    startDate: rx.startDate.toISOString(),
    endDate: rx.endDate ? rx.endDate.toISOString() : null,
    createdAt: rx.createdAt.toISOString(),
  }))
}

/**
 * POST /api/professional/prescriptions
 * Issues a verified prescription stamped with the authenticated professional's credentials.
 */
export async function createProfessionalPrescription(
  prof: SafeProfessional,
  input: ProfessionalCreatePrescriptionInput,
) {
  // Confirm patient exists
  const patient = await prisma.user.findUnique({
    where: { id: input.patientId },
    select: { id: true },
  })
  if (!patient) {
    throw AppError.notFound("Patient not found")
  }

  const doctorName = formatProfessionalDisplayName(prof)
  const instructions = [
    input.route ? `Route: ${input.route}.` : "",
    input.instructions || "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return createPrescription({
    patientId: input.patientId,
    medicine: input.medicine,
    dose: input.dose,
    frequency: input.frequency,
    duration: input.duration,
    prescriber: doctorName,
    prescriberId: prof.id,
    status: PrescriptionStatus.ACTIVE,
    instructions: instructions || undefined,
    startDate: input.startDate,
    endDate: input.endDate,
  })
}

/**
 * PATCH /api/professional/prescriptions/:id/status
 * Updates a prescription status (ACTIVE, COMPLETED, DISCONTINUED).
 */
export async function updateProfessionalPrescriptionStatus(
  prof: SafeProfessional,
  idOrNumber: string,
  status: PrescriptionStatus,
) {
  const rx = await prisma.prescription.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { prescriptionNumber: idOrNumber }],
    },
  })

  if (!rx) {
    throw AppError.notFound(`Prescription '${idOrNumber}' not found`)
  }

  const updated = await prisma.prescription.update({
    where: { id: rx.id },
    data: {
      status,
      ...(status === PrescriptionStatus.COMPLETED ||
      status === PrescriptionStatus.DISCONTINUED
        ? { endDate: new Date() }
        : {}),
    },
  })

  const doctorName = formatProfessionalDisplayName(prof)
  await createNotification({
    userId: rx.patientId,
    type: NotificationType.PRESCRIPTION_ADDED,
    title: "Prescription Status Updated",
    message: `${doctorName} updated your prescription ${rx.prescriptionNumber} (${rx.medicine}) to ${status}.`,
    eventId: `evt_rx_status_${rx.prescriptionNumber}_${status}_${Date.now()}`,
    referenceType: "prescription",
    referenceId: rx.prescriptionNumber,
    link: "/patient?tab=medications",
  }).catch(() => {})

  return updated
}

/**
 * GET /api/professional/emergencies
 * Rule C: Emergency Break-Glass relationship bypass — verified professionals see active/responded emergencies.
 */
export async function getProfessionalEmergencies() {
  const cases = await prisma.emergencyCase.findMany({
    where: {
      status: {
        in: [EmergencyCaseStatus.ACTIVE, EmergencyCaseStatus.RESPONDED],
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          sex: true,
          dateOfBirth: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    patientId: c.patientId,
    patientName: `${c.patient.firstName} ${c.patient.lastName}`.trim(),
    patientAge: calculateAge(c.patient.dateOfBirth),
    patientSex: c.patient.sex,
    patientPhone: c.patient.phoneNumber,
    status: c.status,
    reason: c.reason,
    responderName: c.responderName,
    responderId: c.responderId,
    responderRole: c.responderRole,
    respondedAt: c.respondedAt ? c.respondedAt.toISOString() : null,
    snapshot: c.snapshot,
    createdAt: c.createdAt.toISOString(),
  }))
}

/**
 * POST /api/professional/emergencies/:caseNumber/access
 * Rule C: Access emergency-focused clinical record with compulsory immutable EmergencyAuditLog.
 */
export async function accessProfessionalEmergencyRecord(
  prof: SafeProfessional,
  caseNumber: string,
  justification: string,
  meta: { ipAddress?: string; userAgent?: string } = {},
) {
  return getEmergencyFocusedClinicalRecord(
    caseNumber,
    {
      justification,
      clinicianId: prof.id,
      clinicianName: formatProfessionalDisplayName(prof),
      clinicianRole: prof.category,
    },
    meta,
  )
}

/**
 * POST /api/professional/emergencies/:caseNumber/respond
 * Responding verified professional accepts an ACTIVE emergency case.
 */
export async function respondProfessionalEmergency(
  prof: SafeProfessional,
  caseNumber: string,
  notes?: string,
  meta: { ipAddress?: string; userAgent?: string } = {},
) {
  return respondToEmergencyCase(
    caseNumber,
    {
      responderName: formatProfessionalDisplayName(prof),
      responderId: prof.id,
      responderRole: prof.specialty || prof.profession,
      notes,
    },
    meta,
  )
}

/**
 * POST /api/professional/emergencies/:caseNumber/resolve
 * Marks an ACTIVE/RESPONDED emergency case as RESOLVED with immutable audit log & patient notification.
 */
export async function resolveProfessionalEmergency(
  prof: SafeProfessional,
  caseNumber: string,
  resolutionNotes: string,
  meta: { ipAddress?: string; userAgent?: string } = {},
) {
  const emergencyCase = await prisma.emergencyCase.findUnique({
    where: { caseNumber },
  })

  if (!emergencyCase) {
    throw AppError.notFound(`Emergency case ${caseNumber} not found`)
  }

  if (
    emergencyCase.status === EmergencyCaseStatus.CANCELLED ||
    emergencyCase.status === EmergencyCaseStatus.RESOLVED
  ) {
    throw AppError.badRequest(
      `Cannot resolve emergency case that is already ${emergencyCase.status}`,
    )
  }

  const doctorName = formatProfessionalDisplayName(prof)

  const updated = await prisma.$transaction(async (tx) => {
    const resolved = await tx.emergencyCase.update({
      where: { id: emergencyCase.id },
      data: {
        status: EmergencyCaseStatus.RESOLVED,
        responderId: emergencyCase.responderId || prof.id,
        responderName: emergencyCase.responderName || doctorName,
        responderRole:
          emergencyCase.responderRole || prof.specialty || prof.profession,
        respondedAt: emergencyCase.respondedAt || new Date(),
        resolvedAt: new Date(),
        resolutionNotes,
      },
    })

    await tx.emergencyAuditLog.create({
      data: {
        emergencyCaseId: emergencyCase.id,
        patientId: emergencyCase.patientId,
        actor: doctorName,
        actorId: prof.id,
        actorRole: prof.category,
        action: "BREAK_GLASS_RESOLVED",
        target: `Emergency Case #${emergencyCase.caseNumber}`,
        severity: "normal",
        justification: resolutionNotes,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    })

    return resolved
  })

  await createNotification({
    userId: emergencyCase.patientId,
    type: NotificationType.EMERGENCY_ALERT,
    title: "Emergency Case Resolved",
    message: `${doctorName} has marked emergency case #${emergencyCase.caseNumber} as resolved.`,
    eventId: `evt_emg_resolve_${emergencyCase.caseNumber}`,
    referenceType: "emergency",
    referenceId: emergencyCase.caseNumber,
    link: "/patient?tab=emergency",
  }).catch(() => {})

  return updated
}
