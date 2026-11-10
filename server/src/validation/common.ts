import { z } from "zod"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
} from "../generated/prisma/enums"
import {
  correlatePatientCategory,
  isValidPatientCategory,
} from "../utils/patientCategory"

/**
 * Normalizes email address by trimming leading/trailing whitespace and converting to lowercase.
 * Rule E: Normalize email addresses consistently before checking uniqueness.
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== "string") return ""
  return email.trim().toLowerCase()
}

/**
 * Normalizes phone numbers according to the Healthitude documented policy.
 * Rule F: Normalize phone numbers using a documented policy suitable for
 * the application's intended country (Ghana +233) and supported international number formats.
 * Do not silently change valid phone numbers into incorrect values.
 *
 * Policy:
 * 1. Ghana local format: 10 digits starting with '0' (e.g. 0241234567, 050 123 4567)
 *    -> Normalized to E.164: +233241234567
 * 2. Ghana format with country prefix without plus: 12 digits starting with '233' (e.g. 233241234567)
 *    -> Normalized to E.164: +233241234567
 * 3. International E.164 format: Starts with '+' followed by 7 to 15 digits (ITU-T E.164)
 *    -> Strips formatting characters (spaces, hyphens, dots, parentheses) and preserves the number.
 * 4. All other formats are rejected with a clear validation error.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (typeof rawPhone !== "string") {
    throw new Error("Phone number must be a string")
  }
  const trimmed = rawPhone.trim()
  const cleaned = trimmed.replace(/[\s\-().]/g, "")

  // 1. Ghana local 10-digit number (e.g., 0241234567, 0551234567, 0201234567)
  if (/^0[235][0-9]{8}$/.test(cleaned)) {
    return `+233${cleaned.slice(1)}`
  }

  // 2. Ghana 12-digit number with 233 without '+' (e.g., 233241234567)
  if (/^233[235][0-9]{8}$/.test(cleaned)) {
    return `+${cleaned}`
  }

  // 3. International standard E.164 (+ followed by 7-15 digits, non-zero country code)
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned
  }

  throw new Error(
    "Invalid phone number format. Provide a valid Ghana phone number (e.g. 0241234567) or international number in E.164 format (+233241234567)",
  )
}

/**
 * Validates date of birth as a real calendar date, rejecting impossible dates,
 * future dates, and implausible ages (> 130 years).
 * Rule G: Validate date-of-birth input as a real date, not merely a string that resembles a date.
 * Rule H: Reject future dates of birth and implausible values according to a documented business rule.
 */
export function validateDateOfBirth(
  dateStr: string,
): {
  valid: boolean
  error?: string
  date?: Date
} {
  if (typeof dateStr !== "string") {
    return { valid: false, error: "Date of birth must be a date string" }
  }
  const trimmed = dateStr.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) {
    return { valid: false, error: "Invalid date format. Expected YYYY-MM-DD" }
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      valid: false,
      error: "Date of birth contains an invalid month or day",
    }
  }

  // Real calendar date check via UTC to eliminate timezone rollover side-effects
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return { valid: false, error: "Date of birth is not a valid calendar date" }
  }

  const now = new Date()
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )

  if (parsedDate >= todayUTC) {
    return { valid: false, error: "Date of birth must be in the past" }
  }

  const minDateUTC = new Date(
    Date.UTC(now.getUTCFullYear() - 130, now.getUTCMonth(), now.getUTCDate()),
  )
  if (parsedDate < minDateUTC) {
    return {
      valid: false,
      error: "Date of birth exceeds maximum plausible age (130 years)",
    }
  }

  return { valid: true, date: parsedDate }
}

/**
 * List of server-controlled properties that must never be accepted from client payloads.
 * Rule J: Do not accept passwordHash, userId, role, verification status, or other server-controlled properties.
 */
export const SERVER_CONTROLLED_FIELDS = [
  "passwordHash",
  "userId",
  "role",
  "verificationStatus",
  "isVerified",
  "createdAt",
  "updatedAt",
  "id",
  "patientId",
  "status",
] as const

/**
 * Checks if an object contains any server-controlled properties.
 */
export function findServerControlledFields(
  data: Record<string, any>,
): string[] {
  if (!data || typeof data !== "object") return []
  const found: string[] = []
  for (const field of SERVER_CONTROLLED_FIELDS) {
    if (field in data) {
      found.push(field)
    }
  }
  return found
}

/**
 * Reusable primitive for required, trimmed strings.
 */
export function requiredString(fieldName: string, min = 1, max = 255) {
  return z
    .string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`,
    })
    .trim()
    .min(min, { message: `${fieldName} is required` })
    .max(max, { message: `${fieldName} cannot exceed ${max} characters` })
}

/**
 * Reusable primitive for optional strings that treats empty strings as undefined.
 */
export function optionalString(max = 1000) {
  return z
    .string({ invalid_type_error: "Must be a string" })
    .trim()
    .max(max, { message: `Cannot exceed ${max} characters` })
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? undefined : val))
}

/**
 * Reusable primitive for optional strings in PATCH updates that allows clearing/nulling.
 * - If omitted (undefined), remains undefined (so partial update preserves existing DB value).
 * - If empty string ("") or null, transforms to null (so caller can explicitly clear/delete the value in DB).
 */
export function optionalNullableString(max = 1000) {
  return z
    .string({ invalid_type_error: "Must be a string" })
    .trim()
    .max(max, { message: `Cannot exceed ${max} characters` })
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? null : val))
}

/**
 * Standard Email Schema: trimmed, normalized, RFC 5322 compliant syntax.
 * Rule E: Normalize email addresses consistently before checking uniqueness.
 */
export const emailSchema = z
  .string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  })
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Invalid email address format" })
  .max(255, { message: "Email cannot exceed 255 characters" })
  .transform((val) => normalizeEmail(val))

/**
 * International Phone Number Schema.
 * Rule F: Documented Ghana (+233) and E.164 normalization policy.
 */
export const phoneNumberSchema = z
  .string({
    required_error: "Phone number is required",
    invalid_type_error: "Phone number must be a string",
  })
  .trim()
  .min(1, { message: "Phone number is required" })
  .superRefine((val, ctx) => {
    try {
      normalizePhoneNumber(val)
    } catch (err: any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message || "Invalid phone number format",
      })
    }
  })
  .transform((val) => normalizePhoneNumber(val))

/**
 * Date of Birth Schema: valid real calendar date, past date, reasonable age.
 * Rule G & Rule H: Real calendar date verification.
 */
export const dateOfBirthSchema = z
  .string({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a date string",
  })
  .trim()
  .min(1, { message: "Date of birth is required" })
  .superRefine((val, ctx) => {
    const result = validateDateOfBirth(val)
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || "Invalid date of birth",
      })
    }
  })
  .transform((val) => {
    const result = validateDateOfBirth(val)
    return result.date!
  })

/**
 * Password schema: minimum 8 characters, maximum 128 characters.
 */
export const passwordSchema = z
  .string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  })
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password cannot exceed 128 characters" })

/**
 * Enums - Sex
 */
export const sexSchema = z.nativeEnum(Sex, {
  errorMap: () => ({
    message: `Invalid sex. Expected one of: ${Object.values(Sex).join(", ")}`,
  }),
})

/**
 * Canonical mapping for Relationship values.
 * Accepts exact Prisma enum strings and standard frontend/natural-language equivalents.
 */
export function correlateRelationship(val: string): Relationship {
  if (typeof val !== "string") {
    throw new Error("Relationship must be a string")
  }
  const clean = val
    .trim()
    .toUpperCase()
    .replace(/[\s\-/]+/g, "_")
  if (clean === "SPOUSE" || clean === "PARTNER" || clean === "SPOUSE_PARTNER") {
    return Relationship.SPOUSE_PARTNER
  }
  if (clean === "PARENT") return Relationship.PARENT
  if (clean === "SIBLING") return Relationship.SIBLING
  if (clean === "CHILD") return Relationship.CHILD
  if (clean === "FRIEND") return Relationship.FRIEND
  if (clean === "OTHER") return Relationship.OTHER
  if (Object.values(Relationship).includes(clean as any)) {
    return clean as Relationship
  }
  throw new Error(`Invalid relationship: ${val}`)
}

export function isValidRelationship(val: any): boolean {
  if (typeof val !== "string") return false
  try {
    correlateRelationship(val)
    return true
  } catch {
    return false
  }
}

/**
 * Enums - Relationship
 */
export const relationshipSchema = z
  .string({
    required_error: "Relationship is required",
    invalid_type_error: "Relationship must be a string",
  })
  .trim()
  .refine(isValidRelationship, {
    message: `Invalid relationship. Expected one of: ${Object.values(Relationship).join(", ")}`,
  })
  .transform((val) => correlateRelationship(val))

/**
 * Canonical mapping for Blood Group values.
 * Accepts exact Prisma enum strings (e.g. O_POSITIVE) and medical notation (e.g. O+, A-).
 */
export function correlateBloodGroup(val: string): BloodGroup {
  if (typeof val !== "string") {
    throw new Error("Blood group must be a string")
  }
  const clean = val.trim().toUpperCase().replace(/\s+/g, "")
  if (clean === "A+" || clean === "A_POSITIVE") return BloodGroup.A_POSITIVE
  if (clean === "A-" || clean === "A_NEGATIVE" || clean === "A−")
    return BloodGroup.A_NEGATIVE
  if (clean === "B+" || clean === "B_POSITIVE") return BloodGroup.B_POSITIVE
  if (clean === "B-" || clean === "B_NEGATIVE" || clean === "B−")
    return BloodGroup.B_NEGATIVE
  if (clean === "AB+" || clean === "AB_POSITIVE") return BloodGroup.AB_POSITIVE
  if (clean === "AB-" || clean === "AB_NEGATIVE" || clean === "AB−")
    return BloodGroup.AB_NEGATIVE
  if (clean === "O+" || clean === "O_POSITIVE") return BloodGroup.O_POSITIVE
  if (clean === "O-" || clean === "O_NEGATIVE" || clean === "O−")
    return BloodGroup.O_NEGATIVE
  if (Object.values(BloodGroup).includes(clean as any)) {
    return clean as BloodGroup
  }
  throw new Error(`Invalid blood group: ${val}`)
}

export function isValidBloodGroup(val: any): boolean {
  if (val === undefined || val === null || val === "" || val === "unknown")
    return true
  if (typeof val !== "string") return false
  try {
    correlateBloodGroup(val)
    return true
  } catch {
    return false
  }
}

/**
 * Enums - Blood Group (Optional)
 */
export const bloodGroupSchema = z
  .string({ invalid_type_error: "Blood group must be a string" })
  .trim()
  .optional()
  .nullable()
  .transform((val) =>
    val === "" || val === null || val === "unknown" ? undefined : val,
  )
  .refine(isValidBloodGroup, {
    message: `Invalid blood group. Expected one of: ${Object.values(BloodGroup).join(", ")}`,
  })
  .transform((val) => (val ? correlateBloodGroup(val) : undefined))

/**
 * Enums - Genotype (Optional)
 */
export const genotypeSchema = z
  .string({ invalid_type_error: "Genotype must be a string" })
  .trim()
  .optional()
  .nullable()
  .transform((val) =>
    !val || val === "unknown" ? undefined : val.toUpperCase(),
  )
  .refine(
    (val) => val === undefined || Object.values(Genotype).includes(val as any),
    {
      message: `Invalid genotype. Expected one of: ${Object.values(Genotype).join(", ")}`,
    },
  )
  .transform((val) => (val ? val as Genotype : undefined))

/**
 * Enums - Patient Category
 * Reuses correlatePatientCategory so both exact Prisma enum values
 * and frontend shorthand codes (e.g. NHIS, NURSING_MOTHER) are validated and correlated.
 */
export const patientCategorySchema = z
  .string({
    required_error: "Patient category is required",
    invalid_type_error: "Patient category must be a string",
  })
  .trim()
  .refine(isValidPatientCategory, {
    message: `Invalid patient category. Expected one of: ${Object.values(PatientCategory).join(", ")} or supported frontend codes`,
  })
  .transform((val) => correlatePatientCategory(val))

/**
 * Enums - Consent Type
 */
export const consentTypeSchema = z.nativeEnum(ConsentType, {
  errorMap: () => ({
    message: `Invalid consent type. Expected one of: ${Object.values(ConsentType).join(", ")}`,
  }),
})
