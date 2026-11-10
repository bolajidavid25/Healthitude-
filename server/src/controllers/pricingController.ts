import { Request, Response, NextFunction } from "express"
import { pricingService } from "../services/pricingService"
import { RequestCategoryChangeInput } from "../validation/pricing"

/**
 * GET /api/patient/pricing
 * Retrieves the authenticated patient's active billing category and applicable pricing plan.
 */
export async function getPatientPricingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const data = await pricingService.getPatientPricingAndCoverage(userId)

    res.status(200).json({
      status: "success",
      data,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/pricing/plans
 * Retrieves all approved pricing plans and precedence rules.
 */
export function getAllPricingPlansHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const data = pricingService.getAllPricingPlans()

    res.status(200).json({
      status: "success",
      data,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/patient/category
 * Requests an update to the patient's billing category.
 * Enforces single category and resets verification status to PENDING.
 */
export async function updatePatientCategoryHandler(
  req: Request<{}, any, RequestCategoryChangeInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const data = await pricingService.updatePatientCategory(userId, req.body)

    res.status(200).json({
      status: "success",
      message: "Patient billing category updated; verification pending review.",
      data,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/patient/category
 * DELETE /api/patient/pricing
 * Strictly rejects patient attempts to delete their billing category.
 */
export function deletePatientCategoryBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    pricingService.rejectCategoryDelete()
  } catch (error) {
    next(error)
  }
}
