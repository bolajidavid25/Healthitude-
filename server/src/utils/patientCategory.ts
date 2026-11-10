import { PatientCategory } from "../generated/prisma/enums"

/**
 * Frontend shorthand codes sent from PatientAuthPage.tsx
 */
export type FrontendPatientCategory = "NURSING_MOTHER" | "ELDERLY" | "STUDENT" | "CIVIL_SERVANT" | "CORPORATE" | "NHIS" | "INSURANCE" | "GENERAL"

/**
 * Metadata definition correlating frontend codes with Prisma schema enums.
 */
export interface PatientCategoryCorrelation {
  frontendValue: FrontendPatientCategory
  prismaEnum: PatientCategory
  label: string
  requiresEvidence: boolean
  conditionalFields?: string[]
}

/**
 * Canonical correlation table between frontend PatientAuthPage values
 * and Prisma PatientCategory schema enum values.
 */
export const PATIENT_CATEGORY_CORRELATIONS: readonly PatientCategoryCorrelation[] =
  [
    {
      frontendValue: "NURSING_MOTHER",
      prismaEnum: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
      label: "Nursing / Breastfeeding Mother",
      requiresEvidence: true,
      conditionalFields: ["deliveryDate"],
    },
    {
      frontendValue: "ELDERLY",
      prismaEnum: PatientCategory.ELDERLY,
      label: "Elderly",
      requiresEvidence: false,
      conditionalFields: ["dateOfBirth"],
    },
    {
      frontendValue: "STUDENT",
      prismaEnum: PatientCategory.STUDENT,
      label: "Student",
      requiresEvidence: true,
      conditionalFields: [
        "institution",
        "studentId",
        "programme",
        "graduationYear",
      ],
    },
    {
      frontendValue: "CIVIL_SERVANT",
      prismaEnum: PatientCategory.CIVIL_SERVANT,
      label: "Civil Servant",
      requiresEvidence: true,
      conditionalFields: ["ministry", "staffId"],
    },
    {
      frontendValue: "CORPORATE",
      prismaEnum: PatientCategory.CORPORATE_COMPANY_MEMBER,
      label: "Corporate / Company Member",
      requiresEvidence: true,
      conditionalFields: ["company", "employeeId"],
    },
    {
      frontendValue: "NHIS",
      prismaEnum: PatientCategory.NHIS_USER,
      label: "NHIS User",
      requiresEvidence: true,
      conditionalFields: ["nhisId", "nhisSchemeType"],
    },
    {
      frontendValue: "INSURANCE",
      prismaEnum: PatientCategory.INSURANCE_MEMBER,
      label: "Insurance Member",
      requiresEvidence: true,
      conditionalFields: ["insuranceCompany", "policyNumber", "coverageType"],
    },
    {
      frontendValue: "GENERAL",
      prismaEnum: PatientCategory.GENERAL_PATIENT,
      label: "General Patient",
      requiresEvidence: false,
    },
  ] as const

/**
 * Index lookups for O(1) resolution
 */
const FRONTEND_TO_PRISMA_MAP = new Map<string, PatientCategory>()
const PRISMA_TO_FRONTEND_MAP =
  new Map<PatientCategory, FrontendPatientCategory>()
const LABEL_TO_PRISMA_MAP = new Map<string, PatientCategory>()

for (const correlation of PATIENT_CATEGORY_CORRELATIONS) {
  FRONTEND_TO_PRISMA_MAP.set(
    correlation.frontendValue.toUpperCase(),
    correlation.prismaEnum,
  )
  PRISMA_TO_FRONTEND_MAP.set(correlation.prismaEnum, correlation.frontendValue)
  LABEL_TO_PRISMA_MAP.set(
    correlation.label.toLowerCase(),
    correlation.prismaEnum,
  )
}

// All valid Prisma enum values
const VALID_PRISMA_ENUM_SET = new Set<string>(Object.values(PatientCategory))

/**
 * Correlates and normalizes any category representation (frontend shorthand,
 * exact Prisma enum, label, or token keywords) to the canonical Prisma PatientCategory enum.
 *
 * @param input Raw string from request body or UI
 * @returns Canonical Prisma PatientCategory enum value
 * @throws Error if the category value cannot be correlated
 */
export function correlatePatientCategory(input: unknown): PatientCategory {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error(
      "Patient category is required and must be a non-empty string.",
    )
  }

  const normalized = input.trim()
  const upper = normalized.toUpperCase().replace(/\s+/g, "_")

  // 1. Direct match with Prisma enum
  if (VALID_PRISMA_ENUM_SET.has(upper)) {
    return upper as PatientCategory
  }

  // 2. Direct match with frontend shorthand code
  const fromFrontend = FRONTEND_TO_PRISMA_MAP.get(upper)
  if (fromFrontend) {
    return fromFrontend
  }

  // 3. Match by human-readable label
  const fromLabel = LABEL_TO_PRISMA_MAP.get(normalized.toLowerCase())
  if (fromLabel) {
    return fromLabel
  }

  // 4. Token-based semantic correlation
  // Handles partial tokens: "NURSING", "BREASTFEEDING", "CORPORATE", "NHIS", "INSURANCE", "GENERAL"
  for (const correlation of PATIENT_CATEGORY_CORRELATIONS) {
    const enumTokens = correlation.prismaEnum.split("_")
    const frontTokens = correlation.frontendValue.split("_")
    const allTokens = Array.from(new Set([...enumTokens, ...frontTokens]))

    if (allTokens.some((token) => upper.includes(token))) {
      return correlation.prismaEnum
    }
  }

  const validOptions = PATIENT_CATEGORY_CORRELATIONS.map(
    (c) => `${c.frontendValue} -> ${c.prismaEnum}`,
  ).join(", ")

  throw new Error(
    `Invalid patient category: "${input}". Must correlate to one of: ${validOptions}`,
  )
}

/**
 * Returns true if the input can be successfully correlated to a valid PatientCategory.
 */
export function isValidPatientCategory(input: unknown): boolean {
  try {
    correlatePatientCategory(input)
    return true
  } catch {
    return false
  }
}

/**
 * Reverse-lookup: maps a Prisma PatientCategory enum back to frontend shorthand code.
 */
export function toFrontendPatientCategory(
  prismaCategory: PatientCategory,
): FrontendPatientCategory {
  const front = PRISMA_TO_FRONTEND_MAP.get(prismaCategory)
  if (!front) {
    throw new Error(`Unknown Prisma patient category: ${prismaCategory}`)
  }
  return front
}

/**
 * Retrieves the full metadata record for a given category.
 */
export function getPatientCategoryMetadata(
  category: unknown,
): PatientCategoryCorrelation {
  const prismaCategory = correlatePatientCategory(category)
  const meta = PATIENT_CATEGORY_CORRELATIONS.find(
    (c) => c.prismaEnum === prismaCategory,
  )
  if (!meta) {
    throw new Error(`Metadata not found for category: ${prismaCategory}`)
  }
  return meta
}
