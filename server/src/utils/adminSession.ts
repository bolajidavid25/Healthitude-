import { CookieOptions } from "express"
import { env } from "../config/env"

export const ADMIN_SESSION_COOKIE_NAME = "healthitude_admin_session"
export const ADMIN_CSRF_COOKIE_NAME = "healthitude_admin_csrf"

/**
 * Administrator Session Expiry Policy:
 * 12 hours (43,200,000 ms) - High security administrative session.
 */
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000

export const ADMIN_SCOPE_READ = "admin:read"
export const ADMIN_SCOPE_WRITE = "admin:write"
export const ADMIN_DEFAULT_SCOPES = `${ADMIN_SCOPE_READ},${ADMIN_SCOPE_WRITE}`

export function getAdminSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS,
  }
}

export function getAdminCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS,
  }
}
