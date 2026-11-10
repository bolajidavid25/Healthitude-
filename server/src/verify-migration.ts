import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const currentDir =
  import.meta.dirname || path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, "../.env") })
dotenv.config()

import { prisma } from "./config/prisma"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  CategoryVerificationStatus,
  ConsentType,
} from "./generated/prisma/enums"

async function main() {
  console.log("Starting Prisma database verification test...")

  // 1. Initial read operation
  const initialUsers = await prisma.user.findMany()
  console.log(`Initial User count: ${initialUsers.length}`)

  // 2. Create test user through all 5 onboarding stages
  const testEmail = `test.patient.${Date.now()}@healthitude.com`
  const testPhone = `+233${Math.floor(200000000 + Math.random() * 899999999)}`

  const createdUser = await prisma.user.create({
    data: {
      firstName: "Ama",
      middleName: "Akua",
      lastName: "Mensah",
      dateOfBirth: new Date("1995-04-12"),
      sex: Sex.FEMALE,
      email: testEmail,
      phoneNumber: testPhone,
      passwordHash: "$2b$12$eD4Z3W0vH5pL7e2k...",
      profilePhoto: "avatars/ama_mensah_uuid.jpg",

      address: {
        create: {
          street: "12 Independence Ave",
          city: "Accra",
          state: "Greater Accra",
          district: "Ayawaso West",
        },
      },
      emergencyContact: {
        create: {
          fullName: "Kofi Mensah",
          relationship: Relationship.SPOUSE_PARTNER,
          phoneNumber: "+233205550101",
        },
      },

      healthProfile: {
        create: {
          bloodGroup: BloodGroup.O_POSITIVE,
          genotype: Genotype.AA,
          knownAllergies: "Penicillin",
          medicalConditions: "None",
          currentMedications: "Multivitamins",
          previousSurgeries: "Appendectomy (2018)",
          medicalHistory: "No major chronic illnesses",
        },
      },

      patientCategory: {
        create: {
          category: PatientCategory.NHIS_USER,
          nhisId: "GH-NHIS-20240088341",
          nhisSchemeType: "NHIS",
          supportingDocument: "docs/nhis_card_scan.pdf",
        },
      },

      consents: {
        create: [
          {
            consentType: ConsentType.TERMS_AND_PRIVACY,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.HEALTH_DATA_PROCESSING,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.PROFESSIONAL_ACCESS,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.AI_LIMITATIONS,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.BREAK_GLASS_DISCLOSURE,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
          {
            consentType: ConsentType.INFORMATION_ACCURACY,
            accepted: true,
            acceptedAt: new Date(),
            version: "1.0",
          },
        ],
      },
    },
    include: {
      address: true,
      emergencyContact: true,
      healthProfile: true,
      patientCategory: true,
      consents: true,
    },
  })

  console.log("Successfully created full onboarding patient record!")
  console.log(`User ID: ${createdUser.id}`)

  // 3. Small Prisma read operation with filters
  const queriedUser = await prisma.user.findUnique({
    where: { id: createdUser.id },
    include: {
      address: true,
      emergencyContact: true,
      healthProfile: true,
      patientCategory: true,
      consents: true,
    },
  })

  if (!queriedUser) {
    throw new Error("Failed to retrieve created user by ID")
  }

  if (queriedUser.healthProfile?.clinicallyVerified !== false) {
    throw new Error("Default clinicallyVerified should be false")
  }

  if (
    queriedUser.patientCategory?.verificationStatus !==
    CategoryVerificationStatus.PENDING
  ) {
    throw new Error("Default verificationStatus should be PENDING")
  }

  if (queriedUser.consents.length !== 7) {
    throw new Error(`Expected 7 consents, got ${queriedUser.consents.length}`)
  }

  console.log("Verification checks PASSED!")

  // Clean up test patient record
  await prisma.user.delete({
    where: { id: createdUser.id },
  })
  console.log("Cleaned up test patient record (Cascade delete verified).")

  // Final count check
  const finalUsers = await prisma.user.findMany()
  console.log(`Final User count: ${finalUsers.length}`)

  console.log("All Prisma database verification tests passed successfully!")
}

main()
  .catch((err) => {
    console.error("Verification test failed:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
