import { z } from "zod"
import { ClinicalRecordType } from "../generated/prisma/enums"

/**
 * Normalizes user-facing or shorthand record type strings to canonical ClinicalRecordType enum.
 */
export function normalizeRecordType(val: unknown): ClinicalRecordType {
  if (typeof val !== "string") {
    throw new Error("Record type must be a string")
  }
  const clean = val
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
  if (clean === "DIAGNOSIS") return ClinicalRecordType.DIAGNOSIS
  if (clean === "VITAL_SIGNS" || clean === "VITALS" || clean === "VITAL")
    return ClinicalRecordType.VITAL_SIGNS
  if (clean === "LAB_RESULT" || clean === "LAB" || clean === "LABS")
    return ClinicalRecordType.LAB_RESULT
  if (clean === "TREATMENT_NOTE" || clean === "TREATMENT" || clean === "NOTE")
    return ClinicalRecordType.TREATMENT_NOTE
  if (clean === "REFERRAL") return ClinicalRecordType.REFERRAL

  throw new Error(
    `Invalid clinical record type: "${val}". Expected one of: Diagnosis, Vital Signs, Lab Result, Treatment Note, Referral`,
  )
}

export const clinicalRecordTypeSchema = z
  .string({
    required_error: "Record type is required",
    invalid_type_error: "Record type must be a string",
  })
  .trim()
  .min(1, { message: "Record type is required" })
  .superRefine((val, ctx) => {
    try {
      normalizeRecordType(val)
    } catch (err: any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message,
      })
    }
  })
  .transform((val) => normalizeRecordType(val))

export const clinicalRecordQuerySchema = z
  .object({
    type: z.string().trim().optional(),
  })
  .transform((query) => ({
    type: query.type ? normalizeRecordType(query.type) : undefined,
  }))

export type ClinicalRecordQueryInput = z.infer<typeof clinicalRecordQuerySchema>

/**
 * Schema for creating a clinical record (authorized healthcare professional)
 */
export const createClinicalRecordSchema = z
  .object({
    patientId: z.string().uuid({ message: "Valid patient ID is required" }),
    type: clinicalRecordTypeSchema,
    content: z
      .string()
      .trim()
      .min(3, { message: "Record content must be at least 3 characters" })
      .max(10000),
    author: z
      .string()
      .trim()
      .min(2, { message: "Author name must be at least 2 characters" })
      .max(200),
    authorRole: z.string().trim().max(100).optional(),
    authorId: z.string().trim().max(100).optional(),
    attachmentName: z.string().trim().max(255).optional(),
    attachmentUrl: z.string().trim().max(500).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict()

export type CreateClinicalRecordInput = z.infer<typeof createClinicalRecordSchema>
