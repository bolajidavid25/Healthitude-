import { Request, Response, NextFunction } from "express"
import {
  getPatientPrescriptions,
  getPatientPrescriptionById,
  recordPatientAdherence,
  rejectPatientPrescriptionCreate,
  rejectPatientPrescriptionUpdate,
  rejectPatientPrescriptionDelete,
} from "../services/prescriptionService"

/**
 * Handles GET /api/patient/prescriptions
 */
export async function getPatientPrescriptionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const prescriptions = await getPatientPrescriptions(patientId)

    res.status(200).json({
      status: "success",
      data: prescriptions,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles GET /api/patient/prescriptions/:id
 */
export async function getPatientPrescriptionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const prescription = await getPatientPrescriptionById(patientId, id)

    res.status(200).json({
      status: "success",
      data: prescription,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles POST /api/patient/prescriptions/:id/adherence
 */
export async function recordPatientAdherenceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const id = String(req.params.id)
    const updated = await recordPatientAdherence(patientId, id, req.body)

    res.status(200).json({
      status: "success",
      message: "Adherence recorded successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles POST /api/patient/prescriptions (Patient prescription creation blocked)
 */
export async function patientCreatePrescriptionBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    rejectPatientPrescriptionCreate()
  } catch (error) {
    next(error)
  }
}

/**
 * Handles PATCH /api/patient/prescriptions/:id (Patient prescription edit blocked)
 */
export async function patientUpdatePrescriptionBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    rejectPatientPrescriptionUpdate()
  } catch (error) {
    next(error)
  }
}

/**
 * Handles DELETE /api/patient/prescriptions/:id (Patient prescription deletion blocked)
 */
export async function patientDeletePrescriptionBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    rejectPatientPrescriptionDelete()
  } catch (error) {
    next(error)
  }
}
