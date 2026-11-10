import { Request, Response, NextFunction } from "express"
import { registerPatient } from "../services/patientRegistrationService"

/**
 * Handles patient registration requests for the 5-stage onboarding flow.
 * Rule U: Returns HTTP 201 on successful registration.
 * Rule T: Returns safe response shape without sensitive data.
 */
export async function registerPatientHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerPatient(req.body)
    res.status(201).json({
      status: "success",
      message: "Patient registered successfully",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
