import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"

interface RateLimitRecord {
  attempts: number
  resetAt: number
}

const loginAttempts = new Map<string, RateLimitRecord>()

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim()
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1"
}

/**
 * Login Rate Limiting Middleware
 * Rule Q: Apply rate limiting to login attempts.
 * Prevents credential-stuffing and brute-force dictionary attacks.
 */
export function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = getClientIp(req)
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : ""
  const key = `${ip}:${email || "unknown"}`

  const now = Date.now()
  const record = loginAttempts.get(key)

  if (record) {
    if (now < record.resetAt) {
      if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)
        res.setHeader("Retry-After", retryAfterSeconds.toString())
        return next(
          AppError.rateLimit(
            "Too many failed login attempts. Please try again in 15 minutes.",
          ),
        )
      }
    } else {
      // Window expired; reset
      loginAttempts.delete(key)
    }
  }

  next()
}

/**
 * Increments failed login count for the request key upon bad credentials.
 */
export function recordFailedLogin(req: Request): void {
  const ip = getClientIp(req)
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : ""
  const key = `${ip}:${email || "unknown"}`

  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record || now >= record.resetAt) {
    loginAttempts.set(key, {
      attempts: 1,
      resetAt: now + LOGIN_WINDOW_MS,
    })
  } else {
    record.attempts += 1
  }
}

/**
 * Clears failed login counter upon successful authentication.
 */
export function clearLoginAttempts(req: Request): void {
  const ip = getClientIp(req)
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : ""
  const key = `${ip}:${email || "unknown"}`
  loginAttempts.delete(key)
}

const registrationAttempts = new Map<string, {
  count: number
  resetAt: number
}>()
const MAX_REGISTRATIONS_PER_HOUR = 10
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Registration Rate Limiting Middleware
 * Protects computationally intensive bcrypt password hashing and database
 * account creation from denial-of-service / CPU-exhaustion attacks.
 */
export function registrationRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = getClientIp(req)
  const now = Date.now()
  const record = registrationAttempts.get(ip)

  if (record) {
    if (now < record.resetAt) {
      if (record.count >= MAX_REGISTRATIONS_PER_HOUR) {
        const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)
        res.setHeader("Retry-After", retryAfterSeconds.toString())
        return next(
          AppError.rateLimit(
            "Too many registration requests from this network. Please try again later.",
          ),
        )
      }
      record.count += 1
    } else {
      registrationAttempts.set(ip, {
        count: 1,
        resetAt: now + REGISTRATION_WINDOW_MS,
      })
    }
  } else {
    registrationAttempts.set(ip, {
      count: 1,
      resetAt: now + REGISTRATION_WINDOW_MS,
    })
  }

  next()
}

/**
 * Resets all rate limit buckets (used for isolated automated testing).
 */
export function resetAllRateLimits(): void {
  loginAttempts.clear()
  registrationAttempts.clear()
}
