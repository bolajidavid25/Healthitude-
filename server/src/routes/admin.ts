import { Router, Request, Response } from "express"
import {
  adminLoginHandler,
  adminLogoutHandler,
  adminMeHandler,
  adminGetProfessionalsHandler,
  adminReviewProfessionalHandler,
  adminGetAuditLogsHandler,
} from "../controllers/adminController"
import { authenticateAdmin } from "../middleware/authenticateAdmin"
import { validateBody } from "../middleware/validate"
import { loginRateLimiter } from "../middleware/rateLimiter"
import {
  loginAdminSchema,
  adminReviewProfessionalSchema,
} from "../validation/admin"
import {
  ADMIN_CSRF_COOKIE_NAME,
  getAdminCsrfCookieOptions,
} from "../utils/adminSession"
import { generateCsrfToken } from "../utils/session"

export function createAdminRouter(): Router {
  const router = Router()

  /**
   * GET /api/admin/csrf
   */
  router.get("/csrf", (req: Request, res: Response) => {
    let token = req.cookies?.[ADMIN_CSRF_COOKIE_NAME]
    if (!token) {
      token = generateCsrfToken()
      res.cookie(ADMIN_CSRF_COOKIE_NAME, token, getAdminCsrfCookieOptions())
    }
    res.status(200).json({
      status: "success",
      csrfToken: token,
    })
  })

  // ─── Dedicated Administrator Login Endpoint ───────────────────────────────────
  router.post(
    "/login",
    loginRateLimiter,
    validateBody(loginAdminSchema),
    adminLoginHandler,
  )

  // ─── Authenticated Administrator Endpoints ─────────────────────────────────────
  router.post("/logout", authenticateAdmin, adminLogoutHandler)
  router.get("/me", authenticateAdmin, adminMeHandler)
  router.get("/professionals", authenticateAdmin, adminGetProfessionalsHandler)
  router.post(
    "/professionals/:id/review",
    authenticateAdmin,
    validateBody(adminReviewProfessionalSchema),
    adminReviewProfessionalHandler,
  )
  router.get("/audit-logs", authenticateAdmin, adminGetAuditLogsHandler)

  return router
}

export const adminRouter = createAdminRouter()
