import { Request, Response, NextFunction } from "express"
import {
  getPatientEmergencyStatus,
  initiateEmergencyCase,
  cancelEmergencyCase,
  respondToEmergencyCase,
  getEmergencyFocusedClinicalRecord,
  rejectEmergencyDeletion,
} from "../services/emergencyService"
import {
  InitiateEmergencyInput,
  CancelEmergencyInput,
  RespondEmergencyInput,
  ClinicianEmergencyAccessInput,
} from "../validation/emergency"

export async function getPatientEmergencyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const result = await getPatientEmergencyStatus(patientId)
    res.status(200).json({
      status: "success",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function initiateEmergencyHandler(
  req: Request<{}, {}, InitiateEmergencyInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const result = await initiateEmergencyCase(patientId, req.body, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(201).json({
      status: "success",
      message:
        "Break-Glass emergency request initiated. Verified responders alerted.",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function cancelEmergencyHandler(
  req: Request<{}, {}, CancelEmergencyInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const result = await cancelEmergencyCase(patientId, req.body, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(200).json({
      status: "success",
      message: "Emergency request has been cancelled.",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function respondToEmergencyHandler(
  req: Request<{ caseNumber: string }, {}, RespondEmergencyInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { caseNumber } = req.params
    const result = await respondToEmergencyCase(caseNumber, req.body, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(200).json({
      status: "success",
      message: `Clinician ${result.responderName} accepted emergency response for Case #${result.caseNumber}.`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getEmergencyClinicalRecordHandler(
  req: Request<{ caseNumber: string }, {}, ClinicianEmergencyAccessInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { caseNumber } = req.params
    const result = await getEmergencyFocusedClinicalRecord(
      caseNumber,
      req.body,
      {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    )

    res.status(200).json({
      status: "success",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteEmergencyBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    rejectEmergencyDeletion()
  } catch (error) {
    next(error)
  }
}
