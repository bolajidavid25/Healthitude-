import { z } from "zod"
import { ProfessionalCategory } from "../generated/prisma/enums"
import {
  emailSchema,
  passwordSchema,
  normalizeEmail,
  normalizePhoneNumber,
} from "./common"

/**
 * Validates licence expiry date as a future calendar date.
 */
function validateLicenceExpiry(val: string): { valid: boolean; error?: string; date?: Date } {
  if (typeof val !== "string") {
    return { valid: false, error: "Licence expiry must be a date string" }
  }
  const parsed = new Date(val)
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: "Invalid licence expiry date format" }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsed <= today) {
    return { valid: false, error: "Licence must not be expired" }
  }
  return { valid: true, date: parsed }
}

/**
 * Professional Registration Schema
 * Rule 3: Validates required registration information, prevents unauthorized privileges,
 * and initializes default PENDING verification status.
 */
export const registerProfessionalSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required" })
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),
    middleName: z.string().trim().max(50).optional(),
    lastName: z
      .string({ required_error: "Last name is required" })
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters"),
    email: emailSchema,
    phoneNumber: z
      .string({ required_error: "Phone number is required" })
      .trim()
      .refine(
        (val) => {
          try {
            normalizePhoneNumber(val)
            return true
          } catch {
            return false
          }
        },
        { message: "Invalid phone number format" },
      )
      .transform((val) => normalizePhoneNumber(val)),
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Confirm password is required" }),
    category: z
      .enum(["DOCTOR", "doctor"] as const, {
        errorMap: () => ({
          message:
            "Only doctors are supported for clinical registration in this phase. Administrative access cannot be assigned via public registration.",
        }),
      })
      .optional()
      .default("DOCTOR")
      .transform(() => ProfessionalCategory.DOCTOR),
    profession: z.string().trim().min(2).max(100).optional().default("Medical Doctor"),
    specialty: z
      .string({ required_error: "Specialty is required" })
      .trim()
      .min(2, "Specialty must be at least 2 characters")
      .max(100, "Specialty cannot exceed 100 characters"),
    specialistQualification: z.string().trim().max(150).optional(),
    qualification: z.string().trim().max(150).optional(),
    institution: z.string().trim().max(150).optional(),
    graduationYear: z.number().int().min(1950).max(2035).optional(),
    licenceNumber: z
      .string({ required_error: "Licence number is required" })
      .trim()
      .min(3, "Licence number must be at least 3 characters")
      .max(50, "Licence number cannot exceed 50 characters"),
    licenceExpiry: z
      .string({ required_error: "Licence expiry date is required" })
      .trim()
      .refine((val) => validateLicenceExpiry(val).valid, {
        message: "Licence expiry must be a valid future calendar date",
      })
      .transform((val) => new Date(val)),
    regulatoryBody: z
      .string({ required_error: "Regulatory body is required" })
      .trim()
      .min(2, "Regulatory body must be at least 2 characters")
      .max(100, "Regulatory body cannot exceed 100 characters"),
    facility: z
      .string({ required_error: "Current facility is required" })
      .trim()
      .min(2, "Facility must be at least 2 characters")
      .max(100, "Facility cannot exceed 100 characters"),
    termsAccepted: z.boolean().optional().default(true),
    // Explicitly reject client-injected privilege escalation fields
    role: z.any().optional(),
    isAdmin: z.any().optional(),
    verificationStatus: z.any().optional(),
    accountStatus: z.any().optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Disallow any attempt to set role="ADMIN" or isAdmin=true or verificationStatus
      if (data.role && String(data.role).toUpperCase() === "ADMIN") return false
      if (data.isAdmin === true) return false
      if (data.verificationStatus && data.verificationStatus !== "PENDING") return false
      return true
    },
    {
      message: "Unauthorized attempt to assign administrator or pre-verified privileges",
      path: ["role"],
    },
  )

export type RegisterProfessionalInput = z.infer<typeof registerProfessionalSchema>

/**
 * Professional Login Schema
 */
export const loginProfessionalSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .strict()

export type LoginProfessionalInput = z.infer<typeof loginProfessionalSchema>

/**
 * Professional Profile Update Schema (Restricted permitted fields)
 */
export const updateProfessionalProfileSchema = z
  .object({
    middleName: z.string().trim().max(50).optional(),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (val) => {
          try {
            normalizePhoneNumber(val)
            return true
          } catch {
            return false
          }
        },
        { message: "Invalid phone number format" },
      )
      .transform((val) => normalizePhoneNumber(val))
      .optional(),
    profession: z.string().trim().min(2).max(100).optional(),
    specialty: z.string().trim().min(2).max(100).optional(),
    specialistQualification: z.string().trim().max(150).optional(),
    qualification: z.string().trim().max(150).optional(),
    institution: z.string().trim().max(150).optional(),
    graduationYear: z.number().int().min(1950).max(2035).optional(),
    facility: z.string().trim().min(2).max(100).optional(),
    profilePhoto: z.string().nullable().optional(),
    revalidationDate: z
      .string()
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Invalid revalidation date",
      })
      .transform((val) => new Date(val))
      .optional(),
  })
  .strict()

export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>

/**
 * Verification Action Type
 */
export const VERIFICATION_ACTIONS = [
  "START_REVIEW",
  "UNDER_REVIEW",
  "VERIFY",
  "VERIFY_WITH_RESTRICTIONS",
  "REJECT",
  "SUSPEND",
  "EXPIRE",
  "REVOKE",
  "REINSTATE",
] as const

export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number]

/**
 * Administrator Verification Review Schema
 * Validates action and required reasoning/restrictions per clinical governance rules.
 */
export const reviewVerificationSchema = z
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
      // Rejection, Suspension, and Revocation require documented justification
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
      // Verification with restrictions requires specific restrictions documented
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

export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>

/**
 * Credential Evidence Document Attachment Schema
 * Rule 8: Documents are referenced internally and never exposed through public URLs.
 */
export const createCredentialDocumentSchema = z
  .object({
    documentType: z.enum(
      [
        "MEDICAL_LICENCE",
        "DEGREE_CERTIFICATE",
        "SPECIALTY_CERTIFICATE",
        "GOVERNMENT_ID",
        "GOOD_STANDING_CERTIFICATE",
        "OTHER",
      ] as const,
      { required_error: "Document type is required" },
    ),
    title: z
      .string({ required_error: "Document title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title cannot exceed 120 characters"),
    documentRef: z
      .string({ required_error: "Document storage reference is required" })
      .trim()
      .min(5, "Invalid document reference"),
    fileName: z
      .string({ required_error: "File name is required" })
      .trim()
      .min(3, "File name must be at least 3 characters"),
    fileSize: z
      .number({ required_error: "File size is required" })
      .int()
      .positive("File size must be positive")
      .max(10 * 1024 * 1024, "Document size cannot exceed 10 MB"),
    mimeType: z
      .string({ required_error: "MIME type is required" })
      .trim()
      .refine(
        (val) =>
          [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(val),
        {
          message:
            "Invalid file type. Only PDF, JPEG, PNG, or WEBP credential files are accepted.",
        },
      ),
  })
  .strict()

export type CreateCredentialDocumentInput = z.infer<
  typeof createCredentialDocumentSchema
>
