import { Request, Response, NextFunction } from "express"
import {
  loginPatient,
  logoutSession,
  changePatientPassword,
} from "../services/authService"
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getSessionCookieOptions,
  getCsrfCookieOptions,
  generateCsrfToken,
  hashSessionToken,
} from "../utils/session"
import {
  getClientIp,
  recordFailedLogin,
  clearLoginAttempts,
} from "../middleware/rateLimiter"
import { prisma } from "../config/prisma"
import { env } from "../config/env"

/**
 * Handles patient login requests.
 * Rule G: Sets HTTP-only session cookie.
 * Rule L: Sets CSRF cookie for client-side inclusion.
 * Rule Q: Records failed attempts for rate limiting.
 * Rule T: Returns safe response shape without sensitive data.
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Invalidate existing session if client already holds a session cookie (Session rotation)
    const existingRawToken = req.cookies?.[SESSION_COOKIE_NAME]
    if (existingRawToken && typeof existingRawToken === "string") {
      const existingHash = hashSessionToken(existingRawToken)
      await prisma.session.updateMany({
        where: { tokenHash: existingHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }

    const meta = {
      userAgent: req.headers["user-agent"] as string | undefined,
      ipAddress: getClientIp(req),
    }

    const result = await loginPatient(req.body, meta)

    // Clear failed login counter upon successful authentication
    clearLoginAttempts(req)

    // Set HTTP-only session cookie
    res.cookie(SESSION_COOKIE_NAME, result.rawToken, getSessionCookieOptions())

    // Set readable CSRF cookie for client SPA
    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, getCsrfCookieOptions())

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: result.user,
        csrfToken: result.csrfToken,
        session: result.session,
      },
    })
  } catch (error) {
    // Record failure in rate limiter
    recordFailedLogin(req)
    next(error)
  }
}

/**
 * Handles patient password change requests.
 */
export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    await changePatientPassword(userId, req.body, req.session?.id)

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles patient logout requests.
 * Rule O: Revokes server-side session in database.
 * Clears session and CSRF cookies.
 */
export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.session?.id) {
      await logoutSession(req.session.id)
    }

    const clearOpts = {
      path: "/",
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production",
    }

    res.clearCookie(SESSION_COOKIE_NAME, { ...clearOpts, httpOnly: true })
    res.clearCookie(CSRF_COOKIE_NAME, { ...clearOpts, httpOnly: false })

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Returns current authenticated user and session metadata.
 */
export function getMeHandler(req: Request, res: Response): void {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
      session: req.session,
    },
  })
}

/**
 * Issues a fresh CSRF token for initiating state-changing requests.
 */
export function getCsrfHandler(req: Request, res: Response): void {
  const token = generateCsrfToken()
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions())

  res.status(200).json({
    status: "success",
    csrfToken: token,
    data: {
      csrfToken: token,
    },
  })
}
