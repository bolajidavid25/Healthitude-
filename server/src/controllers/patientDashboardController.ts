import { Request, Response, NextFunction } from "express"
import { getPatientDashboard } from "../services/patientDashboardService"
import { AppError } from "../errors/AppError"

/**
 * Handles GET /api/patient/dashboard
 * Retrieves authoritative dashboard metrics, category status, vitals, and care team for the authenticated patient.
 */
export async function getPatientDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    const dashboard = await getPatientDashboard(userId)

    res.status(200).json({
      status: "success",
      data: dashboard,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles GET /api/patient/:userId/dashboard
 * Access-controlled dashboard query verifying req.params.userId === req.user.id (IDOR defense).
 */
export async function getPatientDashboardByIdHandler(
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
          "Access denied: You are not authorized to view another patient's dashboard",
        ),
      )
    }

    const dashboard = await getPatientDashboard(authenticatedUserId)

    res.status(200).json({
      status: "success",
      data: dashboard,
    })
  } catch (error) {
    next(error)
  }
}
