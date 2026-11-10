import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { ValidationError } from "../errors/AppError"
import { formatZodIssues } from "../middleware/validate"
import { providerQuerySchema } from "../validation/provider"
import {
  getProviders,
  getProviderById,
  rejectPatientProviderMutation,
} from "../services/providerService"

/**
 * GET /api/patient/providers
 * Retrieves providers with search, specialty, and consultType filters.
 */
export async function getProvidersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validatedQuery = providerQuerySchema.parse(req.query)
    const result = await getProviders(validatedQuery)

    res.status(200).json({
      status: "ok",
      data: result,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new ValidationError("Validation failed", formatZodIssues(error)),
      )
    }
    next(error)
  }
}

/**
 * GET /api/patient/providers/:id
 * Retrieves a single provider by ID or slug.
 */
export async function getProviderByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const provider = await getProviderById(req.params.id as string)
    res.status(200).json({
      status: "ok",
      data: provider,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/patient/providers
 * Blocks patient attempt to create providers (Rule C: 403 Forbidden).
 */
export async function patientCreateProviderBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await rejectPatientProviderMutation("create")
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/patient/providers/:id
 * Blocks patient attempt to modify providers (Rule C: 403 Forbidden).
 */
export async function patientUpdateProviderBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await rejectPatientProviderMutation("modify")
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/patient/providers/:id
 * Blocks patient attempt to delete providers (Rule C: 403 Forbidden).
 */
export async function patientDeleteProviderBlockedHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await rejectPatientProviderMutation("delete")
  } catch (error) {
    next(error)
  }
}
