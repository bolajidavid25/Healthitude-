import { CookieOptions } from "express"
import { env } from "../config/env"
import { SESSION_TTL_MS } from "./session"

export const PROF_SESSION_COOKIE_NAME = "healthitude_prof_session"
export const PROF_CSRF_COOKIE_NAME = "healthitude_prof_csrf"

/**
 * Professional Session Expiry Policy:
 * Matches system policy of 7 days (604,800,000 ms).
 * Validated against PostgreSQL ProfessionalSession record on every request.
 */
export const PROF_SESSION_TTL_MS = SESSION_TTL_MS

/**
 * HTTP-only Professional Session Cookie Configuration
 * Rule G, H, I: HTTP-only, Secure in production, SameSite=Lax.
 */
export function getProfSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PROF_SESSION_TTL_MS,
  }
}

/**
 * Professional CSRF Cookie Configuration
 * Double-submit cookie readable by client application script.
 */
export function getProfCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PROF_SESSION_TTL_MS,
  }
}
