import { z } from "zod"
import { ComplaintSeverity } from "../generated/prisma/enums"
import {
  requiredString,
  optionalString,
  findServerControlledFields,
} from "./common"

const SERVER_CONTROLLED_COMPLAINT_FIELDS = [
  "id",
  "referenceId",
  "patientId",
  "userId",
  "status",
  "assignedDoctor",
  "clinicalNotes",
  "resolvedAt",
  "createdAt",
  "updatedAt",
] as const

function rejectServerControlledFields(
  data: Record<string, any>,
  ctx: z.RefinementCtx,
) {
  const found = SERVER_CONTROLLED_COMPLAINT_FIELDS.filter((f) => f in data)
  if (found.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.unrecognized_keys,
      keys: found,
      message: `Unrecognized or server-controlled property: '${found.join(", ")}'`,
    })
  }
}

/**
 * Normalizes severity string (e.g. "Mild" -> "MILD")
 */
export function normalizeSeverity(val: unknown): ComplaintSeverity {
  if (typeof val !== "string") {
    throw new Error("Severity must be a string")
  }
  const upper = val.trim().toUpperCase()
  if (upper === "MILD") return ComplaintSeverity.MILD
  if (upper === "MODERATE") return ComplaintSeverity.MODERATE
  if (upper === "SEVERE") return ComplaintSeverity.SEVERE
  throw new Error(
    `Invalid severity: "${val}". Must be one of: Mild, Moderate, Severe`,
  )
}

export const complaintSeveritySchema = z
  .string({
    required_error: "Severity is required",
    invalid_type_error: "Severity must be a string",
  })
  .trim()
  .min(1, { message: "Severity is required" })
  .superRefine((val, ctx) => {
    try {
      normalizeSeverity(val)
    } catch (err: any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message,
      })
    }
  })
  .transform((val) => normalizeSeverity(val))

/**
 * Schema for patient submitting a new complaint
 */
export const createComplaintSchema = z
  .object({
    symptoms: requiredString("Symptoms description", 3, 2000),
    severity: complaintSeveritySchema,
    duration: optionalString(100),
  })
  .strict()

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>

/**
 * Schema for updating an existing complaint while still in NEW status
 */
export const updateComplaintSchema = z
  .object({
    symptoms: z
      .string()
      .trim()
      .min(3, { message: "Symptoms must be at least 3 characters" })
      .max(2000)
      .optional(),
    severity: complaintSeveritySchema.optional(),
    duration: optionalString(100),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.symptoms && !data.severity && data.duration === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one field (symptoms, severity, or duration) must be provided for update",
      })
    }
  })

export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>
