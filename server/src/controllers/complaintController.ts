import { Request, Response, NextFunction } from "express"
import {
  createComplaint,
  getPatientComplaints,
  getPatientComplaintById,
  updatePatientComplaint,
  deletePatientComplaint,
} from "../services/complaintService"

/**
 * POST /api/patient/complaints
 * Submits a new clinical complaint for the authenticated patient.
 */
export async function createComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const complaint = await createComplaint(patientId, req.body)

    res.status(201).json({
      status: "success",
      message: "Complaint submitted successfully",
      data: complaint,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/complaints
 * Retrieves all complaints for the authenticated patient.
 */
export async function getComplaintsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const complaints = await getPatientComplaints(patientId)

    res.status(200).json({
      status: "success",
      data: {
        complaints,
        count: complaints.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/complaints/:id
 * Retrieves a single complaint by ID or reference, verifying patient ownership.
 */
export async function getComplaintByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const complaintId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const complaint = await getPatientComplaintById(patientId, complaintId)

    res.status(200).json({
      status: "success",
      data: complaint,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/patient/complaints/:id
 * Updates patient-reported fields of a complaint while status remains NEW.
 */
export async function updateComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const complaintId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const updated = await updatePatientComplaint(
      patientId,
      complaintId,
      req.body,
    )

    res.status(200).json({
      status: "success",
      message: "Complaint updated successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/patient/complaints/:id
 * Deletion is disallowed by policy (Rule 3). Responds with 403 Forbidden.
 */
export async function deleteComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const complaintId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    await deletePatientComplaint(patientId, complaintId)
  } catch (error) {
    next(error)
  }
}
