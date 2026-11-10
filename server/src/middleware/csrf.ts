import crypto from "crypto"
import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"
import { CSRF_COOKIE_NAME } from "../utils/session"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Cross-Site Request Forgery (CSRF) Protection Middleware
 * Rule L: Protect cookie-authenticated state-changing requests against cross-site request forgery.
 *
 * Implements the Double-Submit Cookie pattern:
 * The frontend client reads the 'healthitude_csrf' cookie set by the server and includes its value
 * in the 'x-csrf-token' header on state-changing requests (POST, PUT, PATCH, DELETE).
 * Since cross-origin requests cannot access or forge cross-origin cookies,
 * attackers cannot reproduce the matching header value.
 */
export function csrfProtection(
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
    req.headers["x-csrf-token"] as string ||
    req.headers["x-xsrf-token"] as string

  // Cookie token
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]

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
