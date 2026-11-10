import { prisma } from "../config/prisma"
import { comparePassword, hashPassword } from "../utils/password"
import { AppError } from "../errors/AppError"
import { LoginAdminInput, AdminReviewProfessionalInput } from "../validation/admin"
import { VerificationAction } from "../validation/professional"
import {
  generateSessionToken,
  generateCsrfToken,
  hashSessionToken,
} from "../utils/session"
import {
  ADMIN_SESSION_TTL_MS,
  ADMIN_DEFAULT_SCOPES,
  ADMIN_SCOPE_WRITE,
} from "../utils/adminSession"
import {
  Administrator,
  AdminRole,
  AdminStatus,
  ProfessionalVerificationStatus,
} from "../generated/prisma/enums"
import { reviewProfessionalVerification } from "./professionalAuthService"

const TIMING_SAFETY_DUMMY_HASH =
  "$2a$12$e8F0sM9d5H4/K0z7qW2sA.hFfK4c1x0W1L.e2/P5b7M3N1O9Q7R2S"

export interface SafeAdministrator {
  id: string
  firstName: string
  lastName: string
  email: string
  role: AdminRole
  status: AdminStatus
  department: string | null
  employeeId: string | null
  profilePhoto: string | null
  createdAt: Date
  updatedAt: Date
}

export function sanitizeAdmin(admin: Administrator): SafeAdministrator {
  return {
    id: admin.id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    department: admin.department,
    employeeId: admin.employeeId,
    profilePhoto: admin.profilePhoto,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }
}

export interface AdminLoginResult {
  rawToken: string
  csrfToken: string
  administrator: SafeAdministrator
  scope: string
  session: {
    id: string
    expiresAt: Date
  }
}

/**
 * Ensures the platform default administrator exists for first-time startup.
 * Corresponds to Sylvia Yeboah (admin@healthitude.com / HTD-ADM-0041).
 */
export async function ensureDefaultAdmin(): Promise<Administrator> {
  const defaultEmail = "admin@healthitude.com"
  const existing = await prisma.administrator.findUnique({
    where: { email: defaultEmail },
  })

  if (existing) {
    return existing
  }

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminPassword123!"
  const passwordHash = await hashPassword(defaultPassword)

  return prisma.administrator.create({
    data: {
      firstName: "Sylvia",
      lastName: "Yeboah",
      email: defaultEmail,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      status: AdminStatus.ACTIVE,
      department: "Healthitude Clinical Governance & Operations",
      employeeId: "HTD-ADM-0041",
    },
  })
}

/**
 * Dedicated Administrator Login Service
 * Validates credentials, issues isolated admin session with explicit scope.
 */
export async function loginAdmin(
  input: LoginAdminInput,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<AdminLoginResult> {
  // Ensure default admin exists
  await ensureDefaultAdmin()

  const normalizedEmail = input.email.trim().toLowerCase()
  const admin = await prisma.administrator.findUnique({
    where: { email: normalizedEmail },
  })

  if (!admin) {
    await comparePassword(input.password, TIMING_SAFETY_DUMMY_HASH)
    throw AppError.invalidCredentials("Invalid administrator email or password")
  }

  const isValid = await comparePassword(input.password, admin.passwordHash)
  if (!isValid) {
    throw AppError.invalidCredentials("Invalid administrator email or password")
  }

  if (admin.status !== AdminStatus.ACTIVE) {
    throw AppError.forbidden("Administrator account is suspended or deactivated")
  }

  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS)
  const scope = ADMIN_DEFAULT_SCOPES

  const session = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      tokenHash,
      scope,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  // Log successful admin sign-in
  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "ADMIN_SIGN_IN",
    targetType: "Administrator",
    targetId: admin.id,
    targetName: `${admin.firstName} ${admin.lastName}`,
    details: { ip: meta.ipAddress, userAgent: meta.userAgent },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    severity: "normal",
  })

  return {
    rawToken,
    csrfToken,
    administrator: sanitizeAdmin(admin),
    scope,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Revokes an administrator session in the database.
 */
export async function logoutAdminSession(sessionId: string): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/**
 * Retrieves an administrator by ID.
 */
export async function getAdminById(adminId: string): Promise<SafeAdministrator> {
  const admin = await prisma.administrator.findUnique({
    where: { id: adminId },
  })
  if (!admin) {
    throw AppError.notFound("Administrator account not found")
  }
  return sanitizeAdmin(admin)
}

/**
 * Comprehensive Administrator Audit Logger
 * Records administrative operations for clinical governance and accountability.
 */
export async function logAdminAction(params: {
  adminId: string
  adminEmail: string
  action: string
  targetType: string
  targetId?: string | null
  targetName?: string | null
  details?: any
  ipAddress?: string | null
  userAgent?: string | null
  severity?: "normal" | "high" | "critical"
}) {
  return prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      targetName: params.targetName ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      severity: params.severity || "normal",
    },
  })
}

/**
 * Retrieves audit log entries for display in the Administrator Portal.
 */
export async function getAdminAuditLogs(options: { limit?: number; offset?: number } = {}) {
  const limit = Math.min(100, options.limit || 50)
  const offset = options.offset || 0

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.adminAuditLog.count(),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      adminEmail: log.adminEmail,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      details: log.details,
      severity: log.severity,
      createdAt: log.createdAt,
    })),
    total,
    limit,
    offset,
  }
}

/**
 * Retrieves all registered professionals for administrative review.
 */
export async function getAdminProfessionalsList() {
  const professionals = await prisma.professional.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      verificationLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          documentType: true,
          title: true,
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

  return professionals.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    middleName: p.middleName,
    lastName: p.lastName,
    name: p.middleName
      ? `Dr. ${p.firstName} ${p.middleName} ${p.lastName}`
      : `Dr. ${p.firstName} ${p.lastName}`,
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
    verifiedAt: p.verifiedAt,
    reviewedAt: p.reviewedAt,
    reviewedBy: p.reviewedBy,
    rejectionReason: p.rejectionReason,
    decisionNotes: p.decisionNotes,
    revalidationDate: p.revalidationDate,
    createdAt: p.createdAt,
    documents: p.documents,
    verificationLogs: p.verificationLogs,
  }))
}

/**
 * Administrator Credential Decision with Full Audit Trail
 */
export async function adminReviewProfessional(params: {
  professionalId: string
  action: VerificationAction
  adminId: string
  adminEmail: string
  reason?: string
  restrictions?: string
  notes?: string
  revalidationDate?: Date
  meta?: { userAgent?: string; ipAddress?: string }
}) {
  const {
    professionalId,
    action,
    adminId,
    adminEmail,
    reason,
    restrictions,
    notes,
    revalidationDate,
    meta,
  } = params

  const updated = await reviewProfessionalVerification({
    professionalId,
    action,
    adminId,
    reason,
    restrictions,
    notes,
    revalidationDate,
    meta,
  })

  let actionName = "PROFESSIONAL_REVIEW"
  if (action === "VERIFY") actionName = "PROFESSIONAL_VERIFIED"
  else if (action === "VERIFY_WITH_RESTRICTIONS") actionName = "PROFESSIONAL_VERIFIED_WITH_RESTRICTIONS"
  else if (action === "REJECT") actionName = "PROFESSIONAL_REJECTED"
  else if (action === "SUSPEND") actionName = "PROFESSIONAL_SUSPENDED"
  else if (action === "EXPIRE") actionName = "PROFESSIONAL_EXPIRED"
  else if (action === "REVOKE") actionName = "PROFESSIONAL_REVOKED"
  else if (action === "REINSTATE") actionName = "PROFESSIONAL_REINSTATED"
  else if (action === "START_REVIEW" || action === "UNDER_REVIEW") actionName = "PROFESSIONAL_UNDER_REVIEW"

  const severity =
    action === "REJECT" || action === "REVOKE" || action === "SUSPEND" ? "high" : "normal"

  // Record administrative audit log
  await logAdminAction({
    adminId,
    adminEmail,
    action: actionName,
    targetType: "Professional",
    targetId: updated.id,
    targetName: `Dr. ${updated.firstName} ${updated.lastName}`,
    details: {
      licenceNumber: updated.licenceNumber,
      regulatoryBody: updated.regulatoryBody,
      facility: updated.facility,
      newStatus: updated.verificationStatus,
      restrictions: updated.restrictions,
      reason: reason || null,
      notes: notes || null,
    },
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
    severity,
  })

  return updated
}
