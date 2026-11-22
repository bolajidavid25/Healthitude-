import { prisma } from "./config/prisma"
import { hashPassword } from "./utils/password"
import {
  AdminRole,
  AdminStatus,
  ProfessionalAccountStatus,
  ProfessionalCategory,
  ProfessionalVerificationStatus,
} from "./generated/prisma/enums"

/**
 * Idempotent database seed script for Healthitude (Local Development & Render Deployment).
 * Creates:
 * - Default Administrator (admin@healthitude.com)
 * - 4 Verified Healthcare Professionals (Doctors) so patients can discover & book real doctors immediately
 */
async function seed() {
  console.log("Seeding Healthitude database...")

  // 1. Seed Default Administrator
  const adminPasswordHash = await hashPassword("Admin@Healthitude2026!")
  const admin = await prisma.administrator.upsert({
    where: { email: "admin@healthitude.com" },
    update: {},
    create: {
      firstName: "Sylvia",
      lastName: "Yeboah",
      email: "admin@healthitude.com",
      passwordHash: adminPasswordHash,
      role: AdminRole.SUPER_ADMIN,
      status: AdminStatus.ACTIVE,
      department: "Clinical Governance & Verification",
      employeeId: "ADM-0001",
    },
  })
  console.log(`✓ Administrator ready: ${admin.email}`)

  // 2. Seed Verified Healthcare Professionals (Doctors)
  const doctorPasswordHash = await hashPassword("Doctor@Healthitude2026!")
  const licenceExpiry = new Date("2028-12-31T00:00:00.000Z")

  const seedDoctors = [
    {
      firstName: "Kofi",
      lastName: "Boateng",
      email: "doctor@healthitude.com",
      phoneNumber: "+233244100001",
      specialty: "General Practice",
      profession: "Medical Doctor",
      qualification: "MBChB",
      specialistQualification: "FWACP",
      institution: "University of Ghana Medical School",
      graduationYear: 2014,
      licenceNumber: "MDC-GH-2014-04812",
      regulatoryBody: "Medical and Dental Council Ghana",
      facility: "Korle Bu Teaching Hospital",
    },
    {
      firstName: "Efua",
      lastName: "Asante",
      email: "efua.asante@healthitude.com",
      phoneNumber: "+233244100002",
      specialty: "Cardiology",
      profession: "Consultant Cardiologist",
      qualification: "MBChB",
      specialistQualification: "FESC, FGhana-Card",
      institution: "University of Ghana Medical School",
      graduationYear: 2008,
      licenceNumber: "MDC-GH-2008-01924",
      regulatoryBody: "Medical and Dental Council Ghana",
      facility: "Korle Bu Teaching Hospital",
    },
    {
      firstName: "Ama",
      lastName: "Bentil",
      email: "ama.bentil@healthitude.com",
      phoneNumber: "+233244100003",
      specialty: "General Practice",
      profession: "Medical Doctor",
      qualification: "MBChB",
      specialistQualification: "MGCP",
      institution: "KNUST School of Medical Sciences",
      graduationYear: 2019,
      licenceNumber: "MDC-GH-2019-07341",
      regulatoryBody: "Medical and Dental Council Ghana",
      facility: "Labadi Polyclinic",
    },
    {
      firstName: "Michael",
      lastName: "Ade",
      email: "michael.ade@healthitude.com",
      phoneNumber: "+2348031000004",
      specialty: "Cardiology",
      profession: "Consultant Cardiologist",
      qualification: "MBBS",
      specialistQualification: "FACC",
      institution: "University of Lagos College of Medicine",
      graduationYear: 2014,
      licenceNumber: "MDCN-NG-2014-08819",
      regulatoryBody: "Medical and Dental Council of Nigeria",
      facility: "Lagos University Teaching Hospital",
    },
  ]

  for (const doc of seedDoctors) {
    const prof = await prisma.professional.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        ...doc,
        passwordHash: doctorPasswordHash,
        category: ProfessionalCategory.DOCTOR,
        licenceExpiry,
        verificationStatus: ProfessionalVerificationStatus.VERIFIED,
        accountStatus: ProfessionalAccountStatus.ACTIVE,
        verifiedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        decisionNotes: "Seeded verified clinician for Healthitude platform.",
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    })
    console.log(
      `✓ Verified Doctor ready: Dr. ${prof.firstName} ${prof.lastName} (${prof.email}) [${prof.id}]`,
    )
  }

  console.log("\nSeed completed successfully.")
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
