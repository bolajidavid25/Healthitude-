import { z } from "zod"
import { emailSchema } from "./common"
import { VERIFICATION_ACTIONS } from "./professional"

/**
 * Dedicated Administrator Login Schema
 */
export const loginAdminSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .strict()

export type LoginAdminInput = z.infer<typeof loginAdminSchema>

/**
 * Administrator Professional Review Schema
 */
export const adminReviewProfessionalSchema = z
  .object({
    action: z.enum(VERIFICATION_ACTIONS, {
      required_error: "Verification action is required",
    }),
    reason: z.string().trim().max(500).optional(),
    restrictions: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
    revalidationDate: z
      .string()
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Invalid revalidation date format",
      })
      .transform((val) => new Date(val))
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (
        (data.action === "REJECT" || data.action === "SUSPEND" || data.action === "REVOKE") &&
        (!data.reason || data.reason.trim().length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: "A justification reason is required when rejecting, suspending, or revoking credentials",
      path: ["reason"],
    },
  )
  .refine(
    (data) => {
      if (
        data.action === "VERIFY_WITH_RESTRICTIONS" &&
        (!data.restrictions || data.restrictions.trim().length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: "Specific practice restrictions must be provided when approving with restrictions",
      path: ["restrictions"],
    },
  )

export type AdminReviewProfessionalInput = z.infer<typeof adminReviewProfessionalSchema>
