import { z } from "zod"

/**
 * Validation schema for patient initiating a Break-Glass emergency request.
 */
export const initiateEmergencySchema = z
  .object({
    reason: z.string().trim().max(255).optional(),
    symptoms: z.string().trim().max(500).optional(),
  })
  .strict()

/**
 * Validation schema for cancelling an active emergency request.
 */
export const cancelEmergencySchema = z
  .object({
    reason: z.string().trim().max(255).optional(),
  })
  .strict()

/**
 * Validation schema for a clinician responding to/accepting an emergency case.
 */
export const respondEmergencySchema = z
  .object({
    responderName: z
      .string()
      .trim()
      .min(2, "Responder name is required")
      .max(100),
    responderId: z.string().trim().max(100).optional(),
    responderRole: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict()

/**
 * Validation schema for clinician accessing emergency-focused patient records.
 * Requires clinical justification in compliance with Break-Glass access governance.
 */
export const clinicianEmergencyAccessSchema = z
  .object({
    justification: z
      .string()
      .trim()
      .min(
        5,
        "A valid clinical justification (minimum 5 characters) is required to access emergency records",
      )
      .max(500),
    clinicianId: z.string().trim().min(2).max(100),
    clinicianName: z.string().trim().min(2).max(100),
    clinicianRole: z.string().trim().max(100).optional(),
  })
  .strict()

export type InitiateEmergencyInput = z.infer<typeof initiateEmergencySchema>
export type CancelEmergencyInput = z.infer<typeof cancelEmergencySchema>
export type RespondEmergencyInput = z.infer<typeof respondEmergencySchema>
export type ClinicianEmergencyAccessInput = z.infer<typeof clinicianEmergencyAccessSchema>
