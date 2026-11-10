import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"
import {
  getPatientProfile,
  getOnboardingStatus,
  updatePatientProfile,
  recordPatientConsent,
  getPatientConsents,
  getPatientCategoryStatus,
} from "../services/patientProfileService"

/**
 * Retrieves the profile of the currently authenticated patient.
 * Rule C & D: Derive patient ID strictly from req.user.id.
 */
export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const profile = await getPatientProfile(userId)

    res.status(200).json({
      status: "success",
      data: profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retrieves a patient profile by path parameter :userId.
 * Rule C & Check 2: Prevents IDOR. Ordinary patients can only access their own profile.
 */
export async function getProfileByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const targetUserId = req.params.userId
    const authenticatedUserId = req.user!.id

    if (targetUserId !== authenticatedUserId) {
      return next(
        AppError.forbidden(
          "Access denied: You are not authorized to view another patient's profile",
        ),
      )
    }

    const profile = await getPatientProfile(authenticatedUserId)

    res.status(200).json({
      status: "success",
      data: profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retrieves the 5-stage onboarding status for the authenticated patient.
 * Rule N, O, P, Q.
 */
export async function getOnboardingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const status = await getOnboardingStatus(userId)

    res.status(200).json({
      status: "success",
      data: status,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Updates allowlisted fields of the authenticated patient's profile.
 * Rule E, F, G, H, J, R.
 */
export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const updatedProfile = await updatePatientProfile(userId, req.body)

    res.status(200).json({
      status: "success",
      message: "Patient profile updated successfully",
      data: updatedProfile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retrieves category and verification status for the authenticated patient.
 * Check 8.
 */
export async function getCategoryStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const categoryStatus = await getPatientCategoryStatus(userId)

    res.status(200).json({
      status: "success",
      data: categoryStatus,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retrieves consent audit trail for the authenticated patient.
 * Rule K.
 */
export async function getConsentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const consents = await getPatientConsents(userId)

    res.status(200).json({
      status: "success",
      data: { consents },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Records a new consent version for the authenticated patient.
 * Rule K, M & Check 9, 10.
 */
export async function recordConsentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const consent = await recordPatientConsent(userId, req.body)

    res.status(201).json({
      status: "success",
      message: "Consent recorded successfully",
      data: consent,
    })
  } catch (error) {
    next(error)
  }
}
