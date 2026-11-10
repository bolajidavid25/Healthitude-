import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import { getPatientCategoryMetadata } from "../utils/patientCategory"

import { ComplaintStatus, AppointmentStatus } from "../generated/prisma/enums"
import { formatDisplayDate } from "./appointmentService"

export interface DashboardMetricSummary {
  activeComplaintsCount: number
  underReviewComplaintsCount: number
  medicationsCount: number
  medicationsSummary: string
  nextAppointment: {
    date: string
    time: string
    doctor: string
    type: string
  } | null
  category: {
    code: string
    label: string
    verificationStatus: string
    isVerified: boolean
    nhisId: string | null
  }
}

export interface DashboardVitalItem {
  label: string
  value: string
  unit: string
  status: "green" | "yellow" | "red" | "gray"
}

export interface DashboardVitalsSummary {
  clinicallyVerified: boolean
  verifiedAt: Date | null
  items: DashboardVitalItem[]
}

export interface DashboardCareTeamMember {
  id: string
  name: string
  role: string
  specialty: string
  status: "VERIFIED" | "PENDING"
}

export interface PatientDashboardData {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePhoto: string | null
  }
  metrics: DashboardMetricSummary
  vitals: DashboardVitalsSummary
  careTeam: DashboardCareTeamMember[]
}

/**
 * Parses a patient-reported freeform medication string into discrete items.
 * Ignores empty or "none" values.
 */
function parseMedications(
  rawMedications?: string | null,
): { count: number; summary: string } {
  if (!rawMedications || !rawMedications.trim()) {
    return { count: 0, summary: "No active medications" }
  }

  const cleaned = rawMedications.trim()
  const lower = cleaned.toLowerCase()
  if (["none", "nil", "n/a", "no", "nothing", "none known"].includes(lower)) {
    return { count: 0, summary: "No active medications" }
  }

  const items = cleaned
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 && !["none", "nil", "n/a"].includes(item.toLowerCase()),
    )

  const count = items.length
  if (count === 0) {
    return { count: 0, summary: "No active medications" }
  }

  return {
    count,
    summary: `${count} reported medication${count > 1 ? "s" : ""}`,
  }
}

/**
 * Retrieves authoritative dashboard metrics and state for the authenticated patient.
 * Enforces patient-level authorization: caller must provide authenticated userId.
 */
export async function getPatientDashboard(
  userId: string,
): Promise<PatientDashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      healthProfile: true,
      patientCategory: true,
    },
  })

  if (!user) {
    throw AppError.notFound("Patient record not found")
  }

  // 1. Resolve Patient Category details
  let categoryCode = "GENERAL_PATIENT"
  let categoryLabel = "General Patient"
  let verificationStatus = "PENDING"
  let isVerified = false
  let nhisId: string | null = null

  if (user.patientCategory) {
    categoryCode = user.patientCategory.category
    verificationStatus = user.patientCategory.verificationStatus
    isVerified = user.patientCategory.verificationStatus === "VERIFIED"
    nhisId = user.patientCategory.nhisId

    try {
      const meta = getPatientCategoryMetadata(user.patientCategory.category)
      categoryLabel = meta.label
    } catch {
      categoryLabel = user.patientCategory.category.replace(/_/g, " ")
    }
  }

  // 2. Resolve Active Prescriptions from database (Step 6)
  const activePrescriptionsCount = await prisma.prescription.count({
    where: {
      patientId: userId,
      status: "ACTIVE",
    },
  })

  let medicationsCount = 0
  let medicationsSummary = "No active medications"

  if (activePrescriptionsCount > 0) {
    medicationsCount = activePrescriptionsCount
    medicationsSummary = `${activePrescriptionsCount} active prescription${
      activePrescriptionsCount > 1 ? "s" : ""
    }`
  } else {
    // Fallback to patient-reported medications from HealthProfile onboarding
    const medInfo = parseMedications(user.healthProfile?.currentMedications)
    medicationsCount = medInfo.count
    medicationsSummary = medInfo.summary
  }

  // 3. Assemble Metrics Summary with live Complaint counts
  const activeComplaintsCount = await prisma.complaint.count({
    where: {
      patientId: userId,
      status: {
        in: [
          ComplaintStatus.NEW,
          ComplaintStatus.UNDER_REVIEW,
          ComplaintStatus.REFERRED_TO_SPECIALIST,
        ],
      },
    },
  })

  const underReviewComplaintsCount = await prisma.complaint.count({
    where: {
      patientId: userId,
      status: ComplaintStatus.UNDER_REVIEW,
    },
  })

  // 4. Resolve Next Upcoming Appointment (Step 7)
  const nextApt = await prisma.appointment.findFirst({
    where: {
      patientId: userId,
      status: {
        in: [
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING_CONFIRMATION,
        ],
      },
    },
    orderBy: { date: "asc" },
  })

  const nextAppointment = nextApt
    ? {
        date: formatDisplayDate(nextApt.date),
        time: nextApt.time,
        doctor: nextApt.doctorName,
        type: nextApt.type,
      }
    : null

  const metrics: DashboardMetricSummary = {
    activeComplaintsCount,
    underReviewComplaintsCount,
    medicationsCount,
    medicationsSummary,
    nextAppointment,
    category: {
      code: categoryCode,
      label: categoryLabel,
      verificationStatus,
      isVerified,
      nhisId,
    },
  }

  // 4. Assemble Vitals Summary
  const vitals: DashboardVitalsSummary = {
    clinicallyVerified: user.healthProfile?.clinicallyVerified ?? false,
    verifiedAt: user.healthProfile?.verifiedAt ?? null,
    items: [], // Empty state until clinical vitals are recorded during encounter
  }

  // 5. Assemble Care Team
  const careTeam: DashboardCareTeamMember[] = [] // Empty state until provider relationship established

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
    },
    metrics,
    vitals,
    careTeam,
  }
}
