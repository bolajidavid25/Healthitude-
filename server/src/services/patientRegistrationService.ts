import { prisma } from "../config/prisma"
import { hashPassword } from "../utils/password"
import { AppError } from "../errors/AppError"
import { PatientRegistrationInput } from "../validation/onboarding"
import { CategoryVerificationStatus } from "../generated/prisma/enums"

export interface SafeRegisteredPatientResponse {
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
  }
  emergencyContact: {
    id: string
    fullName: string
    relationship: string
    phoneNumber: string
  }
  healthProfile: {
    id: string
    bloodGroup: string | null
    genotype: string | null
    patientReported: boolean
    clinicallyVerified: boolean
  }
  patientCategory: {
    id: string
    category: string
    verificationStatus: CategoryVerificationStatus
    nhisId: string | null
    nhisSchemeType: string | null
  }
  consents: Array<{
    consentType: string
    accepted: boolean
    acceptedAt: Date | null
    version: string
  }>
}

export interface RegistrationServiceOptions {
  /** Optional hook for simulating failures during transaction testing (Scenario 10) */
  injectSimulatedErrorAfterStep?: "user" | "address" | "emergencyContact" | "healthProfile"
}

/**
 * Registers a new patient through Healthitude's five-stage onboarding workflow.
 * Rule G: Preliminary conflict check + database unique constraints.
 * Rule H & I: Creates all records in a single Prisma transaction; rolls back on any error.
 * Rule K: Marks health profile patientReported: true, clinicallyVerified: false.
 * Rule L: Marks patient category verificationStatus: PENDING.
 * Rule O & P: Server-generated acceptedAt timestamp.
 * Rule T: Returns only safe account fields; never exposes passwordHash.
 */
export async function registerPatient(
  input: PatientRegistrationInput,
  options?: RegistrationServiceOptions,
): Promise<SafeRegisteredPatientResponse> {
  const {
    account,
    contact,
    healthProfile: hpInput,
    patientCategory: catInput,
    consents,
  } = input

  // 1. Preliminary conflict checks (Rule G)
  const existingEmail = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  })
  if (existingEmail) {
    throw AppError.conflict(
      "An account with this email address already exists",
      [
        {
          field: "account.email",
          message: "A user with this email address is already registered",
          code: "DUPLICATE_EMAIL",
        },
      ],
    )
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phoneNumber: account.phoneNumber },
    select: { id: true },
  })
  if (existingPhone) {
    throw AppError.conflict(
      "An account with this phone number already exists",
      [
        {
          field: "account.phoneNumber",
          message: "A user with this phone number is already registered",
          code: "DUPLICATE_PHONE",
        },
      ],
    )
  }

  // 2. Hash password with bcrypt work factor 12 (Rule D, E)
  const passwordHash = await hashPassword(account.password)

  // 3. Server-generated authoritative consent timestamp (Rule O, P)
  const serverConsentTimestamp = new Date()

  try {
    // 4. Atomic transaction across all 5 onboarding record types (Rule H, I)
    const result = await prisma.$transaction(
      async (tx) => {
        // Step A: Create User
        const user = await tx.user.create({
          data: {
            firstName: account.firstName,
            middleName: account.middleName ?? null,
            lastName: account.lastName,
            dateOfBirth:
              typeof account.dateOfBirth === "string"
                ? new Date(account.dateOfBirth)
                : account.dateOfBirth,
            sex: account.sex,
            email: account.email,
            phoneNumber: account.phoneNumber,
            passwordHash,
            profilePhoto: account.profilePhoto ?? null,
          },
        })

        if (options?.injectSimulatedErrorAfterStep === "user") {
          throw new Error(
            "Simulated failure after user creation for transaction rollback verification",
          )
        }

        // Step B: Create Address
        const address = await tx.address.create({
          data: {
            userId: user.id,
            street: contact.street,
            city: contact.city,
            state: contact.state,
            district: contact.district ?? null,
          },
        })

        if (options?.injectSimulatedErrorAfterStep === "address") {
          throw new Error(
            "Simulated failure after address creation for transaction rollback verification",
          )
        }

        // Step C: Create Emergency Contact
        const emergencyContact = await tx.emergencyContact.create({
          data: {
            userId: user.id,
            fullName: contact.emergencyContact.fullName,
            relationship: contact.emergencyContact.relationship,
            phoneNumber: contact.emergencyContact.phoneNumber,
          },
        })

        if (options?.injectSimulatedErrorAfterStep === "emergencyContact") {
          throw new Error(
            "Simulated failure after emergency contact creation for transaction rollback verification",
          )
        }

        // Step D: Create Health Profile (Rule K: patientReported=true, clinicallyVerified=false)
        const healthProfile = await tx.healthProfile.create({
          data: {
            userId: user.id,
            bloodGroup: hpInput?.bloodGroup ?? null,
            genotype: hpInput?.genotype ?? null,
            knownAllergies: hpInput?.knownAllergies ?? null,
            medicalConditions: hpInput?.medicalConditions ?? null,
            currentMedications: hpInput?.currentMedications ?? null,
            previousSurgeries: hpInput?.previousSurgeries ?? null,
            medicalHistory: hpInput?.medicalHistory ?? null,
            patientReported: true,
            clinicallyVerified: false,
          },
        })

        if (options?.injectSimulatedErrorAfterStep === "healthProfile") {
          throw new Error(
            "Simulated failure after health profile creation for transaction rollback verification",
          )
        }

        // Step E: Create Patient Category Record (Rule L: PENDING status)
        const patientCategory = await tx.patientCategoryRecord.create({
          data: {
            userId: user.id,
            category: catInput.category,
            verificationStatus: CategoryVerificationStatus.PENDING,
            nhisId: catInput.nhisId ?? null,
            nhisSchemeType: catInput.nhisSchemeType ?? null,
            supportingDocument: catInput.supportingDocument ?? null,
          },
        })

        // Step F: Create Consent Records
        const consentRecords = await Promise.all(
          consents.consents.map((consent) =>
            tx.consentRecord.create({
              data: {
                userId: user.id,
                consentType: consent.consentType,
                accepted: consent.accepted,
                acceptedAt: consent.accepted ? serverConsentTimestamp : null,
                version: consent.version,
              },
            }),
          ),
        )

        return {
          user,
          address,
          emergencyContact,
          healthProfile,
          patientCategory,
          consentRecords,
        }
      },
      { timeout: 15000, maxWait: 10000 },
    )

    // 5. Build safe, sanitized response without passwordHash or internal sensitive notes (Rule T)
    return {
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        middleName: result.user.middleName,
        lastName: result.user.lastName,
        dateOfBirth: result.user.dateOfBirth,
        sex: result.user.sex,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        profilePhoto: result.user.profilePhoto,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      },
      address: {
        id: result.address.id,
        street: result.address.street,
        city: result.address.city,
        state: result.address.state,
        district: result.address.district,
      },
      emergencyContact: {
        id: result.emergencyContact.id,
        fullName: result.emergencyContact.fullName,
        relationship: result.emergencyContact.relationship,
        phoneNumber: result.emergencyContact.phoneNumber,
      },
      healthProfile: {
        id: result.healthProfile.id,
        bloodGroup: result.healthProfile.bloodGroup,
        genotype: result.healthProfile.genotype,
        patientReported: result.healthProfile.patientReported,
        clinicallyVerified: result.healthProfile.clinicallyVerified,
      },
      patientCategory: {
        id: result.patientCategory.id,
        category: result.patientCategory.category,
        verificationStatus: result.patientCategory.verificationStatus,
        nhisId: result.patientCategory.nhisId,
        nhisSchemeType: result.patientCategory.nhisSchemeType,
      },
      consents: result.consentRecords.map((cr) => ({
        consentType: cr.consentType,
        accepted: cr.accepted,
        acceptedAt: cr.acceptedAt,
        version: cr.version,
      })),
    }
  } catch (error: any) {
    // Intercept database-level unique constraint race condition violations (Rule G)
    if (error && typeof error === "object" && error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target)
        ? error.meta.target
        : error.meta?.target
          ? [String(error.meta.target)]
          : []

      const isEmail = targets.some((t: string) =>
        t.toLowerCase().includes("email"),
      )
      const isPhone = targets.some((t: string) =>
        t.toLowerCase().includes("phone"),
      )

      if (isEmail) {
        throw AppError.conflict(
          "An account with this email address already exists",
          [
            {
              field: "account.email",
              message: "A user with this email address is already registered",
              code: "DUPLICATE_EMAIL",
            },
          ],
        )
      }

      if (isPhone) {
        throw AppError.conflict(
          "An account with this phone number already exists",
          [
            {
              field: "account.phoneNumber",
              message: "A user with this phone number is already registered",
              code: "DUPLICATE_PHONE",
            },
          ],
        )
      }

      throw AppError.conflict(
        "A record with these unique details already exists",
      )
    }

    // Re-throw AppErrors and other unexpected transaction exceptions
    throw error
  }
}
