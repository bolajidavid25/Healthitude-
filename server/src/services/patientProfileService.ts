import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  UpdatePatientProfileInput,
  RecordConsentInput,
} from "../validation/patientProfile"
import {
  CategoryVerificationStatus,
  ConsentType,
  PatientCategory,
} from "../generated/prisma/enums"

export interface SafePatientProfile {
  user: {
    id: string
    firstName: string
    middleName: string | null
    lastName: string
    dateOfBirth: Date
    sex: string
    email: string
    phoneNumber: string
    profilePhoto: string | null
    createdAt: Date
    updatedAt: Date
  }
  address: {
    id: string
    street: string
    city: string
    state: string
    district: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  emergencyContact: {
    id: string
    fullName: string
    relationship: string
    phoneNumber: string
    createdAt: Date
    updatedAt: Date
  } | null
  healthProfile: {
    id: string
    bloodGroup: string | null
    genotype: string | null
    knownAllergies: string | null
    medicalConditions: string | null
    currentMedications: string | null
    previousSurgeries: string | null
    medicalHistory: string | null
    patientReported: boolean
    clinicallyVerified: boolean
    verifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
  } | null
  patientCategory: {
    id: string
    category: string
    verificationStatus: CategoryVerificationStatus
    nhisId: string | null
    nhisSchemeType: string | null
    supportingDocument: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  consents: Array<{
    id: string
    consentType: ConsentType
    accepted: boolean
    acceptedAt: Date | null
    version: string
    createdAt: Date
  }>
}

export interface OnboardingStatusResponse {
  isComplete: boolean
  canProceed: boolean
  completedStages: string[]
  pendingStages: string[]
  missingRequiredFields: string[]
  missingMandatoryConsents: ConsentType[]
  categoryStatus: CategoryVerificationStatus | null
  clinicalVerificationStatus: boolean
}

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
 * Retrieves the full sanitized profile for an authenticated patient.
 * Rule L: Never exposes passwordHash or session tokens.
 */
export async function getPatientProfile(
  userId: string,
): Promise<SafePatientProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      sex: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      createdAt: true,
      updatedAt: true,
      address: {
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          district: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      emergencyContact: {
        select: {
          id: true,
          fullName: true,
          relationship: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      healthProfile: {
        select: {
          id: true,
          bloodGroup: true,
          genotype: true,
          knownAllergies: true,
          medicalConditions: true,
          currentMedications: true,
          previousSurgeries: true,
          medicalHistory: true,
          patientReported: true,
          clinicallyVerified: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      patientCategory: {
        select: {
          id: true,
          category: true,
          verificationStatus: true,
          nhisId: true,
          nhisSchemeType: true,
          supportingDocument: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      consents: {
        select: {
          id: true,
          consentType: true,
          accepted: true,
          acceptedAt: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    throw AppError.notFound("Patient profile not found")
  }

  const {
    address,
    emergencyContact,
    healthProfile,
    patientCategory,
    consents,
    ...userData
  } = user

  return {
    user: userData,
    address,
    emergencyContact,
    healthProfile,
    patientCategory,
    consents,
  }
}

/**
 * Evaluates the 5-stage onboarding status for an authenticated patient.
 * Rule N: Explicit completion rule across all 5 stages.
 * Rule O: Account existence alone does NOT constitute onboarding completion.
 * Rule P: Incomplete health profile may be valid if no allergies/conditions, but step must exist.
 * Rule Q: Machine-readable summary for frontend routing.
 */
export async function getOnboardingStatus(
  userId: string,
): Promise<OnboardingStatusResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      address: true,
      emergencyContact: true,
      healthProfile: true,
      patientCategory: true,
      consents: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    throw AppError.notFound("Patient not found")
  }

  const completedStages: string[] = []
  const pendingStages: string[] = []
  const missingRequiredFields: string[] = []
  const missingMandatoryConsents: ConsentType[] = []

  // Stage 1: Identity & Account
  const stage1Missing: string[] = []
  if (!user.firstName) stage1Missing.push("identity.firstName")
  if (!user.lastName) stage1Missing.push("identity.lastName")
  if (!user.dateOfBirth) stage1Missing.push("identity.dateOfBirth")
  if (!user.sex) stage1Missing.push("identity.sex")
  if (!user.email) stage1Missing.push("identity.email")
  if (!user.phoneNumber) stage1Missing.push("identity.phoneNumber")

  if (stage1Missing.length === 0) {
    completedStages.push("identity")
  } else {
    pendingStages.push("identity")
    missingRequiredFields.push(...stage1Missing)
  }

  // Stage 2: Contact & Emergency
  const stage2Missing: string[] = []
  if (!user.address) {
    stage2Missing.push("address.street", "address.city", "address.state")
  } else {
    if (!user.address.street) stage2Missing.push("address.street")
    if (!user.address.city) stage2Missing.push("address.city")
    if (!user.address.state) stage2Missing.push("address.state")
  }

  if (!user.emergencyContact) {
    stage2Missing.push(
      "emergencyContact.fullName",
      "emergencyContact.relationship",
      "emergencyContact.phoneNumber",
    )
  } else {
    if (!user.emergencyContact.fullName)
      stage2Missing.push("emergencyContact.fullName")
    if (!user.emergencyContact.relationship)
      stage2Missing.push("emergencyContact.relationship")
    if (!user.emergencyContact.phoneNumber)
      stage2Missing.push("emergencyContact.phoneNumber")
  }

  if (stage2Missing.length === 0) {
    completedStages.push("contact")
  } else {
    pendingStages.push("contact")
    missingRequiredFields.push(...stage2Missing)
  }

  // Stage 3: Health Profile (Rule P: row must exist)
  if (user.healthProfile) {
    completedStages.push("healthProfile")
  } else {
    pendingStages.push("healthProfile")
    missingRequiredFields.push("healthProfile")
  }

  // Stage 4: Patient Category
  if (user.patientCategory && user.patientCategory.category) {
    completedStages.push("patientCategory")
  } else {
    pendingStages.push("patientCategory")
    missingRequiredFields.push("patientCategory")
  }

  // Stage 5: Consents (Rule N: all 7 mandatory consent types must be accepted)
  // For each type, check if the latest consent is accepted
  const latestConsentByType = new Map<ConsentType, boolean>()
  for (const c of user.consents) {
    if (!latestConsentByType.has(c.consentType)) {
      latestConsentByType.set(c.consentType, c.accepted)
    }
  }

  for (const mandatoryType of MANDATORY_CONSENT_TYPES) {
    const isAccepted = latestConsentByType.get(mandatoryType)
    if (!isAccepted) {
      missingMandatoryConsents.push(mandatoryType)
    }
  }

  if (missingMandatoryConsents.length === 0) {
    completedStages.push("consents")
  } else {
    pendingStages.push("consents")
  }

  const isComplete =
    completedStages.length === 5 &&
    missingRequiredFields.length === 0 &&
    missingMandatoryConsents.length === 0

  return {
    isComplete,
    canProceed: isComplete,
    completedStages,
    pendingStages,
    missingRequiredFields,
    missingMandatoryConsents,
    categoryStatus: user.patientCategory?.verificationStatus ?? null,
    clinicalVerificationStatus: user.healthProfile?.clinicallyVerified ?? false,
  }
}

/**
 * Updates allowlisted fields of a patient profile atomically.
 * Rule F: Strictly allowlisted update fields.
 * Rule G: Blocks patient self-verification of category or clinical records.
 * Rule H: Preserves patientReported: true, clinicallyVerified: false.
 * Rule J: Preserves category verificationStatus: PENDING.
 * Rule R: Performs all updates atomically inside a transaction.
 */
export async function updatePatientProfile(
  userId: string,
  input: UpdatePatientProfileInput,
): Promise<SafePatientProfile> {
  const {
    identity,
    address,
    emergencyContact,
    healthProfile,
    patientCategory,
  } = input

  await prisma.$transaction(async (tx) => {
    // 1. Identity updates
    if (identity) {
      if (identity.phoneNumber) {
        const phoneConflict = await tx.user.findFirst({
          where: {
            phoneNumber: identity.phoneNumber,
            id: { not: userId },
          },
        })
        if (phoneConflict) {
          throw AppError.conflict(
            "Phone number is already in use by another account",
            [
              {
                field: "identity.phoneNumber",
                message:
                  "This phone number is already registered to another account",
                code: "DUPLICATE_PHONE",
              },
            ],
          )
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(identity.firstName !== undefined && {
            firstName: identity.firstName,
          }),
          ...(identity.middleName !== undefined && {
            middleName: identity.middleName,
          }),
          ...(identity.lastName !== undefined && {
            lastName: identity.lastName,
          }),
          ...(identity.phoneNumber !== undefined && {
            phoneNumber: identity.phoneNumber,
          }),
          ...(identity.profilePhoto !== undefined && {
            profilePhoto: identity.profilePhoto,
          }),
        },
      })
    }

    // 2. Address updates
    if (address) {
      await tx.address.upsert({
        where: { userId },
        create: {
          userId,
          street: address.street ?? "",
          city: address.city ?? "",
          state: address.state ?? "",
          district: address.district ?? null,
        },
        update: {
          ...(address.street !== undefined && { street: address.street }),
          ...(address.city !== undefined && { city: address.city }),
          ...(address.state !== undefined && { state: address.state }),
          ...(address.district !== undefined && { district: address.district }),
        },
      })
    }

    // 3. Emergency Contact updates
    if (emergencyContact) {
      await tx.emergencyContact.upsert({
        where: { userId },
        create: {
          userId,
          fullName: emergencyContact.fullName ?? "",
          relationship: emergencyContact.relationship ?? "OTHER",
          phoneNumber: emergencyContact.phoneNumber ?? "",
        },
        update: {
          ...(emergencyContact.fullName !== undefined && {
            fullName: emergencyContact.fullName,
          }),
          ...(emergencyContact.relationship !== undefined && {
            relationship: emergencyContact.relationship,
          }),
          ...(emergencyContact.phoneNumber !== undefined && {
            phoneNumber: emergencyContact.phoneNumber,
          }),
        },
      })
    }

    // 4. Health Profile updates
    // Rule G & H: Strictly enforce patientReported: true, clinicallyVerified: false
    if (healthProfile) {
      await tx.healthProfile.upsert({
        where: { userId },
        create: {
          userId,
          bloodGroup: healthProfile.bloodGroup ?? null,
          genotype: healthProfile.genotype ?? null,
          knownAllergies: healthProfile.knownAllergies ?? null,
          medicalConditions: healthProfile.medicalConditions ?? null,
          currentMedications: healthProfile.currentMedications ?? null,
          previousSurgeries: healthProfile.previousSurgeries ?? null,
          medicalHistory: healthProfile.medicalHistory ?? null,
          patientReported: true,
          clinicallyVerified: false,
          verifiedAt: null,
        },
        update: {
          ...(healthProfile.bloodGroup !== undefined && {
            bloodGroup: healthProfile.bloodGroup,
          }),
          ...(healthProfile.genotype !== undefined && {
            genotype: healthProfile.genotype,
          }),
          ...(healthProfile.knownAllergies !== undefined && {
            knownAllergies: healthProfile.knownAllergies,
          }),
          ...(healthProfile.medicalConditions !== undefined && {
            medicalConditions: healthProfile.medicalConditions,
          }),
          ...(healthProfile.currentMedications !== undefined && {
            currentMedications: healthProfile.currentMedications,
          }),
          ...(healthProfile.previousSurgeries !== undefined && {
            previousSurgeries: healthProfile.previousSurgeries,
          }),
          ...(healthProfile.medicalHistory !== undefined && {
            medicalHistory: healthProfile.medicalHistory,
          }),
          patientReported: true,
          clinicallyVerified: false,
          verifiedAt: null,
        },
      })
    }

    // 5. Patient Category updates
    // Rule G & J: Strictly enforce verificationStatus: PENDING
    if (patientCategory) {
      await tx.patientCategoryRecord.upsert({
        where: { userId },
        create: {
          userId,
          category:
            patientCategory.category as PatientCategory ??
            PatientCategory.GENERAL_PATIENT,
          verificationStatus: CategoryVerificationStatus.PENDING,
          nhisId: patientCategory.nhisId ?? null,
          nhisSchemeType: patientCategory.nhisSchemeType ?? null,
          supportingDocument: patientCategory.supportingDocument ?? null,
        },
        update: {
          ...(patientCategory.category !== undefined && {
            category: patientCategory.category as PatientCategory,
          }),
          ...(patientCategory.nhisId !== undefined && {
            nhisId: patientCategory.nhisId,
          }),
          ...(patientCategory.nhisSchemeType !== undefined && {
            nhisSchemeType: patientCategory.nhisSchemeType,
          }),
          ...(patientCategory.supportingDocument !== undefined && {
            supportingDocument: patientCategory.supportingDocument,
          }),
          verificationStatus: CategoryVerificationStatus.PENDING,
        },
      })
    }
  })

  return getPatientProfile(userId)
}

/**
 * Records a new consent version for an authenticated patient.
 * Rule K: Preserves historical consent records; new versions are distinct events.
 * Rule M: Records agreement version and server acceptance timestamp.
 */
export async function recordPatientConsent(
  userId: string,
  input: RecordConsentInput,
) {
  const record = await prisma.consentRecord.upsert({
    where: {
      userId_consentType_version: {
        userId,
        consentType: input.consentType,
        version: input.version,
      },
    },
    create: {
      userId,
      consentType: input.consentType,
      accepted: input.accepted,
      acceptedAt: input.accepted ? new Date() : null,
      version: input.version,
    },
    update: {
      accepted: input.accepted,
      acceptedAt: input.accepted ? new Date() : null,
    },
  })

  return record
}

/**
 * Retrieves the full consent history for an authenticated patient.
 * Rule K: Demonstrates complete audit trail of consent events.
 */
export async function getPatientConsents(userId: string) {
  const consents = await prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return consents
}

/**
 * Retrieves the current patient category and verification status.
 * Rule J & Check 8: Inspect category verification status.
 */
export async function getPatientCategoryStatus(userId: string) {
  const record = await prisma.patientCategoryRecord.findUnique({
    where: { userId },
  })

  return {
    category: record?.category ?? null,
    verificationStatus:
      record?.verificationStatus ?? CategoryVerificationStatus.PENDING,
    nhisId: record?.nhisId ?? null,
    nhisSchemeType: record?.nhisSchemeType ?? null,
    supportingDocument: record?.supportingDocument ?? null,
    updatedAt: record?.updatedAt ?? null,
  }
}
