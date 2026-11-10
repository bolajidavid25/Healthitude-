import { Request, Response, NextFunction } from "express"
import {
  loginAdmin,
  logoutAdminSession,
  getAdminProfessionalsList,
  adminReviewProfessional,
  getAdminAuditLogs,
} from "../services/adminService"
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_CSRF_COOKIE_NAME,
  getAdminSessionCookieOptions,
  getAdminCsrfCookieOptions,
} from "../utils/adminSession"

/**
 * POST /api/admin/login
 * Dedicated Administrator Login Endpoint.
 */
export async function adminLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginAdmin(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    res.cookie(
      ADMIN_SESSION_COOKIE_NAME,
      result.rawToken,
      getAdminSessionCookieOptions(),
    )
    res.cookie(
      ADMIN_CSRF_COOKIE_NAME,
      result.csrfToken,
      getAdminCsrfCookieOptions(),
    )

    res.status(200).json({
      status: "success",
      message: "Administrator authentication successful",
      administrator: result.administrator,
      scope: result.scope,
      hasCsrfToken: true,
      sessionExpiresAt: result.session.expiresAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/admin/logout
 * Terminates the administrator session.
 */
export async function adminLogoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.admin?.id) {
      await logoutAdminSession(req.admin.id)
    }

    res.clearCookie(ADMIN_SESSION_COOKIE_NAME, getAdminSessionCookieOptions())
    res.clearCookie(ADMIN_CSRF_COOKIE_NAME, getAdminCsrfCookieOptions())

    res.status(200).json({
      status: "success",
      message: "Administrator logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/me
 * Retrieves the currently authenticated administrator profile.
 */
export async function adminMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      status: "success",
      data: {
        administrator: req.adminRecord,
        scope: req.admin?.scope,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/professionals
 * Retrieves all registered healthcare professionals for review.
 */
export async function adminGetProfessionalsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const professionals = await getAdminProfessionalsList()
    res.status(200).json({
      status: "success",
      data: {
        professionals,
        count: professionals.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/admin/professionals/:id/review
 * Approves or rejects a healthcare professional with audit logging.
 */
export async function adminReviewProfessionalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const professionalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const adminId = req.admin!.id
    const adminEmail = req.admin!.email

    const updated = await adminReviewProfessional({
      professionalId,
      action: req.body.action,
      adminId,
      adminEmail,
      reason: req.body.reason,
      restrictions: req.body.restrictions,
      notes: req.body.notes,
      revalidationDate: req.body.revalidationDate,
      meta: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    })

    res.status(200).json({
      status: "success",
      message: `Professional status transitioned to ${updated.verificationStatus}`,
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/audit-logs
 * Retrieves the administrative audit log trail.
 */
export async function adminGetAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0

    const result = await getAdminAuditLogs({ limit, offset })
    res.status(200).json({
      status: "success",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
