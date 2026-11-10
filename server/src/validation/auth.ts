import { z } from "zod"
import { emailSchema, passwordSchema } from "./common"

/**
 * Patient Login Request Schema
 * Rule B: Explicit registration and login request types with runtime validation.
 * Rule F & J: Strict rejection of unrecognized or server-controlled fields.
 */
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
      })
      .min(1, { message: "Password is required" })
      .max(128, { message: "Password cannot exceed 128 characters" }),
  })
  .strict()

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Patient Change Password Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: "Current password is required",
        invalid_type_error: "Current password must be a string",
      })
      .min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({
      required_error: "Confirm new password is required",
      invalid_type_error: "Confirm new password must be a string",
    }),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
