/**
 * Healthitude Error Explanation Engine
 * Translates backend validation errors, HTTP error envelopes, and exceptions
 * into clear, actionable, one-line details so the user understands exactly what
 * failed rather than just seeing a generic "Validation failed" message.
 */

import { ApiError, FieldError } from "@/utils/api"

/**
 * Maps technical backend schema paths to friendly human labels.
 */
export const FIELD_LABELS: Record<string, string> = {
  // Patient Account & Identity
  "account.firstName": "First name",
  "account.lastName": "Last name",
  "account.email": "Email address",
  "account.phoneNumber": "Phone number",
  "account.dateOfBirth": "Date of birth",
  "account.sex": "Biological sex",
  "account.password": "Password",
  "account.confirmPassword": "Confirm password",
  "account.profilePhoto": "Profile photo",

  // Patient Contact & Emergency
  "contact.street": "Street address",
  "contact.city": "City",
  "contact.state": "Region / State",
  "contact.district": "District",
  "contact.emergencyName": "Emergency contact name",
  "contact.emergencyRelationship": "Emergency contact relationship",
  "contact.emergencyPhone": "Emergency contact phone",

  // Patient Clinical / Health Profile
  "healthProfile.bloodGroup": "Blood group",
  "healthProfile.genotype": "Genotype",
  "healthProfile.allergies": "Known allergies",
  "healthProfile.chronicConditions": "Chronic conditions",

  // Patient Category
  category: "Patient category",
  patientCategory: "Patient category",
  evidenceDocument: "Category verification document",

  // Professional Identity & Credentials
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phoneNumber: "Phone number",
  password: "Password",
  confirmPassword: "Confirm password",
  licenceNumber: "Licence / Registration number",
  licenceExpiry: "Licence expiry date",
  regulatoryBody: "Regulatory body",
  facility: "Current facility / Affiliation",
  specialty: "Medical specialty",
  role: "Account role",

  // Consents
  consents: "Consent agreements",
  termsAccepted: "Terms and privacy agreement",
}

/**
 * Maps common system error codes to user-friendly one-line explanations.
 */
export const ERROR_CODE_EXPLANATIONS: Record<string, string> = {
  INVALID_CREDENTIALS:
    "The email address or password entered does not match our records. Please check your credentials.",
  RATE_LIMIT_EXCEEDED:
    "Too many failed login attempts. For security, please wait 15 minutes before trying again.",
  ACCOUNT_LOCKED:
    "This account is temporarily locked for security. Please reset your password or contact support.",
  ACCOUNT_SUSPENDED:
    "Your account is currently suspended. Please contact Healthitude administrator support.",
  EMAIL_ALREADY_EXISTS:
    "An account with this email address already exists. Please sign in or use a different email.",
  CONFLICT:
    "A record with these details already exists. Please check your email or licence number.",
  UNAUTHORIZED:
    "Your session has expired or is invalid. Please sign in again.",
  AUTHENTICATION_REQUIRED:
    "Please sign in to access this platform feature.",
  FORBIDDEN:
    "Access denied. You do not have permission to perform this clinical operation.",
  UNVERIFIED_PROFESSIONAL:
    "Clinical operations require administrator verification. Your professional account is currently pending review.",
  CSRF_ERROR:
    "Your security session expired. Please refresh the page and try again.",
  VALIDATION_ERROR:
    "Some required information is missing or formatted incorrectly. Please review the highlighted fields.",
  FILE_TOO_LARGE:
    "The uploaded file exceeds the 5 MB limit. Please select a smaller document.",
  INVALID_FILE_TYPE:
    "Unsupported file type. Please upload a PDF, PNG, or JPEG file.",
  NETWORK_ERROR:
    "Unable to connect to Healthitude services. Please check your internet connection.",
}

/**
 * Normalizes a field key to its friendly display label.
 */
export function getFriendlyFieldLabel(fieldKey: string): string {
  if (!fieldKey) return "Field"
  if (FIELD_LABELS[fieldKey]) return FIELD_LABELS[fieldKey]

  // Fallback: strip namespace prefix and humanize camelCase
  const baseKey = fieldKey.includes(".") ? fieldKey.split(".").pop()! : fieldKey
  return (
    FIELD_LABELS[baseKey] ||
    baseKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  )
}

/**
 * Enhances raw validation issue messages with clear, helpful context.
 */
function enhanceValidationMessage(fieldKey: string, rawMessage: string): string {
  const label = getFriendlyFieldLabel(fieldKey)
  const lowerMsg = (rawMessage || "").toLowerCase()

  if (lowerMsg.includes("required") || lowerMsg.includes("cannot be empty")) {
    return `${label} is required`
  }
  if (lowerMsg.includes("email") || lowerMsg.includes("invalid email")) {
    return `${label}: Please enter a valid email address (e.g. name@example.com)`
  }
  if (lowerMsg.includes("phone")) {
    return `${label}: Please enter a valid phone number (e.g. +233 24 123 4567)`
  }
  if (lowerMsg.includes("at least 8") || lowerMsg.includes("password")) {
    if (lowerMsg.includes("match")) {
      return "Passwords do not match. Please verify both password entries"
    }
    return `${label}: Must be at least 8 characters with letters, numbers, and symbols`
  }
  if (lowerMsg.includes("expiry") || lowerMsg.includes("future")) {
    return `${label}: Licence expiry must be a valid future calendar date`
  }
  if (lowerMsg.includes("date of birth") || lowerMsg.includes("age")) {
    return `${label}: Please enter a valid date of birth`
  }

  // If the raw message already specifies the field, return it cleanly
  if (rawMessage.toLowerCase().startsWith(label.toLowerCase())) {
    return rawMessage
  }

  return `${label}: ${rawMessage}`
}

/**
 * Formats multiple validation failures into a single clean one-line detail.
 */
export function explainValidationIssues(
  errors: Array<{ field?: string; message?: string }>,
): string {
  if (!errors || errors.length === 0) {
    return "Some required information is missing or formatted incorrectly. Please review the highlighted fields."
  }

  // If single error, give clear direct sentence
  if (errors.length === 1) {
    const err = errors[0]
    return enhanceValidationMessage(err.field || "", err.message || "Invalid value")
  }

  // If 2 or 3 errors, summarize with clear field bulleted/separated details
  const details = errors.slice(0, 3).map((e) => {
    const label = getFriendlyFieldLabel(e.field || "")
    const cleanMsg = (e.message || "Invalid").replace(/^String must /i, "").trim()
    return `${label} (${cleanMsg})`
  })

  const remaining = errors.length - 3
  const suffix = remaining > 0 ? ` +${remaining} more issue${remaining > 1 ? "s" : ""}` : ""

  return `Please correct the following: ${details.join("; ")}${suffix}.`
}

/**
 * Explains any error into clear, informative one-line details.
 * Prevents generic "Validation failed" from ever being displayed to the user.
 *
 * @param error Any error thrown (ApiError, Error, string, or response object)
 * @param fallback Optional fallback message if explanation cannot be determined
 * @returns Clear, concise one-line detail string
 */
export function explainError(error: unknown, fallback = "An unexpected error occurred. Please try again."): string {
  if (!error) return fallback

  // String error
  if (typeof error === "string") {
    if (error.trim().toLowerCase() === "validation failed") {
      return "Some required information is missing or formatted incorrectly. Please review the highlighted fields."
    }
    return error
  }

  // ApiError instance
  if (error instanceof ApiError) {
    // 1. If detailed field errors exist, explain each one clearly
    if (error.errors && error.errors.length > 0) {
      return explainValidationIssues(error.errors)
    }

    // 2. If message is generic "Validation failed", give user-actionable text
    if (
      !error.message ||
      error.message.trim().toLowerCase() === "validation failed"
    ) {
      if (error.code && ERROR_CODE_EXPLANATIONS[error.code]) {
        return ERROR_CODE_EXPLANATIONS[error.code]
      }
      return "Some required information is missing or formatted incorrectly. Please review the highlighted fields."
    }

    // 3. Known error code
    if (error.code && ERROR_CODE_EXPLANATIONS[error.code] && error.message.toLowerCase().includes("failed")) {
      return ERROR_CODE_EXPLANATIONS[error.code]
    }

    return error.message
  }

  // Standard Error instance or API object envelope
  const errObj = error as Record<string, any>

  if (Array.isArray(errObj.errors) && errObj.errors.length > 0) {
    return explainValidationIssues(errObj.errors)
  }

  const rawMessage: string =
    errObj.message ||
    errObj.error ||
    errObj.data?.message ||
    ""

  if (
    !rawMessage ||
    rawMessage.trim().toLowerCase() === "validation failed"
  ) {
    const code = errObj.code || errObj.status
    if (code && ERROR_CODE_EXPLANATIONS[code]) {
      return ERROR_CODE_EXPLANATIONS[code]
    }
    return "Some required information is missing or formatted incorrectly. Please review the highlighted fields."
  }

  return rawMessage
}

/**
 * Extracts a Record<field, message> map from any error for inline input highlighting.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const map: Record<string, string> = {}
  if (!error) return map

  let errorsList: FieldError[] = []

  if (error instanceof ApiError && error.errors) {
    errorsList = error.errors
  } else if (typeof error === "object" && error !== null && Array.isArray((error as any).errors)) {
    errorsList = (error as any).errors
  }

  for (const err of errorsList) {
    if (err.field) {
      // Store under full field path and base key for flexible lookups
      map[err.field] = err.message
      if (err.field.includes(".")) {
        const base = err.field.split(".").pop()!
        if (!map[base]) map[base] = err.message
      }
    }
  }

  return map
}
