import crypto from "crypto"
import { prisma } from "../config/prisma"
import {
  verifyFirebaseIdToken,
  type VerifiedGoogleIdentity,
} from "../config/firebase"
import { AppError } from "../errors/AppError"
import {
  generateSessionToken,
  generateCsrfToken,
  hashSessionToken,
  SESSION_TTL_MS,
} from "../utils/session"
import { PROF_SESSION_TTL_MS } from "../utils/professionalSession"
import { registerPatient } from "./patientRegistrationService"
import {
  registerProfessional,
  sanitizeProfessional,
  type SafeProfessional,
} from "./professionalAuthService"
import { patientRegistrationSchema } from "../validation/onboarding"
import { registerProfessionalSchema } from "../validation/professional"
import { ProfessionalAccountStatus } from "../generated/prisma/enums"

function generateRandomOAuthPassword(): string {
  return `Ggl!${crypto.randomBytes(20).toString("hex")}9A`
}

function sanitizeUser(user: any) {
  const { passwordHash: _ignored, ...safeUser } = user
  return safeUser
}

/**
 * Verifies a Google Firebase ID token for the Patient Portal.
 * - If the email already exists in User, creates a standard Healthitude session.
 * - If not found, returns needsOnboarding=true with verified Google profile to prefill registration.
 */
export async function authenticatePatientWithGoogle(
  idToken: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
) {
  const google = await verifyFirebaseIdToken(idToken)

  const existing = await prisma.user.findUnique({
    where: { email: google.email },
  })

  if (!existing) {
    return {
      needsOnboarding: true as const,
      googleProfile: {
        email: google.email,
        firstName: google.firstName,
        lastName: google.lastName,
        name: google.name,
        picture: google.picture,
      },
    }
  }

  // Update profile photo from Google if patient hasn't uploaded one yet
  let user = existing
  if (!existing.profilePhoto && google.picture) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { profilePhoto: google.picture },
    })
  }

  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  return {
    needsOnboarding: false as const,
    rawToken,
    csrfToken,
    user: sanitizeUser(user),
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Completes Patient Registration using a verified Google Firebase ID token.
 * Enforces all Healthitude onboarding requirements (DOB, sex, phone, address, emergency contact,
 * patient category, and all 7 mandatory consents) while deriving email authoritatively from Google.
 */
export async function registerPatientWithGoogle(
  idToken: string,
  rawPayload: any,
  meta: { userAgent?: string; ipAddress?: string } = {},
) {
  const google: VerifiedGoogleIdentity = await verifyFirebaseIdToken(idToken)
  const generatedPassword = generateRandomOAuthPassword()

  const candidate = {
    ...rawPayload,
    account: {
      ...(rawPayload?.account || {}),
      firstName: rawPayload?.account?.firstName || google.firstName,
      lastName: rawPayload?.account?.lastName || google.lastName,
      email: google.email, // Authoritative verified email from Firebase
      password: generatedPassword,
      confirmPassword: generatedPassword,
    },
  }

  const parsed = patientRegistrationSchema.safeParse(candidate)
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }))
    throw AppError.validation(fieldErrors, "Validation failed")
  }

  const regResult = await registerPatient(parsed.data)

  // Save Google profile photo if available
  let user = regResult.user
  if (google.picture && !user.profilePhoto) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: google.picture },
    })
    user = sanitizeUser(updated)
  }

  // Issue active Healthitude session immediately
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  return {
    rawToken,
    csrfToken,
    user,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Verifies a Google Firebase ID token for the Professional (Doctor) Portal.
 * - If the email already exists in Professional, issues an independent ProfessionalSession.
 * - If not found, returns needsRegistration=true with verified Google profile to prefill onboarding.
 */
export async function authenticateProfessionalWithGoogle(
  idToken: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
) {
  const google = await verifyFirebaseIdToken(idToken)

  const existing = await prisma.professional.findUnique({
    where: { email: google.email },
  })

  if (!existing) {
    return {
      needsRegistration: true as const,
      googleProfile: {
        email: google.email,
        firstName: google.firstName,
        lastName: google.lastName,
        name: google.name,
        picture: google.picture,
      },
    }
  }

  if (
    existing.accountStatus === ProfessionalAccountStatus.SUSPENDED ||
    existing.accountStatus === ProfessionalAccountStatus.DEACTIVATED
  ) {
    throw AppError.forbidden(
      `Your professional account is currently ${existing.accountStatus.toLowerCase()}. Please contact Healthitude administration.`,
    )
  }

  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + PROF_SESSION_TTL_MS)

  const session = await prisma.professionalSession.create({
    data: {
      professionalId: existing.id,
      tokenHash,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  return {
    needsRegistration: false as const,
    rawToken,
    csrfToken,
    professional: sanitizeProfessional(existing),
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Completes Professional (Doctor) Registration using a verified Google Firebase ID token.
 * Still enforces all medical credential fields and initializes verificationStatus = PENDING (Rule B).
 */
export async function registerProfessionalWithGoogle(
  idToken: string,
  rawPayload: any,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<SafeProfessional> {
  const google = await verifyFirebaseIdToken(idToken)
  const generatedPassword = generateRandomOAuthPassword()

  const { idToken: _stripToken, ...rest } = rawPayload || {}
  const candidate = {
    ...rest,
    firstName: rest.firstName || google.firstName,
    lastName: rest.lastName || google.lastName,
    email: google.email, // Authoritative verified email from Firebase
    password: generatedPassword,
    confirmPassword: generatedPassword,
  }

  const parsed = registerProfessionalSchema.safeParse(candidate)
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }))
    throw AppError.validation(fieldErrors, "Validation failed")
  }

  return registerProfessional(parsed.data, meta)
}
