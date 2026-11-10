/**
 * Canonical Patient Category Enums matching the Prisma schema.
 */
export const PrismaPatientCategory = {
  NURSING_BREASTFEEDING_MOTHER: "NURSING_BREASTFEEDING_MOTHER",
  ELDERLY: "ELDERLY",
  STUDENT: "STUDENT",
  CIVIL_SERVANT: "CIVIL_SERVANT",
  CORPORATE_COMPANY_MEMBER: "CORPORATE_COMPANY_MEMBER",
  NHIS_USER: "NHIS_USER",
  INSURANCE_MEMBER: "INSURANCE_MEMBER",
  GENERAL_PATIENT: "GENERAL_PATIENT",
} as const

export type PrismaPatientCategoryType = typeof PrismaPatientCategory[keyof typeof PrismaPatientCategory]

/**
 * Legacy frontend codes originally used in PatientAuthPage.
 */
export type LegacyPatientCategory = "NURSING_MOTHER" | "ELDERLY" | "STUDENT" | "CIVIL_SERVANT" | "CORPORATE" | "NHIS" | "INSURANCE" | "GENERAL"

export interface CategoryOption {
  value: PrismaPatientCategoryType
  legacyCode: LegacyPatientCategory
  label: string
}

/**
 * Correlated categories list for UI selectors, mapped to Prisma schema enum values.
 */
export const CORRELATED_PATIENT_CATEGORIES: CategoryOption[] = [
  {
    value: PrismaPatientCategory.NURSING_BREASTFEEDING_MOTHER,
    legacyCode: "NURSING_MOTHER",
    label: "Nursing / Breastfeeding Mother",
  },
  {
    value: PrismaPatientCategory.ELDERLY,
    legacyCode: "ELDERLY",
    label: "Elderly",
  },
  {
    value: PrismaPatientCategory.STUDENT,
    legacyCode: "STUDENT",
    label: "Student",
  },
  {
    value: PrismaPatientCategory.CIVIL_SERVANT,
    legacyCode: "CIVIL_SERVANT",
    label: "Civil Servant",
  },
  {
    value: PrismaPatientCategory.CORPORATE_COMPANY_MEMBER,
    legacyCode: "CORPORATE",
    label: "Corporate / Company Member",
  },
  {
    value: PrismaPatientCategory.NHIS_USER,
    legacyCode: "NHIS",
    label: "NHIS User",
  },
  {
    value: PrismaPatientCategory.INSURANCE_MEMBER,
    legacyCode: "INSURANCE",
    label: "Insurance Member",
  },
  {
    value: PrismaPatientCategory.GENERAL_PATIENT,
    legacyCode: "GENERAL",
    label: "General Patient",
  },
]

const CODE_TO_PRISMA = new Map<string, PrismaPatientCategoryType>()
const PRISMA_TO_CODE =
  new Map<PrismaPatientCategoryType, LegacyPatientCategory>()

for (const c of CORRELATED_PATIENT_CATEGORIES) {
  CODE_TO_PRISMA.set(c.legacyCode, c.value)
  CODE_TO_PRISMA.set(c.value, c.value)
  PRISMA_TO_CODE.set(c.value, c.legacyCode)
}

/**
 * Normalizes any category string (legacy or Prisma enum) to the canonical Prisma enum value.
 */
export function correlateCategoryToPrisma(
  input: string,
): PrismaPatientCategoryType {
  const match = CODE_TO_PRISMA.get(input.toUpperCase().trim())
  if (match) return match

  // Fallback: match by tokens (e.g. NHIS -> NHIS_USER)
  for (const c of CORRELATED_PATIENT_CATEGORIES) {
    if (
      c.value.includes(input.toUpperCase()) ||
      c.legacyCode.includes(input.toUpperCase())
    ) {
      return c.value
    }
  }

  return PrismaPatientCategory.GENERAL_PATIENT
}

/**
 * Normalizes any category string to the legacy frontend code if needed.
 */
export function correlateCategoryToLegacy(
  input: string,
): LegacyPatientCategory {
  const prisma = correlateCategoryToPrisma(input)
  return PRISMA_TO_CODE.get(prisma) || "GENERAL"
}
