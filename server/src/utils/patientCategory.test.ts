import {
  correlatePatientCategory,
  toFrontendPatientCategory,
  getPatientCategoryMetadata,
  PATIENT_CATEGORY_CORRELATIONS,
} from "./patientCategory"
import { PatientCategory } from "../generated/prisma/enums"

console.log("Testing patient category correlation logic...")

const testCases: { input: string; expected: PatientCategory }[] = [
  // 5 mismatched frontend codes:
  {
    input: "NURSING_MOTHER",
    expected: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
  },
  { input: "CORPORATE", expected: PatientCategory.CORPORATE_COMPANY_MEMBER },
  { input: "NHIS", expected: PatientCategory.NHIS_USER },
  { input: "INSURANCE", expected: PatientCategory.INSURANCE_MEMBER },
  { input: "GENERAL", expected: PatientCategory.GENERAL_PATIENT },

  // Matching frontend codes:
  { input: "ELDERLY", expected: PatientCategory.ELDERLY },
  { input: "STUDENT", expected: PatientCategory.STUDENT },
  { input: "CIVIL_SERVANT", expected: PatientCategory.CIVIL_SERVANT },

  // Already Prisma enum format:
  {
    input: "NURSING_BREASTFEEDING_MOTHER",
    expected: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
  },
  {
    input: "CORPORATE_COMPANY_MEMBER",
    expected: PatientCategory.CORPORATE_COMPANY_MEMBER,
  },
  { input: "NHIS_USER", expected: PatientCategory.NHIS_USER },
  { input: "INSURANCE_MEMBER", expected: PatientCategory.INSURANCE_MEMBER },
  { input: "GENERAL_PATIENT", expected: PatientCategory.GENERAL_PATIENT },

  // Case insensitivity & spaces:
  {
    input: "nursing_mother",
    expected: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
  },
  { input: "nhis user", expected: PatientCategory.NHIS_USER },
  {
    input: "Nursing / Breastfeeding Mother",
    expected: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
  },
  { input: "corporate", expected: PatientCategory.CORPORATE_COMPANY_MEMBER },
  { input: "general", expected: PatientCategory.GENERAL_PATIENT },
]

for (const tc of testCases) {
  const result = correlatePatientCategory(tc.input)
  if (result !== tc.expected) {
    throw new Error(
      `Failed for input "${tc.input}": expected ${tc.expected}, got ${result}`,
    )
  }
}

console.log(`All ${testCases.length} correlation test cases passed!`)

// Test metadata retrieval
for (const corr of PATIENT_CATEGORY_CORRELATIONS) {
  const meta = getPatientCategoryMetadata(corr.frontendValue)
  if (meta.prismaEnum !== corr.prismaEnum) {
    throw new Error(`Metadata mismatch for ${corr.frontendValue}`)
  }
  const reverse = toFrontendPatientCategory(corr.prismaEnum)
  if (reverse !== corr.frontendValue) {
    throw new Error(`Reverse lookup failed for ${corr.prismaEnum}`)
  }
}

console.log("Metadata and reverse lookup tests passed!")
