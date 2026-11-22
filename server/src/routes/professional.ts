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
  getProfessionalDashboardHandler,
  getProfessionalPatientsHandler,
  getProfessionalPatientDetailHandler,
  verifyPatientHealthProfileHandler,
  getProfessionalAppointmentsHandler,
  updateProfessionalAppointmentStatusHandler,
  completeConsultationHandler,
  getProfessionalComplaintsHandler,
  updateProfessionalComplaintHandler,
  getProfessionalClinicalRecordsHandler,
  createProfessionalClinicalRecordHandler,
  getProfessionalPrescriptionsHandler,
  createProfessionalPrescriptionHandler,
  updateProfessionalPrescriptionStatusHandler,
  getProfessionalEmergenciesHandler,
  accessProfessionalEmergencyHandler,
  respondProfessionalEmergencyHandler,
  resolveProfessionalEmergencyHandler,
} from "../controllers/professionalClinicalController"
import {
  authenticateProfessional,
  requireVerifiedProfessional,
} from "../middleware/authenticateProfessional"
import { authenticateAdmin } from "../middleware/authenticateAdmin"
import { profCsrfProtection } from "../middleware/csrf"
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
  updateProfessionalAppointmentStatusSchema,
  completeConsultationSchema,
  updateProfessionalComplaintSchema,
  professionalCreateClinicalRecordSchema,
  professionalCreatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  professionalEmergencyAccessSchema,
  professionalEmergencyRespondSchema,
  professionalEmergencyResolveSchema,
} from "../validation/professionalClinical"
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

  // Dashboard Summary
  router.get(
    "/dashboard",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalDashboardHandler,
  )

  // Patient Lookup, Clinical Dossier & Health Profile Verification (Rule A)
  router.get(
    "/patients",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalPatientsHandler,
  )
  router.get(
    "/patients/:patientId",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalPatientDetailHandler,
  )
  router.post(
    "/patients/:patientId/verify-health-profile",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    verifyPatientHealthProfileHandler,
  )

  // Appointments & Consultations
  router.get(
    "/appointments",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalAppointmentsHandler,
  )
  router.patch(
    "/appointments/:id/status",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(updateProfessionalAppointmentStatusSchema),
    updateProfessionalAppointmentStatusHandler,
  )
  router.post(
    "/appointments/:id/complete",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(completeConsultationSchema),
    completeConsultationHandler,
  )

  // Complaint Queue & Triage
  router.get(
    "/complaints",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalComplaintsHandler,
  )
  router.patch(
    "/complaints/:id",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(updateProfessionalComplaintSchema),
    updateProfessionalComplaintHandler,
  )

  // Clinical Records Authoring (Rule A: Clinically Verified)
  router.get(
    "/clinical-records",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalClinicalRecordsHandler,
  )
  router.post(
    "/clinical-records",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(professionalCreateClinicalRecordSchema),
    createProfessionalClinicalRecordHandler,
  )

  // Prescriptions Issuance & Management
  router.get(
    "/prescriptions",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalPrescriptionsHandler,
  )
  router.post(
    "/prescriptions",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(professionalCreatePrescriptionSchema),
    createProfessionalPrescriptionHandler,
  )
  router.patch(
    "/prescriptions/:id/status",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(updatePrescriptionStatusSchema),
    updateProfessionalPrescriptionStatusHandler,
  )

  // Emergency Break-Glass Response (Rule C: Relationship Bypass + Immutable Audit)
  router.get(
    "/emergencies",
    authenticateProfessional,
    requireVerifiedProfessional,
    getProfessionalEmergenciesHandler,
  )
  router.post(
    "/emergencies/:caseNumber/access",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(professionalEmergencyAccessSchema),
    accessProfessionalEmergencyHandler,
  )
  router.post(
    "/emergencies/:caseNumber/respond",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(professionalEmergencyRespondSchema),
    respondProfessionalEmergencyHandler,
  )
  router.post(
    "/emergencies/:caseNumber/resolve",
    authenticateProfessional,
    requireVerifiedProfessional,
    profCsrfProtection,
    validateBody(professionalEmergencyResolveSchema),
    resolveProfessionalEmergencyHandler,
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
