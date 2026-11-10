import { z } from "zod"
import {
  requiredString,
  optionalString,
  optionalNullableString,
  phoneNumberSchema,
  relationshipSchema,
  bloodGroupSchema,
  genotypeSchema,
  patientCategorySchema,
  consentTypeSchema,
} from "./common"

/**
 * Permitted update schema for Patient Identity fields.
 * Rule F & G: Strictly blocks email, role, id, passwordHash, and verification fields.
 */
export const updateIdentitySchema = z
  .object({
    firstName: requiredString("First name", 1, 100).optional(),
    middleName: optionalNullableString(100),
    lastName: requiredString("Last name", 1, 100).optional(),
    phoneNumber: phoneNumberSchema.optional(),
    profilePhoto: optionalNullableString(500),
  })
  .strict()

export type UpdateIdentityInput = z.infer<typeof updateIdentitySchema>

/**
 * Permitted update schema for Patient Address.
 */
export const updateAddressSchema = z
  .object({
    street: requiredString("Street address", 1, 255).optional(),
    city: requiredString("City or town", 1, 100).optional(),
    state: requiredString("State or region", 1, 100).optional(),
    district: optionalNullableString(100),
  })
  .strict()

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>

/**
 * Permitted update schema for Emergency Contact.
 */
export const updateEmergencyContactSchema = z
  .object({
    fullName: requiredString("Emergency contact name", 1, 150).optional(),
    relationship: relationshipSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
  })
  .strict()

export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>

/**
 * Permitted update schema for Patient Health Profile.
 * Rule G & H: Strictly blocks clinicallyVerified, verifiedAt, and patientReported from client input.
 */
export const updateHealthProfileSchema = z
  .object({
    bloodGroup: bloodGroupSchema,
    genotype: genotypeSchema,
    knownAllergies: optionalNullableString(1000),
    medicalConditions: optionalNullableString(1000),
    currentMedications: optionalNullableString(1000),
    previousSurgeries: optionalNullableString(1000),
    medicalHistory: optionalNullableString(2000),
  })
  .strict()

export type UpdateHealthProfileInput = z.infer<typeof updateHealthProfileSchema>

/**
 * Permitted update schema for Patient Category Review Request.
 * Rule G & J: Strictly blocks verificationStatus; patient cannot self-verify.
 */
export const updatePatientCategorySchema = z
  .object({
    category: patientCategorySchema.optional(),
    nhisId: optionalNullableString(100),
    nhisSchemeType: optionalNullableString(100),
    supportingDocument: optionalNullableString(500),
  })
  .strict()

export type UpdatePatientCategoryInput = z.infer<typeof updatePatientCategorySchema>

/**
 * Composite Patient Profile Update Schema.
 * Accepts partial updates to any of the 5 allowed sections.
 */
export const updatePatientProfileSchema = z
  .object({
    identity: updateIdentitySchema.optional(),
    address: updateAddressSchema.optional(),
    emergencyContact: updateEmergencyContactSchema.optional(),
    healthProfile: updateHealthProfileSchema.optional(),
    patientCategory: updatePatientCategorySchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      Boolean(
        data.identity ||
          data.address ||
          data.emergencyContact ||
          data.healthProfile ||
          data.patientCategory,
      ),
    { message: "At least one section must be provided for update" },
  )

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>

/**
 * Record New Consent Version Schema.
 * Rule K & M: Record consent acceptance as a distinct event with agreement version and timestamp.
 */
export const recordConsentSchema = z
  .object({
    consentType: consentTypeSchema,
    accepted: z.boolean({
      required_error: "Consent acceptance state is required",
      invalid_type_error: "Consent acceptance state must be a boolean",
    }),
    version: requiredString("Agreement version", 1, 20),
  })
  .strict()

export type RecordConsentInput = z.infer<typeof recordConsentSchema>
