import { prisma } from "../config/prisma"
import { comparePassword, hashPassword } from "../utils/password"
import { AppError, ErrorCode } from "../errors/AppError"
import { LoginInput, ChangePasswordInput } from "../validation/auth"
import {
  generateSessionToken,
  generateCsrfToken,
  hashSessionToken,
  SESSION_TTL_MS,
} from "../utils/session"

// Pre-computed dummy hash to ensure constant-time response on non-existent users (prevents timing side-channel attacks)
const TIMING_SAFETY_DUMMY_HASH =
  "$2a$12$e8F0sM9d5H4/K0z7qW2sA.hFfK4c1x0W1L.e2/P5b7M3N1O9Q7R2S"

export interface LoginResult {
  rawToken: string
  csrfToken: string
  user: {
    id: string
    firstName: string
    middleName: string | null
    lastName: string
    email: string
    phoneNumber: string
    sex: string
    dateOfBirth: Date
    profilePhoto: string | null
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    expiresAt: Date
  }
}

/**
 * Authenticates a patient by email and password and creates a new database session.
 * Rule B & C: Verifies passwords with bcrypt; never compares with plain text.
 * Rule D: Never exposes passwordHash.
 * Rule E & F: Issues random token and stores SHA-256 hash in DB.
 * Rule R: Generic invalidCredentials error for both unknown email and incorrect password.
 */
export async function loginPatient(
  input: LoginInput,
  meta: { userAgent?: string; ipAddress?: string },
): Promise<LoginResult> {
  const { email, password } = input

  // 1. Look up user by normalized email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // Constant-time execution to prevent email enumeration timing side-channels
    await comparePassword(password, TIMING_SAFETY_DUMMY_HASH)
    throw AppError.invalidCredentials("Invalid email or password")
  }

  // 2. Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash)
  if (!isValidPassword) {
    throw AppError.invalidCredentials("Invalid email or password")
  }

  // 3. Generate cryptographically random session and CSRF tokens
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  // 4. Create database Session record (Rule F)
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  })

  // 5. Return sanitized result without passwordHash (Rule D)
  return {
    rawToken,
    csrfToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      sex: user.sex,
      dateOfBirth: user.dateOfBirth,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Revokes a session in the database upon logout.
 * Rule O: Revoke the server-side session during logout.
 */
export async function logoutSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/**
 * Changes a patient's password after verifying the current password.
 * Rule D & E: Re-hashes password with bcrypt (work factor 12).
 * Revokes other active sessions for security while keeping the current session valid.
 */
export async function changePatientPassword(
  userId: string,
  input: ChangePasswordInput,
  currentSessionId?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    throw AppError.notFound("User not found")
  }

  const isValidCurrent = await comparePassword(
    input.currentPassword,
    user.passwordHash,
  )
  if (!isValidCurrent) {
    throw AppError.badRequest(
      "Current password is incorrect",
      ErrorCode.VALIDATION_ERROR,
      [
        {
          field: "currentPassword",
          message: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        },
      ],
    )
  }

  const newHash = await hashPassword(input.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  // Revoke all other active sessions for this user except the current one
  if (currentSessionId) {
    await prisma.session.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
  }
}
