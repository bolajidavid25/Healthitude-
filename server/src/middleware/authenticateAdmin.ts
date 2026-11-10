import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SCOPE_WRITE,
} from "../utils/adminSession"
import { PROF_SESSION_COOKIE_NAME } from "../utils/professionalSession"
import { SESSION_COOKIE_NAME, hashSessionToken } from "../utils/session"
import { SafeAdministrator, sanitizeAdmin } from "../services/adminService"

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "healthitude-admin-secure-key-2026"

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string
        email: string
        role: string
        scope: string
      }
      adminRecord?: SafeAdministrator
    }
  }
}

/**
 * Dedicated Administrator Authorization Middleware
 * Verifies isolated administrator session and scope (e.g. 'admin:write').
 * Rejects doctors, nurses, pharmacists, and patients.
 */
export async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Explicitly reject ordinary professionals attempting to access admin endpoints without admin session
    if (
      req.cookies?.[PROF_SESSION_COOKIE_NAME] &&
      !req.cookies?.[ADMIN_SESSION_COOKIE_NAME] &&
      !req.headers["x-admin-key"]
    ) {
      return next(
        AppError.forbidden(
          "Healthcare professionals cannot access administrative controls. Dedicated Healthitude administrator access required.",
        ),
      )
    }

    // 2. Explicitly reject patients attempting to access admin endpoints
    if (
      req.cookies?.[SESSION_COOKIE_NAME] &&
      !req.cookies?.[ADMIN_SESSION_COOKIE_NAME] &&
      !req.headers["x-admin-key"]
    ) {
      return next(
        AppError.forbidden(
          "Patients cannot access administrative verification controls.",
        ),
      )
    }

    // 3. Check for isolated Admin Session cookie or Bearer token
    let rawToken: string | undefined = req.cookies?.[ADMIN_SESSION_COOKIE_NAME]
    if (!rawToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ")
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        rawToken = parts[1]
      }
    }

    if (rawToken) {
      const tokenHash = hashSessionToken(rawToken)
      const session = await prisma.adminSession.findUnique({
        where: { tokenHash },
        include: { administrator: true },
      })

      if (!session || !session.administrator) {
        return next(AppError.unauthorized("Administrator session is invalid or expired"))
      }

      if (session.revokedAt !== null) {
        return next(AppError.unauthorized("Administrator session has been revoked"))
      }

      if (session.expiresAt < new Date()) {
        return next(AppError.unauthorized("Administrator session has expired"))
      }

      // Check required scope
      if (!session.scope.includes(ADMIN_SCOPE_WRITE) && !session.scope.includes("admin:read")) {
        return next(AppError.forbidden("Administrator session lacks required authority scope"))
      }

      req.admin = {
        id: session.administrator.id,
        email: session.administrator.email,
        role: session.administrator.role,
        scope: session.scope,
      }
      req.adminRecord = sanitizeAdmin(session.administrator)
      return next()
    }

    // 4. Fallback programmatic key check (for system service tasks)
    const adminKey = req.headers["x-admin-key"]
    if (adminKey && adminKey === ADMIN_SECRET_KEY) {
      const adminId = (req.headers["x-admin-id"] as string) || "admin-system-root"
      req.admin = {
        id: adminId,
        email: (req.headers["x-admin-email"] as string) || "admin@healthitude.com",
        role: "SUPER_ADMIN",
        scope: "admin:read,admin:write",
      }
      return next()
    }

    return next(
      AppError.unauthorized(
        "Administrator authentication required. Sign in via /api/admin/login.",
      ),
    )
  } catch (error) {
    next(error)
  }
}
