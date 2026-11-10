import { Request, Response, NextFunction } from "express"
import {
  getPatientAppointments,
  getPatientAppointmentById,
  createAppointment,
  submitAppointmentIntake,
  rescheduleAppointment,
  cancelAppointment,
  rejectPatientAppointmentDelete,
} from "../services/appointmentService"

/**
 * Handles GET /api/patient/appointments
 */
export async function getPatientAppointmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const tab = req.query
      .tab as "upcoming" | "completed" | "cancelled" | undefined
    const appointments = await getPatientAppointments(patientId, tab)

    res.status(200).json({
      status: "success",
      data: appointments,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles GET /api/patient/appointments/:id
 */
export async function getPatientAppointmentByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const appointment = await getPatientAppointmentById(patientId, id)

    res.status(200).json({
      status: "success",
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles POST /api/patient/appointments
 */
export async function createAppointmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const appointment = await createAppointment(patientId, req.body)

    res.status(201).json({
      status: "success",
      message: "Appointment booked successfully",
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles PATCH /api/patient/appointments/:id/intake
 */
export async function submitAppointmentIntakeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const updated = await submitAppointmentIntake(patientId, id, req.body)

    res.status(200).json({
      status: "success",
      message: "Intake form submitted successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles PATCH /api/patient/appointments/:id/reschedule
 */
export async function rescheduleAppointmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const updated = await rescheduleAppointment(patientId, id, req.body)

    res.status(200).json({
      status: "success",
      message: "Appointment rescheduled successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles POST /api/patient/appointments/:id/cancel
 */
export async function cancelAppointmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const reason = req.body?.reason
    const cancelled = await cancelAppointment(patientId, id, reason)

    res.status(200).json({
      status: "success",
      message: "Appointment cancelled successfully",
      data: cancelled,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles DELETE /api/patient/appointments/:id (Physical deletion prohibited)
 */
export async function patientDeleteAppointmentBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    rejectPatientAppointmentDelete()
  } catch (error) {
    next(error)
  }
}
