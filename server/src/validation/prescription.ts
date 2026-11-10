import { z } from "zod"
import { PrescriptionStatus, AdherenceStatus } from "../generated/prisma/enums"

/**
 * Normalizes boolean or string inputs to canonical AdherenceStatus enum:
 * - true / "TAKEN" / "taken" -> AdherenceStatus.TAKEN
 * - false / "SKIPPED" / "skipped" -> AdherenceStatus.SKIPPED
 */
export function normalizeAdherenceStatus(val: unknown): AdherenceStatus {
  if (val === true || val === "true" || val === "TAKEN" || val === "taken") {
    return AdherenceStatus.TAKEN
  }
  if (
    val === false ||
    val === "false" ||
    val === "SKIPPED" ||
    val === "skipped"
  ) {
    return AdherenceStatus.SKIPPED
  }
  throw new Error("Invalid adherence status. Must be TAKEN or SKIPPED.")
}

/**
 * Validates recording medication adherence for a prescription
 */
export const recordAdherenceSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    status: z
      .union([
        z.nativeEnum(AdherenceStatus),
        z.enum(["TAKEN", "SKIPPED", "taken", "skipped"]),
        z.boolean(),
      ])
      .transform(normalizeAdherenceStatus),
    notes: z.string().max(255, "Notes cannot exceed 255 characters").optional(),
  })
  .strict()

export type RecordAdherenceInput = z.infer<typeof recordAdherenceSchema>

/**
 * Validates internal / clinician prescription creation
 */
export const createPrescriptionSchema = z
  .object({
    patientId: z.string().uuid("Invalid patient UUID"),
    medicine: z.string().min(1, "Medicine name is required").max(255),
    dose: z.string().min(1, "Dose is required").max(100),
    frequency: z.string().min(1, "Frequency is required").max(100),
    duration: z.string().min(1, "Duration is required").max(100),
    prescriber: z.string().min(1, "Prescriber name is required").max(255),
    prescriberId: z.string().uuid().optional(),
    instructions: z.string().max(1000).optional(),
    status: z
      .nativeEnum(PrescriptionStatus)
      .optional()
      .default(PrescriptionStatus.ACTIVE),
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
  })
  .strict()

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>
