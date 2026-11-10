import { Request, Response, NextFunction } from "express"
import { telemedicineService } from "../services/telemedicineService"
import {
  StartTelemedicineInput,
  EndTelemedicineInput,
} from "../validation/telemedicine"

/**
 * POST /api/patient/appointments/:id/telemedicine
 * Starts or rejoins an active telemedicine video consultation.
 */
export async function startTelemedicineHandler(
  req: Request<{ id: string }, any, StartTelemedicineInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const appointmentId = String(req.params.id)
    const session = await telemedicineService.startSession(
      patientId,
      appointmentId,
      req.body,
    )

    res.status(200).json({
      status: "success",
      message: "Telemedicine consultation session active",
      data: session,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/appointments/:id/telemedicine
 * Retrieves active or latest telemedicine session details for an appointment.
 */
export async function getTelemedicineHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const appointmentId = String(req.params.id)
    const session = await telemedicineService.getSessionByAppointment(
      patientId,
      appointmentId,
    )

    res.status(200).json({
      status: "success",
      data: session,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/telemedicine/sessions/:sessionId
 * Retrieves telemedicine session details by session ID or session number.
 */
export async function getTelemedicineSessionByIdHandler(
  req: Request<{ sessionId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const sessionId = String(req.params.sessionId)
    const session = await telemedicineService.getSessionById(
      patientId,
      sessionId,
    )

    res.status(200).json({
      status: "success",
      data: session,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/patient/telemedicine/sessions/:sessionId/end
 * POST /api/patient/appointments/:id/telemedicine/end
 * Ends a telemedicine session and records call duration and audit metrics.
 */
export async function endTelemedicineSessionHandler(
  req: Request<{ sessionId?: string; id?: string }, any, EndTelemedicineInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const identifier = String(req.params.sessionId || req.params.id)
    const session = await telemedicineService.endSession(
      patientId,
      identifier,
      req.body,
    )

    res.status(200).json({
      status: "success",
      message: "Telemedicine consultation session ended",
      data: session,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/patient/telemedicine/sessions/:sessionId
 * DELETE /api/patient/appointments/:id/telemedicine
 * Explicitly rejects patient attempts to delete consultation logs (HTTP 403 Forbidden).
 */
export function patientDeleteTelemedicineBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    telemedicineService.rejectPatientSessionDelete()
  } catch (error) {
    next(error)
  }
}
