import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import { SESSION_COOKIE_NAME, hashSessionToken } from "../utils/session"

declare global {
  namespace Express {
    interface Request {
      user?: {
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
      session?: {
        id: string
        userId: string
        expiresAt: Date
        createdAt: Date
      }
    }
  }
}

/**
 * Authentication Middleware
 * Rule N: Validate session expiry on every authenticated request.
 * Rule P: Reject revoked or expired sessions.
 * Rule U: Keep authentication and authorization separate.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract raw session token from HTTP-only cookie or Bearer header
    let rawToken: string | undefined = req.cookies?.[SESSION_COOKIE_NAME]

    if (!rawToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ")
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        rawToken = parts[1]
      }
    }

    if (!rawToken) {
      return next(
        AppError.unauthorized(
          "Authentication is required to access this resource",
        ),
      )
    }

    // 2. Hash raw token using SHA-256 (Rule F)
    const tokenHash = hashSessionToken(rawToken)

    // 3. Query Session record and associated User
    const sessionRecord = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
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
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    // 4. Validate existence, revocation, and expiry
    if (!sessionRecord || !sessionRecord.user) {
      return next(AppError.unauthorized("Session is invalid or has expired"))
    }

    if (sessionRecord.revokedAt !== null) {
      return next(AppError.unauthorized("Session has been revoked"))
    }

    if (sessionRecord.expiresAt < new Date()) {
      return next(AppError.unauthorized("Session has expired"))
    }

    // 5. Attach authenticated user and session metadata to request
    req.user = sessionRecord.user
    req.session = {
      id: sessionRecord.id,
      userId: sessionRecord.userId,
      expiresAt: sessionRecord.expiresAt,
      createdAt: sessionRecord.createdAt,
    }

    next()
  } catch (error) {
    next(error)
  }
}
