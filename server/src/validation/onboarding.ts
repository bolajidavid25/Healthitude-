import { z } from "zod"
import {
  requiredString,
  optionalString,
  emailSchema,
  phoneNumberSchema,
  dateOfBirthSchema,
  passwordSchema,
  sexSchema,
  relationshipSchema,
  bloodGroupSchema,
  genotypeSchema,
  patientCategorySchema,
  consentTypeSchema,
} from "./common"
import { PatientCategory, ConsentType } from "../generated/prisma/enums"

/**
 * The seven legally required agreements for Healthitude patient onboarding.
 * Rule M & Q: Explicit acceptance of all mandatory agreements is required prior to account creation.
 */
export const MANDATORY_CONSENT_TYPES: ConsentType[] = [
  ConsentType.TERMS_AND_PRIVACY,
  ConsentType.HEALTH_DATA_PROCESSING,
  ConsentType.PROFESSIONAL_ACCESS,
  ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
  ConsentType.AI_LIMITATIONS,
  ConsentType.BREAK_GLASS_DISCLOSURE,
  ConsentType.INFORMATION_ACCURACY,
]

/**
 * STAGE 1: Account & Identity Schema
 * Strictly rejects unexpected properties (Rule F, Rule J).
 */
export const stage1AccountSchema = z
  .object({
    firstName: requiredString("First name", 1, 100),
    middleName: optionalString(100),
    lastName: requiredString("Last name", 1, 100),
    dateOfBirth: dateOfBirthSchema,
    sex: sexSchema,
    email: emailSchema,
    phoneNumber: phoneNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
    profilePhoto: optionalString(500),
  })
  .strict()
  .refine(
    (data) => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

export type Stage1AccountInput = z.infer<typeof stage1AccountSchema>

/**
 * Emergency Contact Schema
 */
export const emergencyContactSchema = z
  .object({
    fullName: requiredString("Emergency contact name", 1, 150),
    relationship: relationshipSchema,
    phoneNumber: phoneNumberSchema,
  })
  .strict()

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>

/**
 * STAGE 2: Personal & Emergency Contact Schema
 * Strictly rejects unexpected properties.
 */
export const stage2ContactSchema = z
  .object({
    street: requiredString("Street address", 1, 255),
    city: requiredString("City or town", 1, 100),
    state: requiredString("State or region", 1, 100),
    district: optionalString(100),
    emergencyContact: emergencyContactSchema,
  })
  .strict()

export type Stage2ContactInput = z.infer<typeof stage2ContactSchema>

/**
 * STAGE 3: Health Profile Schema
 * Patient health information is marked unverified by default (Rule K).
 * Strictly rejects unexpected properties.
 */
export const stage3HealthProfileSchema = z
  .object({
    bloodGroup: bloodGroupSchema,
    genotype: genotypeSchema,
    knownAllergies: optionalString(1000),
    medicalConditions: optionalString(1000),
    currentMedications: optionalString(1000),
    previousSurgeries: optionalString(1000),
    medicalHistory: optionalString(2000),
  })
  .strict()

export type Stage3HealthProfileInput = z.infer<typeof stage3HealthProfileSchema>

/**
 * STAGE 4: Patient Category Schema
 * Enforces exactly one active category, with conditional NHIS fields.
 * Strictly rejects unexpected properties.
 */
export const stage4CategorySchema = z
  .object({
    category: patientCategorySchema,
    nhisId: optionalString(100),
    nhisSchemeType: optionalString(100),
    supportingDocument: optionalString(500),
  })
  .strict()
  .refine(
    (data) => {
      // If NHIS_USER, nhisId should be provided
      if (data.category === PatientCategory.NHIS_USER && !data.nhisId) {
        return false
      }
      return true
    },
    {
      message: "NHIS identification number is required for NHIS User category",
      path: ["nhisId"],
    },
  )

export type Stage4CategoryInput = z.infer<typeof stage4CategorySchema>

/**
 * Single Consent Record Schema
 */
export const singleConsentSchema = z
  .object({
    consentType: consentTypeSchema,
    accepted: z.boolean({
      required_error: "Consent acceptance state is required",
      invalid_type_error: "Consent acceptance state must be a boolean",
    }),
    version: requiredString("Agreement version", 1, 20),
  })
  .strict()

export type SingleConsentInput = z.infer<typeof singleConsentSchema>

/**
 * STAGE 5: Consent & Agreements Schema
 * Accepts either { consents: [...] } or an array of single consents.
 * Enforces unique (type, version) pairs in the submission.
 */
export const stage5ConsentSchema = z
  .object({
    consents: z
      .array(singleConsentSchema, {
        required_error: "Consents array is required",
        invalid_type_error: "Consents must be an array",
      })
      .min(1, { message: "At least one consent record must be provided" })
      .refine(
        (items) => {
          const seen = new Set<string>()
          for (const item of items) {
            const key = `${item.consentType}_${item.version}`
            if (seen.has(key)) return false
            seen.add(key)
          }
          return true
        },
        {
          message:
            "Duplicate consent records found for the same type and version",
        },
      ),
  })
  .strict()

export type Stage5ConsentInput = z.infer<typeof stage5ConsentSchema>

/**
 * Flexible Consent Input union to allow both:
 * { consents: [ ... ] } and { consents: { consents: [ ... ] } }
 */
export const consentsFlexibleSchema = z.union([
  stage5ConsentSchema,
  z.array(singleConsentSchema).transform((arr) => ({ consents: arr })),
])

/**
 * Complete Patient Registration Request Schema.
 * Enforces all 5 stages in strict mode, validates real calendar date of birth,
 * normalized phone and email, and guarantees that all 7 mandatory agreements
 * are provided and explicitly accepted.
 */
export const patientRegistrationSchema = z
  .object({
    account: stage1AccountSchema,
    contact: stage2ContactSchema,
    healthProfile: stage3HealthProfileSchema.optional().nullable(),
    patientCategory: stage4CategorySchema,
    consents: consentsFlexibleSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const consentList = data.consents.consents
    const consentMap = new Map<ConsentType, boolean>()

    for (const item of consentList) {
      consentMap.set(item.consentType, item.accepted)
    }

    for (const mandatoryType of MANDATORY_CONSENT_TYPES) {
      if (!consentMap.has(mandatoryType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["consents", mandatoryType],
          message: `Missing mandatory consent agreement: ${mandatoryType}`,
        })
      } else if (consentMap.get(mandatoryType) !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["consents", mandatoryType],
          message: `Mandatory agreement ${mandatoryType} must be explicitly accepted`,
        })
      }
    }
  })

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>

/**
 * Backward compatibility alias for existing test suites
 */
export const fullPatientOnboardingSchema = patientRegistrationSchema
export type FullPatientOnboardingInput = PatientRegistrationInput
