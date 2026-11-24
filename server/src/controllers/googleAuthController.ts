import { Request, Response, NextFunction } from "express"
import {
  authenticatePatientWithGoogle,
  registerPatientWithGoogle,
  authenticateProfessionalWithGoogle,
  registerProfessionalWithGoogle,
} from "../services/googleAuthService"
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getSessionCookieOptions,
  getCsrfCookieOptions,
} from "../utils/session"
import {
  PROF_SESSION_COOKIE_NAME,
  PROF_CSRF_COOKIE_NAME,
  getProfSessionCookieOptions,
  getProfCsrfCookieOptions,
} from "../utils/professionalSession"
import { getClientIp } from "../middleware/rateLimiter"

/**
 * POST /api/auth/google
 * Verifies Firebase Google ID token for Patient Portal.
 */
export async function googlePatientAuthHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idToken = String(req.body?.idToken || "")
    const result = await authenticatePatientWithGoogle(idToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: getClientIp(req),
    })

    if (result.needsOnboarding) {
      res.status(200).json({
        status: "success",
        needsOnboarding: true,
        message: "Google account verified. Complete your patient profile to finish signing up.",
        data: {
          needsOnboarding: true,
          googleProfile: result.googleProfile,
        },
      })
      return
    }

    res.cookie(SESSION_COOKIE_NAME, result.rawToken, getSessionCookieOptions())
    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, getCsrfCookieOptions())

    res.status(200).json({
      status: "success",
      needsOnboarding: false,
      message: "Google sign-in successful",
      data: {
        needsOnboarding: false,
        user: result.user,
        csrfToken: result.csrfToken,
        session: result.session,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/auth/google/register
 * Completes new patient registration using a verified Firebase Google ID token.
 */
export async function googlePatientRegisterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idToken = String(req.body?.idToken || "")
    const { idToken: _ignored, ...payload } = req.body || {}

    const result = await registerPatientWithGoogle(idToken, payload, {
      userAgent: req.headers["user-agent"],
      ipAddress: getClientIp(req),
    })

    res.cookie(SESSION_COOKIE_NAME, result.rawToken, getSessionCookieOptions())
    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, getCsrfCookieOptions())

    res.status(201).json({
      status: "success",
      message: "Patient account created with Google successfully",
      data: {
        user: result.user,
        csrfToken: result.csrfToken,
        session: result.session,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/google
 * Verifies Firebase Google ID token for Professional (Doctor) Portal.
 */
export async function googleProfessionalAuthHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idToken = String(req.body?.idToken || "")
    const result = await authenticateProfessionalWithGoogle(idToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    if (result.needsRegistration) {
      res.status(200).json({
        status: "success",
        needsRegistration: true,
        message: "Google account verified. Complete your medical credentials to finish registering.",
        data: {
          needsRegistration: true,
          googleProfile: result.googleProfile,
        },
      })
      return
    }

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
      needsRegistration: false,
      message: "Professional Google sign-in successful",
      professional: result.professional,
      hasCsrfToken: true,
      sessionExpiresAt: result.session.expiresAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/google/register
 * Completes new doctor registration using a verified Firebase Google ID token (PENDING admin review).
 */
export async function googleProfessionalRegisterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idToken = String(req.body?.idToken || "")
    const professional = await registerProfessionalWithGoogle(idToken, req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    res.status(201).json({
      status: "success",
      message:
        "Professional account registered with Google. Verification is pending administrator review.",
      data: professional,
    })
  } catch (error) {
    next(error)
  }
}
