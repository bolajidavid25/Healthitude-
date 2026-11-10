import { prisma } from "../config/prisma"
import { comparePassword, hashPassword } from "../utils/password"
import { AppError, ErrorCode } from "../errors/AppError"
import {
  RegisterProfessionalInput,
  LoginProfessionalInput,
  UpdateProfessionalProfileInput,
  ReviewVerificationInput,
  CreateCredentialDocumentInput,
  VerificationAction,
} from "../validation/professional"
import {
  generateSessionToken,
  generateCsrfToken,
  hashSessionToken,
} from "../utils/session"
import { PROF_SESSION_TTL_MS } from "../utils/professionalSession"
import {
  Professional,
  ProfessionalCategory,
  ProfessionalVerificationStatus,
  ProfessionalAccountStatus,
} from "../generated/prisma/enums"

const TIMING_SAFETY_DUMMY_HASH =
  "$2a$12$e8F0sM9d5H4/K0z7qW2sA.hFfK4c1x0W1L.e2/P5b7M3N1O9Q7R2S"

export interface SafeProfessional {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phoneNumber: string
  category: ProfessionalCategory
  profession: string
  specialty: string
  specialistQualification: string | null
  licenceNumber: string
  licenceExpiry: Date
  regulatoryBody: string
  facility: string
  qualification: string | null
  institution: string | null
  graduationYear: number | null
  verificationStatus: ProfessionalVerificationStatus
  accountStatus: ProfessionalAccountStatus
  restrictions: string | null
  profilePhoto: string | null
  verifiedAt: Date | null
  reviewedAt: Date | null
  reviewedBy: string | null
  rejectionReason: string | null
  decisionNotes: string | null
  revalidationDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export function sanitizeProfessional(p: Professional): SafeProfessional {
  return {
    id: p.id,
    firstName: p.firstName,
    middleName: p.middleName,
    lastName: p.lastName,
    email: p.email,
    phoneNumber: p.phoneNumber,
    category: p.category,
    profession: p.profession,
    specialty: p.specialty,
    specialistQualification: p.specialistQualification,
    licenceNumber: p.licenceNumber,
    licenceExpiry: p.licenceExpiry,
    regulatoryBody: p.regulatoryBody,
    facility: p.facility,
    qualification: p.qualification,
    institution: p.institution,
    graduationYear: p.graduationYear,
    verificationStatus: p.verificationStatus,
    accountStatus: p.accountStatus,
    restrictions: p.restrictions,
    profilePhoto: p.profilePhoto,
    verifiedAt: p.verifiedAt,
    reviewedAt: p.reviewedAt,
    reviewedBy: p.reviewedBy,
    rejectionReason: p.rejectionReason,
    decisionNotes: p.decisionNotes,
    revalidationDate: p.revalidationDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

/**
 * Valid Verification State Machine Transitions
 * Rule 5: Strict state transitions enforced on the backend.
 * Invalid status transitions are strictly rejected.
 */
export const VALID_VERIFICATION_TRANSITIONS: Record<
  ProfessionalVerificationStatus,
  ProfessionalVerificationStatus[]
> = {
  PENDING: [
    ProfessionalVerificationStatus.UNDER_REVIEW,
    ProfessionalVerificationStatus.REJECTED,
  ],
  UNDER_REVIEW: [
    ProfessionalVerificationStatus.UNDER_REVIEW,
    ProfessionalVerificationStatus.VERIFIED,
    ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS,
    ProfessionalVerificationStatus.REJECTED,
    ProfessionalVerificationStatus.PENDING,
  ],
  VERIFIED: [
    ProfessionalVerificationStatus.VERIFIED,
    ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS,
    ProfessionalVerificationStatus.SUSPENDED,
    ProfessionalVerificationStatus.EXPIRED,
    ProfessionalVerificationStatus.REVOKED,
    ProfessionalVerificationStatus.UNDER_REVIEW,
  ],
  VERIFIED_WITH_RESTRICTIONS: [
    ProfessionalVerificationStatus.VERIFIED,
    ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS,
    ProfessionalVerificationStatus.SUSPENDED,
    ProfessionalVerificationStatus.EXPIRED,
    ProfessionalVerificationStatus.REVOKED,
    ProfessionalVerificationStatus.UNDER_REVIEW,
  ],
  SUSPENDED: [
    ProfessionalVerificationStatus.VERIFIED,
    ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS,
    ProfessionalVerificationStatus.REVOKED,
    ProfessionalVerificationStatus.UNDER_REVIEW,
  ],
  EXPIRED: [
    ProfessionalVerificationStatus.UNDER_REVIEW,
    ProfessionalVerificationStatus.REVOKED,
  ],
  REJECTED: [ProfessionalVerificationStatus.UNDER_REVIEW],
  REVOKED: [ProfessionalVerificationStatus.UNDER_REVIEW],
}

export interface ProfessionalLoginResult {
  rawToken: string
  csrfToken: string
  professional: SafeProfessional
  session: {
    id: string
    expiresAt: Date
  }
}

/**
 * Registers a new healthcare professional with default PENDING verification status.
 * Rule 3: Validates required registration information, prevents duplicate accounts,
 * securely hashes credentials, and prevents privilege escalation.
 */
export async function registerProfessional(
  input: RegisterProfessionalInput,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<SafeProfessional> {
  const normalizedEmail = input.email.trim().toLowerCase()

  // 1. Uniqueness checks across Professional table
  const existingEmail = await prisma.professional.findUnique({
    where: { email: normalizedEmail },
  })
  if (existingEmail) {
    throw AppError.conflict("A professional account with this email address already exists")
  }

  const existingPhone = await prisma.professional.findUnique({
    where: { phoneNumber: input.phoneNumber },
  })
  if (existingPhone) {
    throw AppError.conflict("A professional account with this phone number already exists")
  }

  const existingLicence = await prisma.professional.findUnique({
    where: { licenceNumber: input.licenceNumber },
  })
  if (existingLicence) {
    throw AppError.conflict("A professional account with this licence number already exists")
  }

  // 2. Hash password (bcrypt work factor 12)
  const passwordHash = await hashPassword(input.password)

  // 3. Create Professional record with PENDING verification status
  const professional = await prisma.professional.create({
    data: {
      firstName: input.firstName,
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName,
      email: normalizedEmail,
      phoneNumber: input.phoneNumber,
      passwordHash,
      category: ProfessionalCategory.DOCTOR,
      profession: input.profession?.trim() || "Medical Doctor",
      specialty: input.specialty,
      specialistQualification: input.specialistQualification?.trim() || null,
      licenceNumber: input.licenceNumber,
      licenceExpiry: input.licenceExpiry,
      regulatoryBody: input.regulatoryBody,
      facility: input.facility,
      qualification: input.qualification?.trim() || null,
      institution: input.institution?.trim() || null,
      graduationYear: input.graduationYear || null,
      verificationStatus: ProfessionalVerificationStatus.PENDING,
      accountStatus: ProfessionalAccountStatus.ACTIVE,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  })

  // 4. Initial audit log entry
  await prisma.professionalVerificationLog.create({
    data: {
      professionalId: professional.id,
      action: "REGISTER",
      fromStatus: ProfessionalVerificationStatus.PENDING,
      toStatus: ProfessionalVerificationStatus.PENDING,
      adminId: "SYSTEM",
      reason: "Initial professional registration submitted for verification review",
      notes: "Account created in PENDING status. Clinical privileges locked pending admin review.",
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  })

  return sanitizeProfessional(professional)
}

/**
 * Authenticates a professional and issues a cryptographically secure session.
 * Rule 2: Independent authentication infrastructure and session separation.
 */
export async function loginProfessional(
  input: LoginProfessionalInput,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<ProfessionalLoginResult> {
  const normalizedEmail = input.email.trim().toLowerCase()

  // 1. Look up professional in Professional table
  const professional = await prisma.professional.findUnique({
    where: { email: normalizedEmail },
  })

  if (!professional) {
    // Constant-time execution to prevent email enumeration timing side-channels
    await comparePassword(input.password, TIMING_SAFETY_DUMMY_HASH)
    throw AppError.invalidCredentials("Invalid email or password")
  }

  // 2. Verify password
  const isValidPassword = await comparePassword(input.password, professional.passwordHash)
  if (!isValidPassword) {
    throw AppError.invalidCredentials("Invalid email or password")
  }

  // 3. Check account status
  if (professional.accountStatus === ProfessionalAccountStatus.DEACTIVATED) {
    throw AppError.forbidden("Your professional account has been deactivated. Please contact support.")
  }
  if (professional.accountStatus === ProfessionalAccountStatus.SUSPENDED) {
    throw AppError.forbidden("Your professional privileges have been suspended. Please contact platform administration.")
  }

  // 4. Generate cryptographically random session and CSRF tokens
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + PROF_SESSION_TTL_MS)

  // 5. Create database ProfessionalSession record
  const session = await prisma.professionalSession.create({
    data: {
      professionalId: professional.id,
      tokenHash,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  return {
    rawToken,
    csrfToken,
    professional: sanitizeProfessional(professional),
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Revokes a professional session in the database upon logout.
 */
export async function logoutProfessionalSession(sessionId: string): Promise<void> {
  await prisma.professionalSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/**
 * Retrieves a professional by ID (sanitized).
 */
export async function getProfessionalById(professionalId: string): Promise<SafeProfessional> {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  })
  if (!professional) {
    throw AppError.notFound("Professional account not found")
  }
  return sanitizeProfessional(professional)
}

/**
 * Updates permitted profile fields for a professional.
 */
export async function updateProfessionalProfile(
  professionalId: string,
  input: UpdateProfessionalProfileInput,
): Promise<SafeProfessional> {
  const existing = await prisma.professional.findUnique({
    where: { id: professionalId },
  })
  if (!existing) {
    throw AppError.notFound("Professional account not found")
  }

  const updated = await prisma.professional.update({
    where: { id: professionalId },
    data: {
      ...(input.middleName !== undefined ? { middleName: input.middleName } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.profession ? { profession: input.profession } : {}),
      ...(input.specialty ? { specialty: input.specialty } : {}),
      ...(input.specialistQualification !== undefined
        ? { specialistQualification: input.specialistQualification }
        : {}),
      ...(input.qualification !== undefined ? { qualification: input.qualification } : {}),
      ...(input.institution !== undefined ? { institution: input.institution } : {}),
      ...(input.graduationYear !== undefined ? { graduationYear: input.graduationYear } : {}),
      ...(input.facility ? { facility: input.facility } : {}),
      ...(input.profilePhoto !== undefined ? { profilePhoto: input.profilePhoto } : {}),
      ...(input.revalidationDate !== undefined ? { revalidationDate: input.revalidationDate } : {}),
    },
  })

  return sanitizeProfessional(updated)
}

/**
 * Retrieves full verification details and audit history for the authenticated professional.
 */
export async function getProfessionalVerificationStatus(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      verificationLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          documentType: true,
          title: true,
          documentRef: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          verified: true,
          verifiedAt: true,
          uploadedAt: true,
        },
      },
    },
  })
  if (!professional) {
    throw AppError.notFound("Professional account not found")
  }

  return {
    verificationStatus: professional.verificationStatus,
    accountStatus: professional.accountStatus,
    category: professional.category,
    profession: professional.profession,
    specialty: professional.specialty,
    specialistQualification: professional.specialistQualification,
    licenceNumber: professional.licenceNumber,
    licenceExpiry: professional.licenceExpiry,
    regulatoryBody: professional.regulatoryBody,
    facility: professional.facility,
    qualification: professional.qualification,
    institution: professional.institution,
    graduationYear: professional.graduationYear,
    restrictions: professional.restrictions,
    verifiedAt: professional.verifiedAt,
    reviewedAt: professional.reviewedAt,
    reviewedBy: professional.reviewedBy,
    rejectionReason: professional.rejectionReason,
    decisionNotes: professional.decisionNotes,
    revalidationDate: professional.revalidationDate,
    createdAt: professional.createdAt,
    documents: professional.documents,
    auditHistory: professional.verificationLogs.map((log) => ({
      id: log.id,
      action: log.action,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      reason: log.reason,
      restrictions: log.restrictions,
      notes: log.notes,
      createdAt: log.createdAt,
    })),
  }
}

/**
 * Maps verification actions to their corresponding destination statuses.
 */
export function resolveTargetVerificationStatus(
  action: VerificationAction,
  options: { restrictions?: string },
): ProfessionalVerificationStatus {
  switch (action) {
    case "START_REVIEW":
    case "UNDER_REVIEW":
      return ProfessionalVerificationStatus.UNDER_REVIEW
    case "VERIFY":
      return ProfessionalVerificationStatus.VERIFIED
    case "VERIFY_WITH_RESTRICTIONS":
      return ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS
    case "REJECT":
      return ProfessionalVerificationStatus.REJECTED
    case "SUSPEND":
      return ProfessionalVerificationStatus.SUSPENDED
    case "EXPIRE":
      return ProfessionalVerificationStatus.EXPIRED
    case "REVOKE":
      return ProfessionalVerificationStatus.REVOKED
    case "REINSTATE":
      return options.restrictions
        ? ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS
        : ProfessionalVerificationStatus.VERIFIED
    default:
      throw AppError.badRequest(`Unknown verification action: ${action}`)
  }
}

/**
 * Administrator Credential Review & Verification Workflow
 * Rule 4, 5, 6 & 7:
 * - Only authorized administrators can review/verify credentials.
 * - Self-approval is strictly forbidden.
 * - Strict state machine transitions enforced.
 * - Full audit trail recorded.
 */
export async function reviewProfessionalVerification(params: {
  professionalId: string
  action: VerificationAction
  adminId: string
  reason?: string
  restrictions?: string
  notes?: string
  revalidationDate?: Date
  meta?: { userAgent?: string; ipAddress?: string }
}): Promise<SafeProfessional> {
  const { professionalId, action, adminId, reason, restrictions, notes, revalidationDate, meta } = params

  if (!adminId || adminId.trim() === "") {
    throw AppError.badRequest("Administrator identity is required for verification operations")
  }

  // Security Rule 7: Professionals cannot approve or review their own account
  if (adminId.trim().toLowerCase() === professionalId.trim().toLowerCase()) {
    throw AppError.forbidden("Healthcare professionals cannot approve or review their own account")
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  })
  if (!professional) {
    throw AppError.notFound("Professional account not found")
  }

  const fromStatus = professional.verificationStatus
  const toStatus = resolveTargetVerificationStatus(action, { restrictions })

  // Rule 5: Enforce valid state machine transitions
  const allowedTransitions = VALID_VERIFICATION_TRANSITIONS[fromStatus] || []
  if (!allowedTransitions.includes(toStatus)) {
    throw AppError.badRequest(
      `Invalid verification status transition from ${fromStatus} to ${toStatus}. Allowed transitions from ${fromStatus}: ${
        allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none (terminal state)"
      }`,
    )
  }

  let verifiedAt: Date | null = professional.verifiedAt
  let rejectionReason: string | null = null
  let activeRestrictions: string | null = professional.restrictions
  let decisionNotes: string | null = notes ?? null
  let activeAccountStatus = professional.accountStatus

  if (toStatus === ProfessionalVerificationStatus.VERIFIED) {
    verifiedAt = new Date()
    rejectionReason = null
    activeRestrictions = null
    decisionNotes = notes ?? "Full clinical credentials verified and approved."
  } else if (toStatus === ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS) {
    verifiedAt = new Date()
    rejectionReason = null
    activeRestrictions = restrictions || "Verified with practice restrictions"
    decisionNotes = notes ?? `Approved with restrictions: ${activeRestrictions}`
  } else if (toStatus === ProfessionalVerificationStatus.REJECTED) {
    rejectionReason = reason ?? "Credentials could not be verified"
    activeRestrictions = null
    decisionNotes = notes ?? `Application rejected: ${rejectionReason}`
  } else if (toStatus === ProfessionalVerificationStatus.SUSPENDED) {
    activeRestrictions = null
    decisionNotes = reason ?? "Clinical privileges suspended pending investigation."
  } else if (toStatus === ProfessionalVerificationStatus.EXPIRED) {
    activeRestrictions = null
    decisionNotes = "Professional licence has passed validity date without renewed credential submission."
  } else if (toStatus === ProfessionalVerificationStatus.REVOKED) {
    activeRestrictions = null
    decisionNotes = reason ?? "Credentials permanently revoked by regulatory authority."
  }

  const now = new Date()

  // 1. Record immutable audit log entry
  await prisma.professionalVerificationLog.create({
    data: {
      professionalId: professional.id,
      action,
      fromStatus,
      toStatus,
      adminId,
      reason: reason ?? `Status transitioned to ${toStatus}`,
      restrictions: activeRestrictions,
      notes: decisionNotes,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    },
  })

  // 2. Update Professional record
  const updated = await prisma.professional.update({
    where: { id: professionalId },
    data: {
      verificationStatus: toStatus,
      accountStatus: activeAccountStatus,
      reviewedAt: now,
      reviewedBy: adminId,
      verifiedAt,
      rejectionReason,
      restrictions: activeRestrictions,
      decisionNotes,
      ...(revalidationDate ? { revalidationDate } : {}),
    },
  })

  return sanitizeProfessional(updated)
}

/**
 * ── Credential Evidence Document Management ────────────────────────────────────
 * Rule 8: Documents are securely catalogued and never exposed via public URLs.
 * Access is restricted to the owning professional or authorized administrators.
 */

export async function addProfessionalDocument(
  professionalId: string,
  input: CreateCredentialDocumentInput,
) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  })
  if (!professional) {
    throw AppError.notFound("Professional account not found")
  }

  const doc = await prisma.professionalCredentialDocument.create({
    data: {
      professionalId,
      documentType: input.documentType,
      title: input.title,
      documentRef: input.documentRef,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      verified: false,
    },
  })

  return doc
}

export async function getProfessionalDocuments(professionalId: string) {
  return prisma.professionalCredentialDocument.findMany({
    where: { professionalId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      documentType: true,
      title: true,
      documentRef: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      verified: true,
      verifiedAt: true,
      uploadedAt: true,
    },
  })
}

export async function getProfessionalDocumentById(
  documentId: string,
  requester: { id: string; role: "professional" | "admin" },
) {
  const doc = await prisma.professionalCredentialDocument.findUnique({
    where: { id: documentId },
    include: { professional: true },
  })
  if (!doc) {
    throw AppError.notFound("Document not found")
  }

  // Enforce access control: only owning professional or administrator can view
  if (requester.role === "professional" && doc.professionalId !== requester.id) {
    throw AppError.forbidden("You do not have permission to access this document")
  }

  return doc
}

export async function deleteProfessionalDocument(
  professionalId: string,
  documentId: string,
) {
  const doc = await prisma.professionalCredentialDocument.findUnique({
    where: { id: documentId },
    include: { professional: true },
  })
  if (!doc || doc.professionalId !== professionalId) {
    throw AppError.notFound("Document not found")
  }

  // Only allow deleting while account is PENDING or UNDER_REVIEW
  if (
    doc.professional.verificationStatus !== ProfessionalVerificationStatus.PENDING &&
    doc.professional.verificationStatus !== ProfessionalVerificationStatus.UNDER_REVIEW
  ) {
    throw AppError.forbidden(
      "Documents cannot be removed once an account is verified, suspended, or archived.",
    )
  }

  await prisma.professionalCredentialDocument.delete({
    where: { id: documentId },
  })

  return { success: true }
}
