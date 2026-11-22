import { Request, Response, NextFunction } from "express"
import {
  getProfessionalDashboard,
  getProfessionalPatients,
  getProfessionalPatientDetail,
  verifyPatientHealthProfile,
  getProfessionalAppointments,
  updateProfessionalAppointmentStatus,
  completeProfessionalConsultation,
  getProfessionalComplaints,
  updateProfessionalComplaint,
  getProfessionalClinicalRecords,
  createProfessionalClinicalRecord,
  getProfessionalPrescriptions,
  createProfessionalPrescription,
  updateProfessionalPrescriptionStatus,
  getProfessionalEmergencies,
  accessProfessionalEmergencyRecord,
  respondProfessionalEmergency,
  resolveProfessionalEmergency,
} from "../services/professionalClinicalService"
import {
  professionalAppointmentsQuerySchema,
  professionalComplaintsQuerySchema,
} from "../validation/professionalClinical"

/**
 * GET /api/professional/dashboard
 */
export async function getProfessionalDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getProfessionalDashboard(req.professional!)
    res.status(200).json({ status: "ok", data })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/patients
 */
export async function getProfessionalPatientsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined
    const patients = await getProfessionalPatients(req.professional!, search)
    res.status(200).json({ status: "ok", data: { patients } })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/patients/:patientId
 */
export async function getProfessionalPatientDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patient = await getProfessionalPatientDetail(
      String(req.params.patientId),
    )
    res.status(200).json({ status: "ok", data: patient })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/patients/:patientId/verify-health-profile
 */
export async function verifyPatientHealthProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await verifyPatientHealthProfile(
      req.professional!,
      String(req.params.patientId),
    )
    res.status(200).json({
      status: "ok",
      message: "Patient health profile clinically verified",
      data: profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/appointments
 */
export async function getProfessionalAppointmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = professionalAppointmentsQuerySchema.parse(req.query)
    const appointments = await getProfessionalAppointments(
      req.professional!,
      parsed,
    )
    res.status(200).json({ status: "ok", data: { appointments } })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/professional/appointments/:id/status
 */
export async function updateProfessionalAppointmentStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointment = await updateProfessionalAppointmentStatus(
      req.professional!,
      String(req.params.id),
      req.body,
    )
    res.status(200).json({
      status: "ok",
      message: "Appointment status updated successfully",
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/appointments/:id/complete
 */
export async function completeConsultationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await completeProfessionalConsultation(
      req.professional!,
      String(req.params.id),
      req.body,
    )
    res.status(200).json({
      status: "ok",
      message:
        "Consultation completed. Clinical notes, diagnoses, and prescriptions saved to patient record.",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/complaints
 */
export async function getProfessionalComplaintsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = professionalComplaintsQuerySchema.parse(req.query)
    const complaints = await getProfessionalComplaints(
      req.professional!,
      parsed,
    )
    res.status(200).json({ status: "ok", data: { complaints } })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/professional/complaints/:id
 */
export async function updateProfessionalComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const complaint = await updateProfessionalComplaint(
      req.professional!,
      String(req.params.id),
      req.body,
    )
    res.status(200).json({
      status: "ok",
      message: "Complaint updated successfully",
      data: complaint,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/clinical-records
 */
export async function getProfessionalClinicalRecordsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId =
      typeof req.query.patientId === "string" ? req.query.patientId : undefined
    const records = await getProfessionalClinicalRecords(
      req.professional!,
      patientId,
    )
    res.status(200).json({ status: "ok", data: { records } })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/clinical-records
 */
export async function createProfessionalClinicalRecordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await createProfessionalClinicalRecord(
      req.professional!,
      req.body,
    )
    res.status(201).json({
      status: "ok",
      message: "Verified clinical record created successfully",
      data: record,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/prescriptions
 */
export async function getProfessionalPrescriptionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId =
      typeof req.query.patientId === "string" ? req.query.patientId : undefined
    const prescriptions = await getProfessionalPrescriptions(
      req.professional!,
      patientId,
    )
    res.status(200).json({ status: "ok", data: { prescriptions } })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/prescriptions
 */
export async function createProfessionalPrescriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prescription = await createProfessionalPrescription(
      req.professional!,
      req.body,
    )
    res.status(201).json({
      status: "ok",
      message: "Prescription issued successfully",
      data: prescription,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/professional/prescriptions/:id/status
 */
export async function updateProfessionalPrescriptionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prescription = await updateProfessionalPrescriptionStatus(
      req.professional!,
      String(req.params.id),
      req.body.status,
    )
    res.status(200).json({
      status: "ok",
      message: "Prescription status updated successfully",
      data: prescription,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/professional/emergencies
 */
export async function getProfessionalEmergenciesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emergencies = await getProfessionalEmergencies()
    res.status(200).json({ status: "ok", data: { emergencies } })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/emergencies/:caseNumber/access
 */
export async function accessProfessionalEmergencyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await accessProfessionalEmergencyRecord(
      req.professional!,
      String(req.params.caseNumber),
      req.body.justification,
      {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    )
    res.status(200).json({ status: "ok", data: record })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/emergencies/:caseNumber/respond
 */
export async function respondProfessionalEmergencyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emergencyCase = await respondProfessionalEmergency(
      req.professional!,
      String(req.params.caseNumber),
      req.body?.notes,
      {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    )
    res.status(200).json({
      status: "ok",
      message: "Emergency response accepted",
      data: emergencyCase,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/professional/emergencies/:caseNumber/resolve
 */
export async function resolveProfessionalEmergencyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emergencyCase = await resolveProfessionalEmergency(
      req.professional!,
      String(req.params.caseNumber),
      req.body.resolutionNotes,
      {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    )
    res.status(200).json({
      status: "ok",
      message: "Emergency case resolved",
      data: emergencyCase,
    })
  } catch (error) {
    next(error)
  }
}
