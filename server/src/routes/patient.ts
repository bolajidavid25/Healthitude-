import { Router } from "express"
import { validateBody } from "../middleware/validate"
import { authenticate } from "../middleware/authenticate"
import { csrfProtection } from "../middleware/csrf"
import { registrationRateLimiter } from "../middleware/rateLimiter"
import {
  parseProfilePhotoUpload,
  parseSupportingDocumentUpload,
} from "../middleware/upload"
import { patientRegistrationSchema } from "../validation/onboarding"
import { changePasswordSchema } from "../validation/auth"
import {
  updatePatientProfileSchema,
  recordConsentSchema,
} from "../validation/patientProfile"
import { registerPatientHandler } from "../controllers/patientController"
import { changePasswordHandler } from "../controllers/authController"
import {
  getProfileHandler,
  getProfileByIdHandler,
  getOnboardingStatusHandler,
  updateProfileHandler,
  getCategoryStatusHandler,
  getConsentsHandler,
  recordConsentHandler,
} from "../controllers/patientProfileController"
import {
  uploadProfilePhotoHandler,
  getProfilePhotoHandler,
  getProfilePhotoByIdHandler,
  deleteProfilePhotoHandler,
  uploadCategoryDocumentHandler,
  getCategoryDocumentHandler,
  getCategoryDocumentByIdHandler,
} from "../controllers/patientUploadController"
import {
  getPatientDashboardHandler,
  getPatientDashboardByIdHandler,
} from "../controllers/patientDashboardController"

import {
  createComplaintSchema,
  updateComplaintSchema,
} from "../validation/complaint"
import {
  createComplaintHandler,
  getComplaintsHandler,
  getComplaintByIdHandler,
  updateComplaintHandler,
  deleteComplaintHandler,
} from "../controllers/complaintController"
import {
  getPatientClinicalRecordsHandler,
  getPatientClinicalRecordByIdHandler,
  getPatientClinicalRecordAttachmentHandler,
  patientCreateRecordBlockedHandler,
  patientUpdateRecordBlockedHandler,
  patientDeleteRecordBlockedHandler,
} from "../controllers/clinicalRecordController"
import {
  getPatientPrescriptionsHandler,
  getPatientPrescriptionByIdHandler,
  recordPatientAdherenceHandler,
  patientCreatePrescriptionBlockedHandler,
  patientUpdatePrescriptionBlockedHandler,
  patientDeletePrescriptionBlockedHandler,
} from "../controllers/prescriptionController"
import { recordAdherenceSchema } from "../validation/prescription"
import {
  getPatientAppointmentsHandler,
  getPatientAppointmentByIdHandler,
  createAppointmentHandler,
  submitAppointmentIntakeHandler,
  rescheduleAppointmentHandler,
  cancelAppointmentHandler,
  patientDeleteAppointmentBlockedHandler,
} from "../controllers/appointmentController"
import {
  createAppointmentSchema,
  updateAppointmentIntakeSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
} from "../validation/appointment"
import {
  getProvidersHandler,
  getProviderByIdHandler,
  patientCreateProviderBlockedHandler,
  patientUpdateProviderBlockedHandler,
  patientDeleteProviderBlockedHandler,
} from "../controllers/providerController"
import {
  startTelemedicineSchema,
  endTelemedicineSchema,
} from "../validation/telemedicine"
import {
  startTelemedicineHandler,
  getTelemedicineHandler,
  getTelemedicineSessionByIdHandler,
  endTelemedicineSessionHandler,
  patientDeleteTelemedicineBlockedHandler,
} from "../controllers/telemedicineController"
import { requestCategoryChangeSchema } from "../validation/pricing"
import {
  getPatientPricingHandler,
  getAllPricingPlansHandler,
  updatePatientCategoryHandler,
  deletePatientCategoryBlockedHandler,
} from "../controllers/pricingController"
import {
  initiateEmergencySchema,
  cancelEmergencySchema,
  respondEmergencySchema,
  clinicianEmergencyAccessSchema,
} from "../validation/emergency"
import {
  getPatientEmergencyHandler,
  initiateEmergencyHandler,
  cancelEmergencyHandler,
  respondToEmergencyHandler,
  getEmergencyClinicalRecordHandler,
  deleteEmergencyBlockedHandler,
} from "../controllers/emergencyController"
import {
  getPatientNotificationsHandler,
  getUnreadNotificationCountHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  deleteNotificationHandler,
} from "../controllers/notificationController"

export const patientRouter = Router()

/**
 * Public Onboarding Registration Route
 * POST /api/patient/register
 */
patientRouter.post(
  "/register",
  registrationRateLimiter,
  validateBody(patientRegistrationSchema),
  registerPatientHandler,
)

/**
 * Authenticated Profile & Onboarding Management Routes
 * Rule C: Patient may only access their own records.
 * Rule D: Patient ID derived from session (req.user.id).
 * Rule E & F: Request body strictly validated with allowlisted schemas.
 * Rule L: Cookie-authenticated state mutations require CSRF protection.
 */
patientRouter.get("/profile", authenticate, getProfileHandler)
patientRouter.patch(
  "/profile",
  authenticate,
  csrfProtection,
  validateBody(updatePatientProfileSchema),
  updateProfileHandler,
)

patientRouter.post(
  "/change-password",
  authenticate,
  csrfProtection,
  validateBody(changePasswordSchema),
  changePasswordHandler,
)

/**
 * Clinical Complaints Management Routes
 */
patientRouter.post(
  "/complaints",
  authenticate,
  csrfProtection,
  validateBody(createComplaintSchema),
  createComplaintHandler,
)
patientRouter.get("/complaints", authenticate, getComplaintsHandler)
patientRouter.get("/complaints/:id", authenticate, getComplaintByIdHandler)
patientRouter.patch(
  "/complaints/:id",
  authenticate,
  csrfProtection,
  validateBody(updateComplaintSchema),
  updateComplaintHandler,
)
patientRouter.delete(
  "/complaints/:id",
  authenticate,
  csrfProtection,
  deleteComplaintHandler,
)

/**
 * Clinical Records Endpoints (Rule 1-4 & Check)
 * Read-only for patients; creation/updates/deletions blocked with HTTP 403 Forbidden.
 */
patientRouter.get("/records", authenticate, getPatientClinicalRecordsHandler)
patientRouter.get(
  "/records/:id",
  authenticate,
  getPatientClinicalRecordByIdHandler,
)
patientRouter.get(
  "/records/:id/attachment",
  authenticate,
  getPatientClinicalRecordAttachmentHandler,
)
patientRouter.post(
  "/records",
  authenticate,
  csrfProtection,
  patientCreateRecordBlockedHandler,
)
patientRouter.patch(
  "/records/:id",
  authenticate,
  csrfProtection,
  patientUpdateRecordBlockedHandler,
)
patientRouter.delete(
  "/records/:id",
  authenticate,
  csrfProtection,
  patientDeleteRecordBlockedHandler,
)

/**
 * Prescriptions and Adherence Routes (Step 6)
 * Patients have read access and can record daily adherence on active prescriptions.
 * Direct creation, editing, or deletion of prescriptions by patients are blocked with HTTP 403 Forbidden.
 */
patientRouter.get(
  "/prescriptions",
  authenticate,
  getPatientPrescriptionsHandler,
)
patientRouter.get(
  "/prescriptions/:id",
  authenticate,
  getPatientPrescriptionByIdHandler,
)
patientRouter.post(
  "/prescriptions/:id/adherence",
  authenticate,
  csrfProtection,
  validateBody(recordAdherenceSchema),
  recordPatientAdherenceHandler,
)
patientRouter.post(
  "/prescriptions",
  authenticate,
  csrfProtection,
  patientCreatePrescriptionBlockedHandler,
)
patientRouter.patch(
  "/prescriptions/:id",
  authenticate,
  csrfProtection,
  patientUpdatePrescriptionBlockedHandler,
)
patientRouter.delete(
  "/prescriptions/:id",
  authenticate,
  csrfProtection,
  patientDeletePrescriptionBlockedHandler,
)

/**
 * Appointments & Scheduling Routes (Step 7)
 * Database-backed appointment system supporting intake, rescheduling, and soft-cancellation.
 */
patientRouter.get("/appointments", authenticate, getPatientAppointmentsHandler)
patientRouter.get(
  "/appointments/:id",
  authenticate,
  getPatientAppointmentByIdHandler,
)
patientRouter.post(
  "/appointments",
  authenticate,
  csrfProtection,
  validateBody(createAppointmentSchema),
  createAppointmentHandler,
)
patientRouter.patch(
  "/appointments/:id/intake",
  authenticate,
  csrfProtection,
  validateBody(updateAppointmentIntakeSchema),
  submitAppointmentIntakeHandler,
)
patientRouter.patch(
  "/appointments/:id/reschedule",
  authenticate,
  csrfProtection,
  validateBody(rescheduleAppointmentSchema),
  rescheduleAppointmentHandler,
)
patientRouter.post(
  "/appointments/:id/cancel",
  authenticate,
  csrfProtection,
  validateBody(cancelAppointmentSchema),
  cancelAppointmentHandler,
)
patientRouter.delete(
  "/appointments/:id",
  authenticate,
  csrfProtection,
  patientDeleteAppointmentBlockedHandler,
)

/**
 * Provider Discovery Routes (Step 8)
 * Authenticated provider search, filtering, and single lookup.
 * Direct creation, updates, and deletion by patients are blocked with HTTP 403 Forbidden.
 */
patientRouter.get("/providers", authenticate, getProvidersHandler)
patientRouter.get("/providers/:id", authenticate, getProviderByIdHandler)
patientRouter.post(
  "/providers",
  authenticate,
  csrfProtection,
  patientCreateProviderBlockedHandler,
)
patientRouter.patch(
  "/providers/:id",
  authenticate,
  csrfProtection,
  patientUpdateProviderBlockedHandler,
)
patientRouter.delete(
  "/providers/:id",
  authenticate,
  csrfProtection,
  patientDeleteProviderBlockedHandler,
)

/**
 * Telemedicine & Consultation Session Routes (Step 9)
 * Secure session initiation, status query, termination, and audit log protection.
 */
patientRouter.post(
  "/appointments/:id/telemedicine",
  authenticate,
  csrfProtection,
  validateBody(startTelemedicineSchema),
  startTelemedicineHandler,
)
patientRouter.get(
  "/appointments/:id/telemedicine",
  authenticate,
  getTelemedicineHandler,
)
patientRouter.post(
  "/appointments/:id/telemedicine/end",
  authenticate,
  csrfProtection,
  validateBody(endTelemedicineSchema),
  endTelemedicineSessionHandler,
)
patientRouter.get(
  "/telemedicine/sessions/:sessionId",
  authenticate,
  getTelemedicineSessionByIdHandler,
)
patientRouter.post(
  "/telemedicine/sessions/:sessionId/end",
  authenticate,
  csrfProtection,
  validateBody(endTelemedicineSchema),
  endTelemedicineSessionHandler,
)
patientRouter.delete(
  "/telemedicine/sessions/:sessionId",
  authenticate,
  csrfProtection,
  patientDeleteTelemedicineBlockedHandler,
)
patientRouter.delete(
  "/appointments/:id/telemedicine",
  authenticate,
  csrfProtection,
  patientDeleteTelemedicineBlockedHandler,
)

patientRouter.get("/dashboard", authenticate, getPatientDashboardHandler)
patientRouter.get(
  "/onboarding-status",
  authenticate,
  getOnboardingStatusHandler,
)
patientRouter.get("/category-status", authenticate, getCategoryStatusHandler)

/**
 * Pricing & Coverage Routes (Step 10)
 * Read authorized pricing & category plans, request category changes, and block category deletion.
 */
patientRouter.get("/pricing", authenticate, getPatientPricingHandler)
patientRouter.get("/pricing/plans", authenticate, getAllPricingPlansHandler)
patientRouter.patch(
  "/category",
  authenticate,
  csrfProtection,
  validateBody(requestCategoryChangeSchema),
  updatePatientCategoryHandler,
)
patientRouter.delete(
  "/category",
  authenticate,
  csrfProtection,
  deletePatientCategoryBlockedHandler,
)
patientRouter.delete(
  "/pricing",
  authenticate,
  csrfProtection,
  deletePatientCategoryBlockedHandler,
)

patientRouter.get("/consents", authenticate, getConsentsHandler)
patientRouter.post(
  "/consents",
  authenticate,
  csrfProtection,
  validateBody(recordConsentSchema),
  recordConsentHandler,
)

/**
 * Emergency & Break-Glass Access Routes (Step 11)
 * Rule A1 & A2: Patient initiates Break-Glass emergency; responder accepts; authorized clinical access; immutable audit trail.
 * Rule A3: Permanent deletion is strictly prohibited (HTTP 403 Forbidden).
 */
patientRouter.get("/emergency", authenticate, getPatientEmergencyHandler)
patientRouter.post(
  "/emergency",
  authenticate,
  csrfProtection,
  validateBody(initiateEmergencySchema),
  initiateEmergencyHandler,
)
patientRouter.post(
  "/emergency/cancel",
  authenticate,
  csrfProtection,
  validateBody(cancelEmergencySchema),
  cancelEmergencyHandler,
)
patientRouter.post(
  "/emergency/:caseNumber/respond",
  authenticate,
  csrfProtection,
  validateBody(respondEmergencySchema),
  respondToEmergencyHandler,
)
patientRouter.post(
  "/emergency/:caseNumber/clinical-record",
  authenticate,
  csrfProtection,
  validateBody(clinicianEmergencyAccessSchema),
  getEmergencyClinicalRecordHandler,
)
patientRouter.delete(
  "/emergency",
  authenticate,
  csrfProtection,
  deleteEmergencyBlockedHandler,
)
patientRouter.delete(
  "/emergency/:caseNumber",
  authenticate,
  csrfProtection,
  deleteEmergencyBlockedHandler,
)

/**
 * In-App Patient Notification Routes (Step 12)
 * Rule 5: GET paginated, GET unread-count, PATCH mark-one-read, PATCH mark-all-read, DELETE dismiss.
 * Rule 6: Derive patient identity from authenticated session.
 * Rule 7: IDOR defense strictly enforced.
 */
patientRouter.get(
  "/notifications",
  authenticate,
  getPatientNotificationsHandler,
)
patientRouter.get(
  "/notifications/unread-count",
  authenticate,
  getUnreadNotificationCountHandler,
)
patientRouter.patch(
  "/notifications/mark-all-read",
  authenticate,
  csrfProtection,
  markAllNotificationsReadHandler,
)
patientRouter.patch(
  "/notifications/:id/read",
  authenticate,
  csrfProtection,
  markNotificationReadHandler,
)
patientRouter.delete(
  "/notifications/:id",
  authenticate,
  csrfProtection,
  deleteNotificationHandler,
)

/**
 * Controlled Profile Photo Upload & Retrieval Routes
 * Rule C: Enforces 2 MB size limit.
 * Rule D: Validates JPEG/PNG magic bytes.
 * Rule H: Controlled serving with nosniff headers.
 */
patientRouter.post(
  "/profile-photo",
  authenticate,
  csrfProtection,
  parseProfilePhotoUpload,
  uploadProfilePhotoHandler,
)
patientRouter.get("/profile-photo", authenticate, getProfilePhotoHandler)
patientRouter.delete(
  "/profile-photo",
  authenticate,
  csrfProtection,
  deleteProfilePhotoHandler,
)

/**
 * Controlled Category Supporting Document Upload & Retrieval Routes
 * Rule Q: Setting/updating document keeps category verificationStatus: PENDING.
 * Rule J & K: Restricts document access to authorized user.
 */
patientRouter.post(
  "/category-document",
  authenticate,
  csrfProtection,
  parseSupportingDocumentUpload,
  uploadCategoryDocumentHandler,
)
patientRouter.get(
  "/category-document",
  authenticate,
  getCategoryDocumentHandler,
)

/**
 * Parameterized Access-Controlled Routes (IDOR Prevention)
 * Checks req.params.userId === req.user.id (Rule C & Check 2, 8).
 */
patientRouter.get("/:userId/profile", authenticate, getProfileByIdHandler)
patientRouter.get(
  "/:userId/dashboard",
  authenticate,
  getPatientDashboardByIdHandler,
)
patientRouter.get(
  "/:userId/profile-photo",
  authenticate,
  getProfilePhotoByIdHandler,
)
patientRouter.get(
  "/:userId/category-document",
  authenticate,
  getCategoryDocumentByIdHandler,
)
