import { Router, Request, Response } from "express"
import {
  registerProfessionalHandler,
  loginProfessionalHandler,
  logoutProfessionalHandler,
  getMeProfessionalHandler,
  getVerificationStatusHandler,
  updateProfileHandler,
  reviewVerificationHandler,
  testClinicalAccessHandler,
  addDocumentHandler,
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
} from "../controllers/professionalAuthController"
import {
  authenticateProfessional,
  requireVerifiedProfessional,
} from "../middleware/authenticateProfessional"
import { authenticateAdmin } from "../middleware/authenticateAdmin"
import { loginRateLimiter } from "../middleware/rateLimiter"
import { validateBody } from "../middleware/validate"
import {
  registerProfessionalSchema,
  loginProfessionalSchema,
  updateProfessionalProfileSchema,
  reviewVerificationSchema,
  createCredentialDocumentSchema,
} from "../validation/professional"
import {
  PROF_CSRF_COOKIE_NAME,
  getProfCsrfCookieOptions,
} from "../utils/professionalSession"
import { generateCsrfToken } from "../utils/session"

export function createProfessionalRouter(): Router {
  const router = Router()

  /**
   * GET /api/professional/csrf
   * Issues professional CSRF token for the frontend application.
   */
  router.get("/csrf", (req: Request, res: Response) => {
    let token = req.cookies?.[PROF_CSRF_COOKIE_NAME]
    if (!token) {
      token = generateCsrfToken()
      res.cookie(PROF_CSRF_COOKIE_NAME, token, getProfCsrfCookieOptions())
    }
    res.status(200).json({
      status: "success",
      csrfToken: token,
    })
  })

  // ─── Public Authentication Endpoints ──────────────────────────────────────────
  router.post(
    "/register",
    validateBody(registerProfessionalSchema),
    registerProfessionalHandler,
  )
  router.post(
    "/login",
    loginRateLimiter,
    validateBody(loginProfessionalSchema),
    loginProfessionalHandler,
  )

  // ─── Authenticated Professional Endpoints (Pending & Verified) ─────────────────
  router.post("/logout", authenticateProfessional, logoutProfessionalHandler)
  router.get("/me", authenticateProfessional, getMeProfessionalHandler)
  router.get(
    "/verification-status",
    authenticateProfessional,
    getVerificationStatusHandler,
  )
  router.patch(
    "/profile",
    authenticateProfessional,
    validateBody(updateProfessionalProfileSchema),
    updateProfileHandler,
  )

  // ─── Credential Evidence Documents (Rule 8: non-public internal references) ───
  router.post(
    "/documents",
    authenticateProfessional,
    validateBody(createCredentialDocumentSchema),
    addDocumentHandler,
  )
  router.get("/documents", authenticateProfessional, getDocumentsHandler)
  router.get("/documents/:id", authenticateProfessional, getDocumentByIdHandler)
  router.delete("/documents/:id", authenticateProfessional, deleteDocumentHandler)

  // ─── Verified-Only Clinical Operations Boundary ───────────────────────────────
  router.get(
    "/clinical-access-probe",
    authenticateProfessional,
    requireVerifiedProfessional,
    testClinicalAccessHandler,
  )

  // ─── Administrator Verification Review Endpoints ───────────────────────────────
  router.post(
    "/admin/review/:id",
    authenticateAdmin,
    validateBody(reviewVerificationSchema),
    reviewVerificationHandler,
  )

  return router
}

export const professionalRouter = createProfessionalRouter()
