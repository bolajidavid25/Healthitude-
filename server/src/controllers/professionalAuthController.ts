import { Request, Response, NextFunction } from "express"
import {
  registerProfessional,
  loginProfessional,
  logoutProfessionalSession,
  getProfessionalVerificationStatus,
  updateProfessionalProfile,
  reviewProfessionalVerification,
  addProfessionalDocument,
  getProfessionalDocuments,
  getProfessionalDocumentById,
  deleteProfessionalDocument,
} from "../services/professionalAuthService"
import {
  PROF_SESSION_COOKIE_NAME,
  PROF_CSRF_COOKIE_NAME,
  getProfSessionCookieOptions,
  getProfCsrfCookieOptions,
} from "../utils/professionalSession"
import {
  registerProfessionalSchema,
  loginProfessionalSchema,
  updateProfessionalProfileSchema,
  reviewVerificationSchema,
} from "../validation/professional"

/**
 * POST /api/professional/register
 * Registers a new professional with PENDING verification status.
 */
export async function registerProfessionalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const professional = await registerProfessional(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    res.status(201).json({
      status: "success",
      message:
        "Professional account registered successfully. Verification is pending administrator review.",
      data: professional,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/login
 * Authenticates a professional and issues independent professional session cookies.
 */
export async function loginProfessionalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginProfessional(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    // Set independent professional cookies
    res.cookie(
      PROF_SESSION_COOKIE_NAME,
      result.rawToken,
      getProfSessionCookieOptions(),
    )
    res.cookie(
      PROF_CSRF_COOKIE_NAME,
      result.csrfToken,
      getProfCsrfCookieOptions(),
    )

    res.status(200).json({
      status: "success",
      message: "Professional authentication successful",
      professional: result.professional,
      hasCsrfToken: true,
      sessionExpiresAt: result.session.expiresAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/logout
 * Terminates the active professional session without affecting any patient session.
 */
export async function logoutProfessionalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.professionalSession?.id) {
      await logoutProfessionalSession(req.professionalSession.id)
    }

    res.clearCookie(PROF_SESSION_COOKIE_NAME, getProfSessionCookieOptions())
    res.clearCookie(PROF_CSRF_COOKIE_NAME, getProfCsrfCookieOptions())

    res.status(200).json({
      status: "success",
      message: "Professional logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/me
 * Retrieves the currently authenticated professional profile.
 */
export async function getMeProfessionalHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      status: "success",
      data: {
        professional: req.professional,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/verification-status
 * Retrieves verification lifecycle status and audit timeline.
 */
export async function getVerificationStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = await getProfessionalVerificationStatus(req.professional!.id)
    res.status(200).json({
      status: "success",
      data: status,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/professional/profile
 * Updates permitted profile fields (unverified professionals may update contact/facility).
 */
export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const updated = await updateProfessionalProfile(
      req.professional!.id,
      req.body,
    )

    res.status(200).json({
      status: "success",
      message: "Professional profile updated successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/admin/verify/:id
 * Dedicated administrator verification review endpoint.
 */
export async function reviewVerificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const professionalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const adminId = req.admin!.id

    const updated = await reviewProfessionalVerification({
      professionalId,
      action: req.body.action,
      adminId,
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
 * POST /api/professional/documents
 * Attach a credential evidence document (Rule 8: non-public internal reference).
 */
export async function addDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const doc = await addProfessionalDocument(req.professional!.id, req.body)
    res.status(201).json({
      status: "success",
      message: "Credential evidence document attached successfully",
      data: doc,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/documents
 * List uploaded credential evidence documents (metadata only).
 */
export async function getDocumentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const docs = await getProfessionalDocuments(req.professional!.id)
    res.status(200).json({
      status: "success",
      data: {
        documents: docs,
        count: docs.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/documents/:id
 * Securely access document metadata or content (permission guarded).
 */
export async function getDocumentByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const doc = await getProfessionalDocumentById(docId, {
      id: req.professional!.id,
      role: "professional",
    })
    res.status(200).json({
      status: "success",
      data: doc,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/professional/documents/:id
 * Delete a credential document while status is pending/under-review.
 */
export async function deleteDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const result = await deleteProfessionalDocument(req.professional!.id, docId)
    res.status(200).json({
      status: "success",
      message: "Document deleted successfully",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/clinical-access-probe
 * Protected probe endpoint to verify clinical privilege gating.
 */
export async function testClinicalAccessHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      status: "success",
      message: "Access granted to verified clinical operation",
      professionalId: req.professional!.id,
      verificationStatus: req.professional!.verificationStatus,
    })
  } catch (error) {
    next(error)
  }
}
