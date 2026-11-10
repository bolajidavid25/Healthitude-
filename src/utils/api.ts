/**
 * Centralized API Client for Healthitude
 * Handles cookie-based sessions, CSRF token attachment, typed responses,
 * error envelopes, and graceful offline/network failure handling.
 */

// -----------------------------------------------------------------------------
// Canonical Enums matching Prisma / Backend
// -----------------------------------------------------------------------------
export const Sex = {
  FEMALE: "FEMALE",
  MALE: "MALE",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
} as const
export type SexType = typeof Sex[keyof typeof Sex]

export const Relationship = {
  SPOUSE_PARTNER: "SPOUSE_PARTNER",
  PARENT: "PARENT",
  SIBLING: "SIBLING",
  CHILD: "CHILD",
  FRIEND: "FRIEND",
  OTHER: "OTHER",
} as const
export type RelationshipType = typeof Relationship[keyof typeof Relationship]

export const BloodGroup = {
  A_POSITIVE: "A_POSITIVE",
  A_NEGATIVE: "A_NEGATIVE",
  B_POSITIVE: "B_POSITIVE",
  B_NEGATIVE: "B_NEGATIVE",
  AB_POSITIVE: "AB_POSITIVE",
  AB_NEGATIVE: "AB_NEGATIVE",
  O_POSITIVE: "O_POSITIVE",
  O_NEGATIVE: "O_NEGATIVE",
  UNKNOWN: "UNKNOWN",
} as const
export type BloodGroupType = typeof BloodGroup[keyof typeof BloodGroup]

export const Genotype = {
  AA: "AA",
  AS: "AS",
  SS: "SS",
  AC: "AC",
  SC: "SC",
  UNKNOWN: "UNKNOWN",
} as const
export type GenotypeType = typeof Genotype[keyof typeof Genotype]

export const ConsentType = {
  TERMS_AND_PRIVACY: "TERMS_AND_PRIVACY",
  HEALTH_DATA_PROCESSING: "HEALTH_DATA_PROCESSING",
  PROFESSIONAL_ACCESS: "PROFESSIONAL_ACCESS",
  PATIENT_DATA_ACKNOWLEDGEMENT: "PATIENT_DATA_ACKNOWLEDGEMENT",
  AI_LIMITATIONS: "AI_LIMITATIONS",
  BREAK_GLASS_DISCLOSURE: "BREAK_GLASS_DISCLOSURE",
  INFORMATION_ACCURACY: "INFORMATION_ACCURACY",
} as const
export type ConsentTypeValue = typeof ConsentType[keyof typeof ConsentType]

export const MANDATORY_CONSENT_TYPES: ConsentTypeValue[] = [
  ConsentType.TERMS_AND_PRIVACY,
  ConsentType.HEALTH_DATA_PROCESSING,
  ConsentType.PROFESSIONAL_ACCESS,
  ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
  ConsentType.AI_LIMITATIONS,
  ConsentType.BREAK_GLASS_DISCLOSURE,
  ConsentType.INFORMATION_ACCURACY,
]

export const ComplaintSeverity = {
  MILD: "MILD",
  MODERATE: "MODERATE",
  SEVERE: "SEVERE",
} as const
export type ComplaintSeverityType = typeof ComplaintSeverity[keyof typeof ComplaintSeverity]

export const ComplaintStatus = {
  NEW: "NEW",
  UNDER_REVIEW: "UNDER_REVIEW",
  REFERRED_TO_SPECIALIST: "REFERRED_TO_SPECIALIST",
  RESOLVED: "RESOLVED",
} as const
export type ComplaintStatusType = typeof ComplaintStatus[keyof typeof ComplaintStatus]

export interface ComplaintRecord {
  id: string
  referenceId: string
  patientId: string
  symptoms: string
  severity: ComplaintSeverityType
  duration?: string | null
  status: ComplaintStatusType
  assignedDoctor?: string | null
  clinicalNotes?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateComplaintPayload {
  symptoms: string
  severity: ComplaintSeverityType | string
  duration?: string
}

export interface UpdateComplaintPayload {
  symptoms?: string
  severity?: ComplaintSeverityType | string
  duration?: string
}

export const ClinicalRecordType = {
  DIAGNOSIS: "DIAGNOSIS",
  VITAL_SIGNS: "VITAL_SIGNS",
  LAB_RESULT: "LAB_RESULT",
  TREATMENT_NOTE: "TREATMENT_NOTE",
  REFERRAL: "REFERRAL",
} as const
export type ClinicalRecordTypeValue = typeof ClinicalRecordType[keyof typeof ClinicalRecordType]

export interface ClinicalRecordItem {
  id: string
  recordNumber: string
  patientId: string
  type: ClinicalRecordTypeValue
  content: string
  author: string
  authorRole?: string | null
  authorId?: string | null
  verified: boolean
  verifiedAt: string
  attachmentName?: string | null
  attachmentUrl?: string | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export const PrescriptionStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  DISCONTINUED: "DISCONTINUED",
} as const
export type PrescriptionStatusType = typeof PrescriptionStatus[keyof typeof PrescriptionStatus]

export const AdherenceStatus = {
  TAKEN: "TAKEN",
  SKIPPED: "SKIPPED",
} as const
export type AdherenceStatusType = typeof AdherenceStatus[keyof typeof AdherenceStatus]

export interface PrescriptionItem {
  id: string
  prescriptionNumber: string
  medicine: string
  dose: string
  frequency: string
  duration: string
  prescriber: string
  prescriberId?: string | null
  status: PrescriptionStatusType
  instructions?: string | null
  startDate: string
  endDate?: string | null
  createdAt: string
  updatedAt: string
  adherence: (boolean | null)[]
}

export interface RecordAdherencePayload {
  date?: string
  status: AdherenceStatusType | boolean
  notes?: string
}

export const AppointmentStatus = {
  CONFIRMED: "CONFIRMED",
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const
export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus]

export interface AppointmentItem {
  id: string // appointmentNumber matching UI (e.g. APT-2026-0192)
  uuid: string
  appointmentNumber: string
  date: string // e.g. "Sep 18, 2026"
  rawDate: string // "2026-09-18"
  time: string // "10:00 AM"
  doctor: string // "Dr. K. Boateng"
  doctorId?: string | null
  department?: string | null
  type: string
  reason: string
  status: AppointmentStatusType
  symptoms?: string | null
  duration?: string | null
  severity?: string | null
  notes?: string | null
  documents: string[]
  referralDoc?: string | null
  schedulingUrl?: string | null
  cancellationReason?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentPayload {
  doctorName: string
  doctorId?: string
  department?: string
  type?: string
  reason: string
  date: string
  time: string
  symptoms?: string
  duration?: string
  severity?: string
  notes?: string
  documents?: string[]
  referralDoc?: string
  schedulingUrl?: string
}

export interface UpdateAppointmentIntakePayload {
  symptoms?: string
  duration?: string
  severity?: string
  notes?: string
  documents?: string[]
  referralDoc?: string
}

export interface RescheduleAppointmentPayload {
  date: string
  time: string
  reason?: string
}

export interface ProviderItem {
  id: string
  name: string
  specialty: string
  qualifications: string
  experience: string
  languages: string
  facility: string
  location: string
  consultType: string
  fee: string
  availability: string
  verified: boolean
  rating: number
  reviews?: number
  bio: string
  avatar: string
}

export interface ProviderListResponse {
  providers: ProviderItem[]
  total: number
  limit: number
  offset: number
  specialties: string[]
}

export interface TelemedicineSessionItem {
  sessionId: string
  sessionNumber: string
  appointmentId: string
  appointmentNumber: string
  patientId: string
  patientName: string
  doctorName: string
  doctorId?: string | null
  department?: string | null
  roomName: string
  roomToken: string
  schedulingUrl: string
  status: "IN_PROGRESS" | "ENDED"
  startedAt: string
  endedAt?: string | null
  durationSeconds?: number | null
  formattedDuration?: string | null
  exitReason?: string | null
  feedback?: string | null
  deviceType?: string | null
  browser?: string | null
}

// -----------------------------------------------------------------------------
// Mappings from UI Form Shorthands to Canonical Enums
// -----------------------------------------------------------------------------
export function mapSexToPrisma(val: string): SexType {
  const norm = (val || "").trim().toLowerCase()
  if (norm === "female" || norm === "f") return Sex.FEMALE
  if (norm === "male" || norm === "m") return Sex.MALE
  return Sex.PREFER_NOT_TO_SAY
}

export function mapRelationshipToPrisma(val: string): RelationshipType {
  const norm = (val || "").trim().toLowerCase()
  if (
    norm === "spouse" ||
    norm.includes("partner") ||
    norm === "spouse_partner"
  )
    return Relationship.SPOUSE_PARTNER
  if (norm === "parent") return Relationship.PARENT
  if (norm === "sibling") return Relationship.SIBLING
  if (norm === "child") return Relationship.CHILD
  if (norm === "friend") return Relationship.FRIEND
  return Relationship.OTHER
}

export function mapBloodGroupToPrisma(
  val?: string,
): BloodGroupType | undefined {
  if (!val || val === "unknown") return undefined
  const cleaned = val.replace(/\s+/g, "").toUpperCase()
  if (cleaned === "A+" || cleaned === "A_POSITIVE") return BloodGroup.A_POSITIVE
  if (cleaned === "A-" || cleaned === "A−" || cleaned === "A_NEGATIVE")
    return BloodGroup.A_NEGATIVE
  if (cleaned === "B+" || cleaned === "B_POSITIVE") return BloodGroup.B_POSITIVE
  if (cleaned === "B-" || cleaned === "B−" || cleaned === "B_NEGATIVE")
    return BloodGroup.B_NEGATIVE
  if (cleaned === "AB+" || cleaned === "AB_POSITIVE")
    return BloodGroup.AB_POSITIVE
  if (cleaned === "AB-" || cleaned === "AB−" || cleaned === "AB_NEGATIVE")
    return BloodGroup.AB_NEGATIVE
  if (cleaned === "O+" || cleaned === "O_POSITIVE") return BloodGroup.O_POSITIVE
  if (cleaned === "O-" || cleaned === "O−" || cleaned === "O_NEGATIVE")
    return BloodGroup.O_NEGATIVE
  return BloodGroup.UNKNOWN
}

export function mapGenotypeToPrisma(val?: string): GenotypeType | undefined {
  if (!val || val === "unknown") return undefined
  const upper = val.trim().toUpperCase()
  if (upper === "AA") return Genotype.AA
  if (upper === "AS") return Genotype.AS
  if (upper === "SS") return Genotype.SS
  if (upper === "AC") return Genotype.AC
  if (upper === "SC") return Genotype.SC
  return Genotype.UNKNOWN
}

// -----------------------------------------------------------------------------
// Response and Entity Types
// -----------------------------------------------------------------------------
export interface AuthUser {
  id: string
  firstName: string
  middleName?: string | null
  lastName: string
  email: string
  phoneNumber: string
  sex: SexType
  dateOfBirth: string
  profilePhoto?: string | null
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  userId: string
  street: string
  city: string
  state: string
  district?: string | null
}

export interface EmergencyContact {
  id: string
  userId: string
  fullName: string
  relationship: RelationshipType
  phoneNumber: string
}

export interface HealthProfile {
  id: string
  userId: string
  bloodGroup?: BloodGroupType | null
  genotype?: GenotypeType | null
  knownAllergies?: string | null
  medicalConditions?: string | null
  currentMedications?: string | null
  previousSurgeries?: string | null
  medicalHistory?: string | null
  patientReported: boolean
  clinicallyVerified: boolean
  verifiedAt?: string | null
}

export interface PatientCategoryRecord {
  id: string
  userId: string
  category: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  nhisId?: string | null
  nhisSchemeType?: string | null
  supportingDocument?: string | null
}

export interface ConsentRecord {
  id: string
  userId: string
  consentType: ConsentTypeValue
  accepted: boolean
  acceptedAt?: string
  version: string
}

export interface PatientProfileResponse {
  user: AuthUser
  address?: Address | null
  emergencyContact?: EmergencyContact | null
  healthProfile?: HealthProfile | null
  patientCategory?: PatientCategoryRecord | null
  consents?: ConsentRecord[]
}

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
  verifiedAt: string | null
  items: DashboardVitalItem[]
}

export interface DashboardCareTeamMember {
  id: string
  name: string
  role: string
  specialty: string
  status: "VERIFIED" | "PENDING"
}

export interface PatientDashboardResponse {
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

export interface OnboardingStatusResponse {
  isComplete: boolean
  completedStages: {
    account: boolean
    contact: boolean
    healthProfile: boolean
    category: boolean
    consents: boolean
  }
  missingStages: string[]
  missingRequiredFields: string[]
  missingConsents: string[]
  totalConsentsAccepted: number
  nextRecommendedAction: string
}

// -----------------------------------------------------------------------------
// Notification Enums & Interfaces (Step 12)
// -----------------------------------------------------------------------------
export const NotificationType = {
  APPOINTMENT_CONFIRMED: "APPOINTMENT_CONFIRMED",
  APPOINTMENT_RESCHEDULED: "APPOINTMENT_RESCHEDULED",
  APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
  COMPLAINT_SUBMITTED: "COMPLAINT_SUBMITTED",
  COMPLAINT_UPDATED: "COMPLAINT_UPDATED",
  CLINICAL_RECORD_ADDED: "CLINICAL_RECORD_ADDED",
  PRESCRIPTION_ADDED: "PRESCRIPTION_ADDED",
  EMERGENCY_ALERT: "EMERGENCY_ALERT",
  GENERAL: "GENERAL",
} as const
export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType]

export interface NotificationItem {
  id: string
  type: NotificationTypeValue
  title: string
  message: string
  body: string
  read: boolean
  readAt?: string | null
  eventId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  link?: string | null
  time: string
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}

export interface FieldError {
  field: string
  message: string
  code?: string
}

export interface ErrorResponseEnvelope {
  status: "error"
  code: string
  message: string
  errors?: FieldError[]
}

// -----------------------------------------------------------------------------
// Professional & Administrator Portal Interfaces (Step 2)
// -----------------------------------------------------------------------------
export type ProfessionalCategoryType =
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "SPECIALIST"
  | "CLINICAL_OFFICER"

export type ProfessionalVerificationStatusType =
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"

export type ProfessionalAccountStatusType =
  | "ACTIVE"
  | "RESTRICTED"
  | "SUSPENDED"
  | "DEACTIVATED"

export interface ProfessionalItem {
  id: string
  professionalId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  category: ProfessionalCategoryType
  specialty?: string | null
  licenceNumber: string
  licenceExpiry?: string | null
  regulatoryBody?: string | null
  facility?: string | null
  verificationStatus: ProfessionalVerificationStatusType
  accountStatus: ProfessionalAccountStatusType
  verifiedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfessionalRegisterPayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  category?: ProfessionalCategoryType | string
  specialty?: string
  licenceNumber: string
  licenceExpiry?: string
  regulatoryBody?: string
  facility?: string
}

export interface ProfessionalLoginPayload {
  email: string
  password: string
}

export interface AdministratorItem {
  id: string
  adminId: string
  name: string
  email: string
  role: string
  status: string
  lastLoginAt?: string | null
}

export interface AdminLoginPayload {
  email: string
  password: string
}

export interface AdminReviewPayload {
  action: "APPROVE" | "REJECT" | "REQUEST_INFO"
  rejectionReason?: string
  reviewNotes?: string
}

// -----------------------------------------------------------------------------
// ApiError Class
// -----------------------------------------------------------------------------
export class ApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly errors: FieldError[]

  constructor(
    status: number,
    code: string,
    message: string,
    errors: FieldError[] = [],
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.errors = errors
  }

  /**
   * Helper to index errors by field name for UI form highlighting
   */
  getFieldErrors(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const err of this.errors) {
      if (err.field && !map[err.field]) {
        map[err.field] = err.message
      }
    }
    return map
  }
}

// -----------------------------------------------------------------------------
// Base Fetch Client & CSRF Handler
// -----------------------------------------------------------------------------
let inMemoryCsrfToken: string | null = null

export function setCachedCsrfToken(token: string | null) {
  inMemoryCsrfToken = token
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"),
  )
  return match ? decodeURIComponent(match[3]) : null
}

export function getCsrfToken(): string | null {
  return inMemoryCsrfToken || getCookie("healthitude_csrf")
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
)

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`
  const method = (options.method || "GET").toUpperCase()

  const headers = new Headers(options.headers || {})
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  // Attach CSRF token on mutating requests
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const isProf = endpoint.includes("/api/professional")
    const isAdmin = endpoint.includes("/api/admin")
    const cookieName = isAdmin
      ? "healthitude_admin_csrf"
      : isProf
        ? "healthitude_prof_csrf"
        : "healthitude_csrf"
    const csrfEndpoint = isAdmin
      ? "/api/admin/csrf"
      : isProf
        ? "/api/professional/csrf"
        : "/api/auth/csrf"

    let csrf = getCookie(cookieName) || getCsrfToken()
    if (!csrf) {
      try {
        const csrfRes = await fetch(`${API_BASE_URL}${csrfEndpoint}`, {
          credentials: "include",
        })
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json()
          csrf =
            csrfData.csrfToken ||
            csrfData.data?.csrfToken ||
            getCookie(cookieName)
          if (csrf) setCachedCsrfToken(csrf)
        }
      } catch {
        // Continue and let backend validation respond
      }
    }
    if (csrf) {
      headers.set("x-csrf-token", csrf)
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Required for session cookies
    })

    // Check Set-Cookie or JSON body for CSRF token
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json")
    const rawData = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const errorData = (
        typeof rawData === "object" && rawData !== null ? rawData : {}
      ) as ErrorResponseEnvelope
      throw new ApiError(
        response.status,
        errorData.code || "REQUEST_FAILED",
        errorData.message ||
          (typeof rawData === "string"
            ? rawData
            : `HTTP Error ${response.status}`),
        errorData.errors || [],
      )
    }

    if (rawData && typeof rawData === "object" && "csrfToken" in rawData) {
      setCachedCsrfToken((rawData as any).csrfToken)
    } else if (
      rawData &&
      typeof rawData === "object" &&
      rawData.data?.csrfToken
    ) {
      setCachedCsrfToken(rawData.data.csrfToken)
    }

    return rawData as T
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err
    }
    // Network errors (e.g. server offline, CORS blocked, DNS failure)
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Unable to communicate with the Healthitude server. Please check your network connection and verify the backend is running.",
      [],
    )
  }
}

// -----------------------------------------------------------------------------
// Pricing and Coverage Types (Step 10)
// -----------------------------------------------------------------------------
export interface PricingServiceRate {
  service: string
  standardRate: number
  patientCopay: number
  partnerCoverage: number
  healthitudeFee: number
  standard: string
  patient: string
  partner: string
  healthitude: string
}

export interface PricingPlanItem {
  name: string
  categoryCode: string
  categoryEnum: string
  effectiveFrom: string
  currency: string
  services: PricingServiceRate[]
}

export interface PatientPricingCategoryInfo {
  code: string
  prismaEnum: string
  name: string
  rank: number
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  evidence: string
  nhisId: string | null
  nhisSchemeType: string | null
  supportingDocument: string | null
  hasSupportingDocument: boolean
  requiresEvidence: boolean
  updatedAt: string | null
}

export interface CategorySummaryItem {
  rank: number
  code: string
  name: string
  requiresEvidence: boolean
  isActive: boolean
}

export interface PatientPricingResponse {
  category: PatientPricingCategoryInfo
  plan: PricingPlanItem
  allCategories: CategorySummaryItem[]
}

export interface RequestCategoryChangePayload {
  category: string
  nhisId?: string
  nhisSchemeType?: string
  supportingDocument?: string
}

// -----------------------------------------------------------------------------
// Emergency and Break-Glass Types (Step 11)
// -----------------------------------------------------------------------------
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
  status: "ACTIVE" | "RESPONDED" | "RESOLVED" | "CANCELLED"
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

// -----------------------------------------------------------------------------
// Centralized API Services
// -----------------------------------------------------------------------------
export const api = {
  // Authentication
  auth: {
    async login(credentials: { email: string password: string }) {
      const res = await fetchApi<{
        status: string
        message: string
        data: {
          user: AuthUser
          csrfToken: string
          session: { id: string expiresAt: string }
        }
      }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })
      if (res.data?.csrfToken) setCachedCsrfToken(res.data.csrfToken)
      return res.data
    },

    async logout() {
      try {
        await fetchApi<{ status: string message: string }>("/api/auth/logout", {
          method: "POST",
        })
      } finally {
        setCachedCsrfToken(null)
      }
    },

    async me() {
      const res = await fetchApi<{
        status: string
        data: { user: AuthUser session: { id: string expiresAt: string } }
      }>("/api/auth/me")
      return res.data
    },

    async csrf() {
      const res = await fetchApi<{
        status: string
        csrfToken?: string
        data?: { csrfToken: string }
      }>("/api/auth/csrf")
      const token = res.csrfToken || res.data?.csrfToken || ""
      if (token) setCachedCsrfToken(token)
      return token
    },
  },

  // Patient Onboarding & Profile
  patient: {
    async register(payload: any) {
      const res = await fetchApi<{
        status: string
        message: string
        data: {
          user: AuthUser
          address: Address
          emergencyContact: EmergencyContact
          healthProfile: HealthProfile
          patientCategory: PatientCategoryRecord
          consents: ConsentRecord[]
        }
      }>("/api/patients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async getDashboard(): Promise<PatientDashboardResponse> {
      const res = await fetchApi<{
        status: string
        data: PatientDashboardResponse
      }>("/api/patient/dashboard")
      return res.data
    },

    async getProfile(): Promise<PatientProfileResponse> {
      const res = await fetchApi<{
        status: string
        data: PatientProfileResponse
      }>("/api/patient/profile")
      return res.data
    },

    async updateProfile(patch: any): Promise<PatientProfileResponse> {
      const res = await fetchApi<{
        status: string
        message: string
        data: PatientProfileResponse
      }>("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      return res.data
    },

    async getOnboardingStatus(): Promise<OnboardingStatusResponse> {
      const res = await fetchApi<{
        status: string
        data: OnboardingStatusResponse
      }>("/api/patient/onboarding-status")
      return res.data
    },

    async getCategoryStatus(): Promise<PatientCategoryRecord> {
      const res = await fetchApi<{
        status: string
        data: PatientCategoryRecord
      }>("/api/patient/category-status")
      return res.data
    },

    async getConsents(): Promise<ConsentRecord[]> {
      const res = await fetchApi<{
        status: string
        data: { consents: ConsentRecord[] }
      }>("/api/patient/consents")
      return res.data.consents
    },

    async recordConsent(consent: {
      consentType: ConsentTypeValue
      accepted: boolean
      version: string
    }): Promise<ConsentRecord> {
      const res = await fetchApi<{
        status: string
        message: string
        data: ConsentRecord
      }>("/api/patient/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consent),
      })
      return res.data
    },

    async uploadProfilePhoto(file: File) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetchApi<{
        status: string
        message: string
        data: { profilePhoto: string storageKey: string }
      }>("/api/patient/profile-photo", {
        method: "POST",
        body: formData,
      })
      return res.data
    },

    async deleteProfilePhoto() {
      const res = await fetchApi<{ status: string message: string }>(
        "/api/patient/profile-photo",
        {
          method: "DELETE",
        },
      )
      return res
    },

    async uploadCategoryDocument(file: File) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetchApi<{
        status: string
        message: string
        data: {
          supportingDocument: string
          storageKey: string
          verificationStatus: string
        }
      }>("/api/patient/category-document", {
        method: "POST",
        body: formData,
      })
      return res.data
    },

    async changePassword(payload: {
      currentPassword: string
      newPassword: string
      confirmNewPassword: string
    }) {
      const res = await fetchApi<{ status: string message: string }>(
        "/api/patient/change-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      return res
    },

    async getComplaints(): Promise<ComplaintRecord[]> {
      const res = await fetchApi<{
        status: string
        data: ComplaintRecord[]
      }>("/api/patient/complaints")
      return res.data
    },

    async getComplaint(id: string): Promise<ComplaintRecord> {
      const res = await fetchApi<{
        status: string
        data: ComplaintRecord
      }>(`/api/patient/complaints/${id}`)
      return res.data
    },

    async createComplaint(
      payload: CreateComplaintPayload,
    ): Promise<ComplaintRecord> {
      const res = await fetchApi<{
        status: string
        message: string
        data: ComplaintRecord
      }>("/api/patient/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async updateComplaint(
      id: string,
      payload: UpdateComplaintPayload,
    ): Promise<ComplaintRecord> {
      const res = await fetchApi<{
        status: string
        message: string
        data: ComplaintRecord
      }>(`/api/patient/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async getClinicalRecords(type?: string): Promise<ClinicalRecordItem[]> {
      const query =
        type && type !== "ALL" ? `?type=${encodeURIComponent(type)}` : ""
      const res = await fetchApi<{
        status: string
        data: ClinicalRecordItem[]
      }>(`/api/patient/records${query}`)
      return res.data
    },

    async getClinicalRecord(id: string): Promise<ClinicalRecordItem> {
      const res = await fetchApi<{
        status: string
        data: ClinicalRecordItem
      }>(`/api/patient/records/${id}`)
      return res.data
    },

    async getPrescriptions(): Promise<PrescriptionItem[]> {
      const res = await fetchApi<{
        status: string
        data: PrescriptionItem[]
      }>("/api/patient/prescriptions")
      return res.data
    },

    async getPrescription(id: string): Promise<PrescriptionItem> {
      const res = await fetchApi<{
        status: string
        data: PrescriptionItem
      }>(`/api/patient/prescriptions/${id}`)
      return res.data
    },

    async recordAdherence(
      id: string,
      payload: RecordAdherencePayload,
    ): Promise<PrescriptionItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: PrescriptionItem
      }>(`/api/patient/prescriptions/${id}/adherence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async getAppointments(
      tab?: "upcoming" | "completed" | "cancelled",
    ): Promise<AppointmentItem[]> {
      const query = tab ? `?tab=${encodeURIComponent(tab)}` : ""
      const res = await fetchApi<{
        status: string
        data: AppointmentItem[]
      }>(`/api/patient/appointments${query}`)
      return res.data
    },

    async getAppointment(id: string): Promise<AppointmentItem> {
      const res = await fetchApi<{
        status: string
        data: AppointmentItem
      }>(`/api/patient/appointments/${id}`)
      return res.data
    },

    async createAppointment(
      payload: CreateAppointmentPayload,
    ): Promise<AppointmentItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: AppointmentItem
      }>("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async submitAppointmentIntake(
      id: string,
      payload: UpdateAppointmentIntakePayload,
    ): Promise<AppointmentItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: AppointmentItem
      }>(`/api/patient/appointments/${id}/intake`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async rescheduleAppointment(
      id: string,
      payload: RescheduleAppointmentPayload,
    ): Promise<AppointmentItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: AppointmentItem
      }>(`/api/patient/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async cancelAppointment(
      id: string,
      reason?: string,
    ): Promise<AppointmentItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: AppointmentItem
      }>(`/api/patient/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      return res.data
    },

    // Telemedicine Video Consultation (Step 9)
    async startTelemedicine(
      appointmentId: string,
      metadata?: { deviceType?: string browser?: string },
    ): Promise<TelemedicineSessionItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: TelemedicineSessionItem
      }>(`/api/patient/appointments/${appointmentId}/telemedicine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata || {}),
      })
      return res.data
    },

    async getTelemedicine(
      appointmentId: string,
    ): Promise<TelemedicineSessionItem> {
      const res = await fetchApi<{
        status: string
        data: TelemedicineSessionItem
      }>(`/api/patient/appointments/${appointmentId}/telemedicine`)
      return res.data
    },

    async getTelemedicineSession(
      sessionId: string,
    ): Promise<TelemedicineSessionItem> {
      const res = await fetchApi<{
        status: string
        data: TelemedicineSessionItem
      }>(`/api/patient/telemedicine/sessions/${sessionId}`)
      return res.data
    },

    async endTelemedicine(
      sessionIdOrAppointmentId: string,
      payload?: { exitReason?: string feedback?: string },
    ): Promise<TelemedicineSessionItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: TelemedicineSessionItem
      }>(`/api/patient/telemedicine/sessions/${sessionIdOrAppointmentId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      })
      return res.data
    },

    // Pricing & Coverage (Step 10)
    async getPricing(): Promise<PatientPricingResponse> {
      const res = await fetchApi<{
        status: string
        data: PatientPricingResponse
      }>("/api/patient/pricing")
      return res.data
    },

    async getPricingPlans(): Promise<PricingPlanItem[]> {
      const res = await fetchApi<{
        status: string
        data: PricingPlanItem[]
      }>("/api/patient/pricing/plans")
      return res.data
    },

    async updateCategory(
      payload: RequestCategoryChangePayload,
    ): Promise<PatientPricingResponse> {
      const res = await fetchApi<{
        status: string
        message: string
        data: PatientPricingResponse
      }>("/api/patient/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    // Emergency & Break-Glass (Step 11)
    async getEmergency(): Promise<PatientEmergencyStatusResponse> {
      const res = await fetchApi<{
        status: string
        data: PatientEmergencyStatusResponse
      }>("/api/patient/emergency")
      return res.data
    },

    async initiateEmergency(payload?: {
      reason?: string
      symptoms?: string
    }): Promise<{
      emergencyCase: EmergencyCaseItem
      snapshot: EmergencySnapshot
    }> {
      const res = await fetchApi<{
        status: string
        message: string
        data: { emergencyCase: EmergencyCaseItem snapshot: EmergencySnapshot }
      }>("/api/patient/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      })
      return res.data
    },

    async cancelEmergency(payload?: {
      reason?: string
    }): Promise<EmergencyCaseItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: EmergencyCaseItem
      }>("/api/patient/emergency/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      })
      return res.data
    },

    async respondEmergency(
      caseNumber: string,
      payload: {
        responderName: string
        responderId?: string
        responderRole?: string
        notes?: string
      },
    ): Promise<EmergencyCaseItem> {
      const res = await fetchApi<{
        status: string
        message: string
        data: EmergencyCaseItem
      }>(`/api/patient/emergency/${caseNumber}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    async getEmergencyClinicalRecord(
      caseNumber: string,
      payload: {
        justification: string
        clinicianId: string
        clinicianName: string
        clinicianRole?: string
      },
    ): Promise<any> {
      const res = await fetchApi<{
        status: string
        data: any
      }>(`/api/patient/emergency/${caseNumber}/clinical-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return res.data
    },

    // In-App Notifications (Step 12)
    notifications: {
      async getAll(params?: {
        page?: number
        limit?: number
        unreadOnly?: boolean
      }): Promise<NotificationListResponse> {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set("page", String(params.page))
        if (params?.limit) searchParams.set("limit", String(params.limit))
        if (params?.unreadOnly) searchParams.set("unreadOnly", "true")
        const query = searchParams.toString()
          ? `?${searchParams.toString()}`
          : ""
        const res = await fetchApi<{
          status: string
          data: NotificationListResponse
        }>(`/api/patient/notifications${query}`)
        return res.data
      },

      async getUnreadCount(): Promise<{ unreadCount: number }> {
        const res = await fetchApi<{
          status: string
          data: { unreadCount: number }
        }>("/api/patient/notifications/unread-count")
        return res.data
      },

      async markAsRead(id: string): Promise<NotificationItem> {
        const res = await fetchApi<{
          status: string
          message: string
          data: NotificationItem
        }>(`/api/patient/notifications/${id}/read`, {
          method: "PATCH",
        })
        return res.data
      },

      async markAllAsRead(): Promise<{
        updatedCount: number
        unreadCount: number
      }> {
        const res = await fetchApi<{
          status: string
          message: string
          data: { updatedCount: number unreadCount: number }
        }>("/api/patient/notifications/mark-all-read", {
          method: "PATCH",
        })
        return res.data
      },

      async delete(id: string): Promise<{ success: boolean id: string }> {
        const res = await fetchApi<{
          status: string
          message: string
          data: { success: boolean id: string }
        }>(`/api/patient/notifications/${id}`, {
          method: "DELETE",
        })
        return res.data
      },
    },
  },

  // Provider Discovery (Step 8)
  providers: {
    async getAll(params?: {
      search?: string
      specialty?: string
      consultType?: string
      limit?: number
      offset?: number
    }): Promise<ProviderListResponse> {
      const searchParams = new URLSearchParams()
      if (params?.search) searchParams.set("search", params.search)
      if (params?.specialty) searchParams.set("specialty", params.specialty)
      if (params?.consultType)
        searchParams.set("consultType", params.consultType)
      if (params?.limit) searchParams.set("limit", String(params.limit))
      if (params?.offset) searchParams.set("offset", String(params.offset))
      const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
      const res = await fetchApi<{
        status: string
        data: ProviderListResponse
      }>(`/api/patient/providers${query}`)
      return res.data
    },

    async getById(id: string): Promise<ProviderItem> {
      const res = await fetchApi<{
        status: string
        data: ProviderItem
      }>(`/api/patient/providers/${id}`)
      return res.data
    },
  },

  // Professional Portal Subsystem (Step 2)
  professional: {
    async register(payload: ProfessionalRegisterPayload) {
      return fetchApi<{
        status: string
        message: string
        data: ProfessionalItem
      }>("/api/professional/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },

    async login(credentials: ProfessionalLoginPayload) {
      return fetchApi<{
        status: string
        message: string
        professional: ProfessionalItem
        hasCsrfToken: boolean
        data?: {
          professional: ProfessionalItem
          verificationStatus: ProfessionalVerificationStatusType
          isVerified: boolean
        }
      }>("/api/professional/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })
    },

    async logout() {
      return fetchApi<{
        status: string
        message: string
      }>("/api/professional/logout", {
        method: "POST",
      })
    },

    async me() {
      return fetchApi<{
        status: string
        data: {
          professional: ProfessionalItem
        }
      }>("/api/professional/me")
    },

    async getVerificationStatus() {
      return fetchApi<{
        status: string
        data: {
          professionalId: string
          fullName: string
          category: string
          verificationStatus: ProfessionalVerificationStatusType
          accountStatus: ProfessionalAccountStatusType
          isVerified: boolean
          auditTrail: Array<{
            id: string
            action: string
            actorRole: string
            reason?: string | null
            notes?: string | null
            createdAt: string
          }>
        }
      }>("/api/professional/verification-status")
    },

    async updateProfile(payload: Partial<ProfessionalRegisterPayload>) {
      return fetchApi<{
        status: string
        message: string
        data: ProfessionalItem
      }>("/api/professional/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },

    async probeClinicalAccess() {
      return fetchApi<{
        status: string
        message: string
        professional: {
          id: string
          name: string
          verificationStatus: string
        }
      }>("/api/professional/clinical-access-probe")
    },
  },

  // Administrator Portal Subsystem (Step 2)
  admin: {
    async login(credentials: AdminLoginPayload) {
      return fetchApi<{
        status: string
        message: string
        administrator: AdministratorItem
        scope: string
        hasCsrfToken: boolean
        sessionExpiresAt: string
      }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })
    },

    async logout() {
      return fetchApi<{
        status: string
        message: string
      }>("/api/admin/logout", {
        method: "POST",
      })
    },

    async me() {
      return fetchApi<{
        status: string
        data: {
          admin: AdministratorItem
        }
      }>("/api/admin/me")
    },

    async getProfessionals(params?: {
      status?: string
      category?: string
      page?: number
      limit?: number
    }) {
      const sp = new URLSearchParams()
      if (params?.status) sp.set("status", params.status)
      if (params?.category) sp.set("category", params.category)
      if (params?.page) sp.set("page", String(params.page))
      if (params?.limit) sp.set("limit", String(params.limit))
      const qs = sp.toString() ? `?${sp.toString()}` : ""
      return fetchApi<{
        status: string
        data: {
          professionals: ProfessionalItem[]
          total: number
          page: number
          limit: number
          totalPages: number
        }
      }>(`/api/admin/professionals${qs}`)
    },

    async reviewProfessional(id: string, payload: AdminReviewPayload) {
      return fetchApi<{
        status: string
        message: string
        data: {
          professional: ProfessionalItem
          log: any
        }
      }>(`/api/admin/professionals/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },

    async getAuditLogs(params?: {
      professionalId?: string
      adminId?: string
      action?: string
      page?: number
      limit?: number
    }) {
      const sp = new URLSearchParams()
      if (params?.professionalId) sp.set("professionalId", params.professionalId)
      if (params?.adminId) sp.set("adminId", params.adminId)
      if (params?.action) sp.set("action", params.action)
      if (params?.page) sp.set("page", String(params.page))
      if (params?.limit) sp.set("limit", String(params.limit))
      const qs = sp.toString() ? `?${sp.toString()}` : ""
      return fetchApi<{
        status: string
        data: {
          logs: any[]
          total: number
          page: number
          limit: number
          totalPages: number
        }
      }>(`/api/admin/audit-logs${qs}`)
    },
  },

  // Health probe
  health: {
    async check() {
      return fetchApi<{
        status: string
        service: string
        uptimeSeconds: number
        database: { status: string }
      }>("/api/health")
    },
  },
}
