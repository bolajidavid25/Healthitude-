import crypto from "crypto"
import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"
import { CSRF_COOKIE_NAME } from "../utils/session"
import { PROF_CSRF_COOKIE_NAME } from "../utils/professionalSession"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

function createDoubleSubmitCsrfMiddleware(cookieName: string) {
  return function csrfGuard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    // Safe read-only methods do not change state
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return next()
    }

    // Header token from client request
    const headerToken =
      (req.headers["x-csrf-token"] as string) ||
      (req.headers["x-xsrf-token"] as string)

    // Cookie token
    const cookieToken = req.cookies?.[cookieName]

    if (!cookieToken || !headerToken) {
      return next(AppError.forbidden("Invalid or missing CSRF token"))
    }

    // Tokens must match with constant-time comparison to prevent timing side-channel attacks
    const headerBuf = Buffer.from(headerToken)
    const cookieBuf = Buffer.from(cookieToken)

    if (
      headerBuf.length !== cookieBuf.length ||
      !crypto.timingSafeEqual(headerBuf, cookieBuf)
    ) {
      return next(AppError.forbidden("CSRF token validation failed"))
    }

    next()
  }
}

/**
 * Cross-Site Request Forgery (CSRF) Protection Middleware
 * Rule L: Protect cookie-authenticated state-changing requests against cross-site request forgery.
 */
export const csrfProtection = createDoubleSubmitCsrfMiddleware(CSRF_COOKIE_NAME)

/**
 * Professional Portal CSRF Protection Middleware (Rule L)
 * Validates double-submit cookie against 'healthitude_prof_csrf'.
 */
export const profCsrfProtection = createDoubleSubmitCsrfMiddleware(
  PROF_CSRF_COOKIE_NAME,
)
