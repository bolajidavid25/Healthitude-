import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/prisma"
import { AppError, ErrorCode } from "../errors/AppError"
import {
  PROF_SESSION_COOKIE_NAME,
} from "../utils/professionalSession"
import { SESSION_COOKIE_NAME, hashSessionToken } from "../utils/session"
import {
  SafeProfessional,
  sanitizeProfessional,
} from "../services/professionalAuthService"
import { ProfessionalVerificationStatus } from "../generated/prisma/enums"

declare global {
  namespace Express {
    interface Request {
      professional?: SafeProfessional
      professionalSession?: {
        id: string
        professionalId: string
        expiresAt: Date
        createdAt: Date
      }
    }
  }
}

/**
 * Professional Authentication Middleware
 * Validates independent professional session and attaches req.professional and req.professionalSession.
 * Rule 2: Strict separation from patient authentication.
 */
export async function authenticateProfessional(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract raw professional session token
    let rawToken: string | undefined = req.cookies?.[PROF_SESSION_COOKIE_NAME]

    // Also support Bearer token if header is explicitly prefixed or passed
    if (!rawToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ")
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        rawToken = parts[1]
      }
    }

    if (!rawToken) {
      // Check if patient cookie was accidentally sent to professional endpoint
      if (req.cookies?.[SESSION_COOKIE_NAME]) {
        return next(
          AppError.unauthorized(
            "Access denied: Professional authentication required. The current session belongs to a patient account.",
          ),
        )
      }
      return next(
        AppError.unauthorized(
          "Authentication is required to access this professional resource",
        ),
      )
    }

    // 2. Hash raw token with SHA-256
    const tokenHash = hashSessionToken(rawToken)

    // 3. Query ProfessionalSession record and associated Professional
    const sessionRecord = await prisma.professionalSession.findUnique({
      where: { tokenHash },
      include: { professional: true },
    })

    // 4. Validate existence, revocation, and expiry
    if (!sessionRecord || !sessionRecord.professional) {
      return next(AppError.unauthorized("Professional session is invalid or has expired"))
    }

    if (sessionRecord.revokedAt !== null) {
      return next(AppError.unauthorized("Professional session has been revoked"))
    }

    if (sessionRecord.expiresAt < new Date()) {
      return next(AppError.unauthorized("Professional session has expired"))
    }

    // 5. Attach authenticated professional and session metadata
    req.professional = sanitizeProfessional(sessionRecord.professional)
    req.professionalSession = {
      id: sessionRecord.id,
      professionalId: sessionRecord.professionalId,
      expiresAt: sessionRecord.expiresAt,
      createdAt: sessionRecord.createdAt,
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Verified Professional Authorization Guard
 * Rule 5 & 7: Restricts clinical operations to verified professionals only.
 * Unverified professionals (PENDING, UNDER_REVIEW, REJECTED, EXPIRED, SUSPENDED, REVOKED) are blocked.
 */
export function requireVerifiedProfessional(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.professional) {
    return next(AppError.unauthorized("Professional authentication is required"))
  }

  const status = req.professional.verificationStatus

  // Only VERIFIED and VERIFIED_WITH_RESTRICTIONS are permitted to access clinical operations
  const isClinicallyVerified =
    status === ProfessionalVerificationStatus.VERIFIED ||
    status === ProfessionalVerificationStatus.VERIFIED_WITH_RESTRICTIONS

  if (!isClinicallyVerified) {
    return next(
      new AppError(
        403,
        ErrorCode.FORBIDDEN,
        `Clinical operations require administrator verification. Your professional account is currently ${status}.`,
      ),
    )
  }

  next()
}
