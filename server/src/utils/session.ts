import crypto from "crypto"
import { CookieOptions } from "express"
import { env } from "../config/env"

export const SESSION_COOKIE_NAME = "healthitude_session"
export const CSRF_COOKIE_NAME = "healthitude_csrf"

/**
 * Session Expiry Policy:
 * Rule M: Set a documented session expiry.
 * Active sessions expire after 7 days (604,800,000 milliseconds) unless explicitly revoked.
 * Validated on every authenticated request against the PostgreSQL Session record.
 */
export const SESSION_TTL_DAYS = 7
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * HTTP-only Session Cookie Configuration
 * Rule G: Use HTTP-only cookies for session transport.
 * Rule H: Configure Secure cookies in HTTPS production environments.
 * Rule I: Choose an appropriate SameSite policy (Lax protects top-level navigations while enabling SPA API calls).
 */
export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  }
}

/**
 * CSRF Cookie Configuration
 * Rule L: Double-Submit Cookie pattern for Cross-Site Request Forgery defense.
 * httpOnly is false so the client single-page application script can read the cookie
 * and mirror its value in the 'x-csrf-token' request header on state-changing requests.
 */
export function getCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  }
}

/**
 * Generates a cryptographically secure random session token.
 * Rule E: 256 bits of cryptographic entropy via crypto.randomBytes(32).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

/**
 * Generates a cryptographically secure random CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString("hex")
}

/**
 * Computes a SHA-256 hash of a raw session token for database storage.
 * Rule F: Store a hash of the session token in the database rather than the raw bearer secret.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
