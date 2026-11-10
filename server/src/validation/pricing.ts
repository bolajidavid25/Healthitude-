import { z } from "zod"
import { optionalString } from "./common"

/**
 * Validation schema for patient category review or update request.
 * Strictly blocks verificationStatus, verifiedAt, or admin fields.
 */
export const requestCategoryChangeSchema = z
  .object({
    category: z
      .string({
        required_error: "Category is required",
        invalid_type_error: "Category must be a string",
      })
      .min(1, "Category must not be empty"),
    nhisId: optionalString(100),
    nhisSchemeType: optionalString(100),
    supportingDocument: optionalString(500),
  })
  .strict()

export type RequestCategoryChangeInput = z.infer<typeof requestCategoryChangeSchema>
