import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  PatientCategory,
  CategoryVerificationStatus,
} from "../generated/prisma/enums"
import {
  correlatePatientCategory,
  toFrontendPatientCategory,
  getPatientCategoryMetadata,
  FrontendPatientCategory,
} from "../utils/patientCategory"
import { RequestCategoryChangeInput } from "../validation/pricing"

export interface PricingServiceRate {
  service: string
  standardRate: number
  patientCopay: number
  partnerCoverage: number
  healthitudeFee: number
  standard: string
  patient: string
  partner: string
  healthitude: string
}

export interface PricingPlanDefinition {
  name: string
  categoryCode: FrontendPatientCategory
  categoryEnum: PatientCategory
  effectiveFrom: string
  currency: string
  services: PricingServiceRate[]
}

export interface PatientPricingCoverageResult {
  category: {
    code: FrontendPatientCategory
    prismaEnum: PatientCategory
    name: string
    rank: number
    verificationStatus: CategoryVerificationStatus
    evidence: string
    nhisId: string | null
    nhisSchemeType: string | null
    supportingDocument: string | null
    hasSupportingDocument: boolean
    requiresEvidence: boolean
    updatedAt: Date | null
  }
  plan: PricingPlanDefinition
  allCategories: Array<{
    rank: number
    code: FrontendPatientCategory
    name: string
    requiresEvidence: boolean
    isActive: boolean
  }>
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-US")}`
}

function makeRate(
  service: string,
  standard: number,
  patient: number,
  partner: number,
  healthitude: number,
): PricingServiceRate {
  return {
    service,
    standardRate: standard,
    patientCopay: patient,
    partnerCoverage: partner,
    healthitudeFee: healthitude,
    standard: formatNaira(standard),
    patient: formatNaira(patient),
    partner: formatNaira(partner),
    healthitude: formatNaira(healthitude),
  }
}

/**
 * Approved Pricing Plans Matrix
 * Sourced directly from AdminPanel.tsx and PatientDashboard.tsx specifications.
 * All math strictly satisfies: patientCopay + partnerCoverage + healthitudeFee === standardRate.
 */
export const APPROVED_PRICING_PLANS: Record<FrontendPatientCategory, PricingPlanDefinition> =
  {
    NURSING_MOTHER: {
      name: "Nursing Mother Pricing Plan",
      categoryCode: "NURSING_MOTHER",
      categoryEnum: PatientCategory.NURSING_BREASTFEEDING_MOTHER,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 1500, 7000, 1500),
        makeRate("Specialist Consultation", 15000, 2000, 10500, 2500),
        makeRate("Follow-up Visit", 7000, 500, 5300, 1200),
        makeRate("Lab Request (standard)", 5000, 500, 3700, 800),
      ],
    },
    ELDERLY: {
      name: "Elderly Care Pricing Plan",
      categoryCode: "ELDERLY",
      categoryEnum: PatientCategory.ELDERLY,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 1500, 7000, 1500),
        makeRate("Specialist Consultation", 15000, 2000, 10500, 2500),
        makeRate("Follow-up Visit", 7000, 500, 5300, 1200),
        makeRate("Lab Request (standard)", 5000, 500, 3700, 800),
      ],
    },
    STUDENT: {
      name: "Student Health Pricing Plan",
      categoryCode: "STUDENT",
      categoryEnum: PatientCategory.STUDENT,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 3000, 5500, 1500),
        makeRate("Specialist Consultation", 15000, 5000, 7500, 2500),
        makeRate("Follow-up Visit", 7000, 2000, 3800, 1200),
        makeRate("Lab Request (standard)", 5000, 1000, 3200, 800),
      ],
    },
    CIVIL_SERVANT: {
      name: "Civil Servant Pricing Plan",
      categoryCode: "CIVIL_SERVANT",
      categoryEnum: PatientCategory.CIVIL_SERVANT,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 2500, 6000, 1500),
        makeRate("Specialist Consultation", 15000, 4000, 8500, 2500),
        makeRate("Follow-up Visit", 7000, 1500, 4300, 1200),
        makeRate("Lab Request (standard)", 5000, 800, 3400, 800),
      ],
    },
    CORPORATE: {
      name: "Corporate Member Pricing Plan",
      categoryCode: "CORPORATE",
      categoryEnum: PatientCategory.CORPORATE_COMPANY_MEMBER,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 2000, 6500, 1500),
        makeRate("Specialist Consultation", 15000, 3000, 9500, 2500),
        makeRate("Follow-up Visit", 7000, 1000, 4800, 1200),
        makeRate("Lab Request (standard)", 5000, 500, 3700, 800),
      ],
    },
    NHIS: {
      name: "NHIS Pricing Plan",
      categoryCode: "NHIS",
      categoryEnum: PatientCategory.NHIS_USER,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 2000, 6500, 1500),
        makeRate("Specialist Consultation", 15000, 3000, 9500, 2500),
        makeRate("Follow-up Visit", 7000, 1000, 4800, 1200),
        makeRate("Lab Request (standard)", 5000, 500, 3700, 800),
      ],
    },
    INSURANCE: {
      name: "Private Insurance Pricing Plan",
      categoryCode: "INSURANCE",
      categoryEnum: PatientCategory.INSURANCE_MEMBER,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 2000, 6500, 1500),
        makeRate("Specialist Consultation", 15000, 3000, 9500, 2500),
        makeRate("Follow-up Visit", 7000, 1000, 4800, 1200),
        makeRate("Lab Request (standard)", 5000, 500, 3700, 800),
      ],
    },
    GENERAL: {
      name: "General Patient Pricing Plan",
      categoryCode: "GENERAL",
      categoryEnum: PatientCategory.GENERAL_PATIENT,
      effectiveFrom: "Jan 1, 2026",
      currency: "NGN",
      services: [
        makeRate("General Consultation", 10000, 10000, 0, 0),
        makeRate("Specialist Consultation", 15000, 15000, 0, 0),
        makeRate("Follow-up Visit", 7000, 7000, 0, 0),
        makeRate("Lab Request (standard)", 5000, 5000, 0, 0),
      ],
    },
  }

/**
 * Precedence Order definition matching AdminPanel.tsx (Rank 1 highest → Rank 8 lowest)
 */
export const CATEGORY_PRECEDENCE_ORDER: Array<{
  rank: number
  code: FrontendPatientCategory
  name: string
  requiresEvidence: boolean
}> = [
  {
    rank: 1,
    code: "NURSING_MOTHER",
    name: "Nursing / Breastfeeding Mother",
    requiresEvidence: true,
  },
  { rank: 2, code: "ELDERLY", name: "Elderly", requiresEvidence: false },
  { rank: 3, code: "STUDENT", name: "Student", requiresEvidence: true },
  {
    rank: 4,
    code: "CIVIL_SERVANT",
    name: "Civil Servant",
    requiresEvidence: true,
  },
  {
    rank: 5,
    code: "CORPORATE",
    name: "Corporate / Company Member",
    requiresEvidence: true,
  },
  { rank: 6, code: "NHIS", name: "NHIS User", requiresEvidence: true },
  {
    rank: 7,
    code: "INSURANCE",
    name: "Insurance Member",
    requiresEvidence: true,
  },
  {
    rank: 8,
    code: "GENERAL",
    name: "General Patient",
    requiresEvidence: false,
  },
]

export const pricingService = {
  /**
   * Retrieves the authenticated patient's active billing category and applicable pricing plan.
   */
  async getPatientPricingAndCoverage(
    userId: string,
  ): Promise<PatientPricingCoverageResult> {
    const record = await prisma.patientCategoryRecord.findUnique({
      where: { userId },
    })

    const activePrismaEnum = record?.category ?? PatientCategory.GENERAL_PATIENT
    const activeCode = toFrontendPatientCategory(activePrismaEnum)
    const meta = getPatientCategoryMetadata(activePrismaEnum)
    const plan =
      APPROVED_PRICING_PLANS[activeCode] || APPROVED_PRICING_PLANS.GENERAL
    const rankEntry = CATEGORY_PRECEDENCE_ORDER.find(
      (c) => c.code === activeCode,
    )
    const rank = rankEntry?.rank ?? 8

    // Build evidence descriptor
    let evidence = "General billing (standard rate)"
    if (activeCode === "NHIS") {
      evidence = record?.nhisId
        ? `NHIS ID Card · ${record.nhisId}`
        : "NHIS User (Pending ID)"
    } else if (activeCode === "ELDERLY") {
      evidence = "Verified by registered date of birth"
    } else if (record?.supportingDocument) {
      evidence = `Supporting Document on File (${record.supportingDocument.split("/").pop()})`
    } else if (meta.requiresEvidence) {
      evidence = `${meta.label} · Evidence verification pending`
    }

    const allCategories = CATEGORY_PRECEDENCE_ORDER.map((c) => ({
      ...c,
      isActive: c.code === activeCode,
    }))

    return {
      category: {
        code: activeCode,
        prismaEnum: activePrismaEnum,
        name: meta.label,
        rank,
        verificationStatus:
          record?.verificationStatus ?? CategoryVerificationStatus.PENDING,
        evidence,
        nhisId: record?.nhisId ?? null,
        nhisSchemeType: record?.nhisSchemeType ?? null,
        supportingDocument: record?.supportingDocument ?? null,
        hasSupportingDocument: Boolean(record?.supportingDocument),
        requiresEvidence: meta.requiresEvidence,
        updatedAt: record?.updatedAt ?? null,
      },
      plan,
      allCategories,
    }
  },

  /**
   * Returns all available pricing plans and precedence rules.
   */
  getAllPricingPlans() {
    return {
      plans: APPROVED_PRICING_PLANS,
      categories: CATEGORY_PRECEDENCE_ORDER,
    }
  },

  /**
   * Requests an update or review of the patient's billing category.
   * STRICT GOVERNANCE RULES:
   * - Enforces single primary category (userId is unique in PostgreSQL).
   * - Resets verificationStatus to PENDING (patient cannot self-verify).
   * - Enforces NHIS ID requirement if category is NHIS.
   */
  async updatePatientCategory(
    userId: string,
    input: RequestCategoryChangeInput,
  ): Promise<PatientPricingCoverageResult> {
    const prismaEnum = correlatePatientCategory(input.category)

    if (prismaEnum === PatientCategory.NHIS_USER && !input.nhisId) {
      throw AppError.badRequest(
        "NHIS identification number is required for the NHIS User category.",
      )
    }

    await prisma.patientCategoryRecord.upsert({
      where: { userId },
      create: {
        userId,
        category: prismaEnum,
        verificationStatus: CategoryVerificationStatus.PENDING,
        nhisId: input.nhisId ?? null,
        nhisSchemeType: input.nhisSchemeType ?? null,
        supportingDocument: input.supportingDocument ?? null,
      },
      update: {
        category: prismaEnum,
        verificationStatus: CategoryVerificationStatus.PENDING,
        nhisId: input.nhisId ?? null,
        nhisSchemeType: input.nhisSchemeType ?? null,
        supportingDocument: input.supportingDocument ?? null,
      },
    })

    return this.getPatientPricingAndCoverage(userId)
  },

  /**
   * Rejects attempts to delete category records.
   * Every patient must maintain exactly one active billing category.
   */
  rejectCategoryDelete(): never {
    throw AppError.forbidden(
      "Every patient must have exactly one active billing category. Category deletion is prohibited.",
    )
  },
}
