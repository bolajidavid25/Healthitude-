import http from "http"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { ErrorCode } from "./errors/AppError"
import { patientRegistrationSchema } from "./validation/onboarding"
import { registerPatient } from "./services/patientRegistrationService"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
  CategoryVerificationStatus,
} from "./generated/prisma/enums"
import { resetAllRateLimits } from "./middleware/rateLimiter"

// Helper for sending POST requests with JSON body
async function postJson(
  port: number,
  path: string,
  payload: any,
): Promise<{ status: number; body: any }> {
  resetAllRateLimits()
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload)
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsed
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode || 500, body: parsed })
        })
      },
    )
    req.on("error", reject)
    req.write(postData)
    req.end()
  })
}

function generateUniqueTestData() {
  const nonce =
    Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)
  const email = `test.reg.${nonce}@example.com`
  const phoneSuffix = (1000000 + Math.floor(Math.random() * 8999999)).toString()
  const phoneNumber = `024${phoneSuffix}` // Ghana local 10-digit format
  const normalizedPhone = `+23324${phoneSuffix}`

  const allConsents = [
    {
      consentType: ConsentType.TERMS_AND_PRIVACY,
      accepted: true,
      version: "1.0",
    },
    {
      consentType: ConsentType.HEALTH_DATA_PROCESSING,
      accepted: true,
      version: "1.0",
    },
    {
      consentType: ConsentType.PROFESSIONAL_ACCESS,
      accepted: true,
      version: "1.0",
    },
    {
      consentType: ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
      accepted: true,
      version: "1.0",
    },
    { consentType: ConsentType.AI_LIMITATIONS, accepted: true, version: "1.0" },
    {
      consentType: ConsentType.BREAK_GLASS_DISCLOSURE,
      accepted: true,
      version: "1.0",
    },
    {
      consentType: ConsentType.INFORMATION_ACCURACY,
      accepted: true,
      version: "1.0",
    },
  ]

  const validPayload = {
    account: {
      firstName: "Ama",
      middleName: "Akua",
      lastName: "Mensah",
      dateOfBirth: "1995-08-20",
      sex: Sex.FEMALE,
      email,
      phoneNumber,
      password: "StrongPassword2026!",
      confirmPassword: "StrongPassword2026!",
      profilePhoto: "https://healthitude.com/photos/ama.jpg",
    },
    contact: {
      street: "12 Independence Avenue",
      city: "Accra",
      state: "Greater Accra",
      district: "Ayawaso West",
      emergencyContact: {
        fullName: "Kofi Mensah",
        relationship: Relationship.SPOUSE_PARTNER,
        phoneNumber: "0205550101",
      },
    },
    healthProfile: {
      bloodGroup: BloodGroup.O_POSITIVE,
      genotype: Genotype.AA,
      knownAllergies: "Penicillin (moderate hives)",
      medicalConditions: "Mild intermittent asthma",
      currentMedications: "Salbutamol inhaler PRN",
      previousSurgeries: "Appendectomy (2018)",
      medicalHistory: "No prior hospitalizations",
    },
    patientCategory: {
      category: PatientCategory.NHIS_USER,
      nhisId: "GH-NHIS-20240088341",
      nhisSchemeType: "NHIS",
      supportingDocument: "https://healthitude.com/docs/nhis-card.pdf",
    },
    consents: allConsents,
  }

  return { email, phoneNumber, normalizedPhone, validPayload, allConsents }
}

async function runPatientRegistrationTests() {
  console.log(
    "================================================================================",
  )
  console.log("HEALTHITUDE: PATIENT REGISTRATION API & TRANSACTION TEST SUITE")
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5188
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)

  // Track created test emails for final cleanup
  const createdTestEmails: string[] = []

  try {
    // =========================================================================
    // SCENARIO 1: VALID REGISTRATION
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 1: Valid Registration (Complete 5-Stage Onboarding & Database Creation)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture1 = generateUniqueTestData()
    createdTestEmails.push(fixture1.email)

    const res1 = await postJson(
      testPort,
      "/api/patients/register",
      fixture1.validPayload,
    )
    console.log("HTTP Status:", res1.status)
    console.log(
      "Response Body (Excerpt):",
      JSON.stringify(
        {
          status: res1.body.status,
          message: res1.body.message,
          user: res1.body.data?.user,
          consentsCount: res1.body.data?.consents?.length,
        },
        null,
        2,
      ),
    )

    // Verify HTTP 201 Created
    if (res1.status !== 201 || res1.body.status !== "success") {
      throw new Error(
        `Scenario 1 Failed: Expected HTTP 201 success, got ${res1.status}`,
      )
    }

    // Verify response structure & sensitive information protection (Rule T)
    const {
      user,
      address,
      emergencyContact,
      healthProfile,
      patientCategory,
      consents,
    } = res1.body.data

    if (!user?.id || user.email !== fixture1.email) {
      throw new Error(
        "Scenario 1 Failed: Missing or incorrect user details in response.",
      )
    }
    if (
      (user as any).passwordHash ||
      JSON.stringify(res1.body).includes("passwordHash")
    ) {
      throw new Error(
        "SECURITY VIOLATION: passwordHash exposed in registration response!",
      )
    }
    if (
      (res1.body.data as any).account?.password ||
      JSON.stringify(res1.body).includes("StrongPassword2026!")
    ) {
      throw new Error(
        "SECURITY VIOLATION: Plaintext password exposed in registration response!",
      )
    }

    // Verify database records in PostgreSQL via Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        address: true,
        emergencyContact: true,
        healthProfile: true,
        patientCategory: true,
        consents: true,
      },
    })

    if (!dbUser) {
      throw new Error(
        "Scenario 1 Failed: User record not found in PostgreSQL database!",
      )
    }
    if (!dbUser.passwordHash || !dbUser.passwordHash.startsWith("$2")) {
      throw new Error(
        "Scenario 1 Failed: Password was not hashed with bcrypt in the database!",
      )
    }
    if (!dbUser.address || dbUser.address.city !== "Accra") {
      throw new Error(
        "Scenario 1 Failed: Address record not created in database!",
      )
    }
    if (
      !dbUser.emergencyContact ||
      dbUser.emergencyContact.fullName !== "Kofi Mensah"
    ) {
      throw new Error(
        "Scenario 1 Failed: Emergency contact record not created in database!",
      )
    }
    if (
      !dbUser.healthProfile ||
      dbUser.healthProfile.patientReported !== true ||
      dbUser.healthProfile.clinicallyVerified !== false
    ) {
      throw new Error(
        "Scenario 1 Failed: Health profile must be patientReported=true, clinicallyVerified=false!",
      )
    }
    if (
      !dbUser.patientCategory ||
      dbUser.patientCategory.verificationStatus !==
        CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        "Scenario 1 Failed: Patient category verificationStatus must be PENDING!",
      )
    }
    if (dbUser.consents.length !== 7) {
      throw new Error(
        `Scenario 1 Failed: Expected 7 consent records in database, got ${dbUser.consents.length}`,
      )
    }

    // Verify server-generated timestamp (Rule O, P)
    const firstConsent = dbUser.consents[0]
    if (
      !firstConsent.acceptedAt ||
      !(firstConsent.acceptedAt instanceof Date)
    ) {
      throw new Error(
        "Scenario 1 Failed: acceptedAt timestamp must be recorded as a valid Date!",
      )
    }

    console.log(
      "✔ SCENARIO 1 PASSED: Complete patient account created (201). All 6 related models verified in DB. passwordHash completely hidden.",
    )

    // =========================================================================
    // SCENARIO 2: DUPLICATE EMAIL
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 2: Duplicate Email Conflict Handling (HTTP 409 Conflict)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture2 = generateUniqueTestData()
    // Use same email as fixture 1, but with uppercase and whitespace to test normalization conflict detection
    const duplicateEmailPayload = {
      ...fixture2.validPayload,
      account: {
        ...fixture2.validPayload.account,
        email: `  ${fixture1.email.toUpperCase()}  `,
      },
    }

    const res2 = await postJson(
      testPort,
      "/api/patients/register",
      duplicateEmailPayload,
    )
    console.log("HTTP Status:", res2.status)
    console.log("Response Body:", JSON.stringify(res2.body, null, 2))

    if (res2.status !== 409 || res2.body.code !== ErrorCode.RESOURCE_CONFLICT) {
      throw new Error(
        `Scenario 2 Failed: Expected HTTP 409 RESOURCE_CONFLICT, got ${res2.status}`,
      )
    }

    // Verify database user count did not increase
    const userCountAfterDupEmail = await prisma.user.count({
      where: { email: fixture1.email },
    })
    if (userCountAfterDupEmail !== 1) {
      throw new Error(
        "Scenario 2 Failed: Duplicate user record was created in database!",
      )
    }

    console.log(
      "✔ SCENARIO 2 PASSED: Duplicate email registration rejected with HTTP 409 RESOURCE_CONFLICT. No records created.",
    )

    // =========================================================================
    // SCENARIO 3: DUPLICATE PHONE NUMBER
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 3: Duplicate Phone Number Conflict Handling (HTTP 409 Conflict)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Use fixture 1's phone number but different email
    const duplicatePhonePayload = {
      ...fixture2.validPayload,
      account: {
        ...fixture2.validPayload.account,
        email: fixture2.email, // Unique email
        phoneNumber: fixture1.phoneNumber, // Duplicate phone number
      },
    }

    const res3 = await postJson(
      testPort,
      "/api/patients/register",
      duplicatePhonePayload,
    )
    console.log("HTTP Status:", res3.status)
    console.log("Response Body:", JSON.stringify(res3.body, null, 2))

    if (res3.status !== 409 || res3.body.code !== ErrorCode.RESOURCE_CONFLICT) {
      throw new Error(
        `Scenario 3 Failed: Expected HTTP 409 RESOURCE_CONFLICT, got ${res3.status}`,
      )
    }

    // Verify no user with fixture 2's email was created
    const userWithEmail2 = await prisma.user.findUnique({
      where: { email: fixture2.email },
    })
    if (userWithEmail2) {
      throw new Error(
        "Scenario 3 Failed: Partial user record created despite duplicate phone number!",
      )
    }

    console.log(
      "✔ SCENARIO 3 PASSED: Duplicate phone number rejected with HTTP 409 RESOURCE_CONFLICT. Zero records created.",
    )

    // =========================================================================
    // SCENARIO 4: MISSING REQUIRED IDENTITY FIELD
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 4: Missing Required Identity Field (Stage 1 Validation)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture4 = generateUniqueTestData()
    const missingIdentityPayload = {
      ...fixture4.validPayload,
      account: {
        ...fixture4.validPayload.account,
        lastName: "", // Empty required field
      },
    }
    delete (missingIdentityPayload.account as any).lastName

    const res4 = await postJson(
      testPort,
      "/api/patients/register",
      missingIdentityPayload,
    )
    console.log("HTTP Status:", res4.status)
    console.log("Response Body:", JSON.stringify(res4.body, null, 2))

    if (res4.status !== 400 || res4.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 4 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res4.status}`,
      )
    }

    const hasLastNameError = res4.body.errors?.some((e: any) =>
      e.field.includes("lastName"),
    )
    if (!hasLastNameError) {
      throw new Error(
        "Scenario 4 Failed: lastName field not flagged in validation errors.",
      )
    }

    // Verify zero database records
    const checkUser4 = await prisma.user.findUnique({
      where: { email: fixture4.email },
    })
    if (checkUser4) {
      throw new Error(
        "Scenario 4 Failed: Database record created for invalid request!",
      )
    }

    console.log(
      "✔ SCENARIO 4 PASSED: Missing identity field rejected with HTTP 400 VALIDATION_ERROR. No database records created.",
    )

    // =========================================================================
    // SCENARIO 5: INVALID DATE OF BIRTH
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 5: Invalid Date of Birth (Rollover Dates & Future Dates)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture5 = generateUniqueTestData()
    // Test 2023-02-31 (calendar impossible date)
    const invalidDobPayload = {
      ...fixture5.validPayload,
      account: {
        ...fixture5.validPayload.account,
        dateOfBirth: "2023-02-31",
      },
    }

    const res5 = await postJson(
      testPort,
      "/api/patients/register",
      invalidDobPayload,
    )
    console.log("HTTP Status:", res5.status)
    console.log("Response Body:", JSON.stringify(res5.body, null, 2))

    if (res5.status !== 400 || res5.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 5 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res5.status}`,
      )
    }

    const hasDobError = res5.body.errors?.some((e: any) =>
      e.field.includes("dateOfBirth"),
    )
    if (!hasDobError) {
      throw new Error(
        "Scenario 5 Failed: dateOfBirth not flagged in validation errors.",
      )
    }

    const checkUser5 = await prisma.user.findUnique({
      where: { email: fixture5.email },
    })
    if (checkUser5) {
      throw new Error(
        "Scenario 5 Failed: Database record created for invalid date of birth!",
      )
    }

    console.log(
      "✔ SCENARIO 5 PASSED: Rollover date 2023-02-31 rejected with HTTP 400. Zero database records created.",
    )

    // =========================================================================
    // SCENARIO 6: MISSING EMERGENCY CONTACT
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("SCENARIO 6: Missing Emergency Contact (Stage 2 Validation)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture6 = generateUniqueTestData()
    const missingContactPayload = {
      ...fixture6.validPayload,
      contact: {
        street: "12 Independence Avenue",
        city: "Accra",
        state: "Greater Accra",
        // emergencyContact missing
      },
    }

    const res6 = await postJson(
      testPort,
      "/api/patients/register",
      missingContactPayload,
    )
    console.log("HTTP Status:", res6.status)
    console.log("Response Body:", JSON.stringify(res6.body, null, 2))

    if (res6.status !== 400 || res6.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 6 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res6.status}`,
      )
    }

    const hasContactError = res6.body.errors?.some((e: any) =>
      e.field.includes("emergencyContact"),
    )
    if (!hasContactError) {
      throw new Error(
        "Scenario 6 Failed: emergencyContact not flagged in validation errors.",
      )
    }

    const checkUser6 = await prisma.user.findUnique({
      where: { email: fixture6.email },
    })
    if (checkUser6) {
      throw new Error(
        "Scenario 6 Failed: Database record created despite missing emergency contact!",
      )
    }

    console.log(
      "✔ SCENARIO 6 PASSED: Missing emergency contact rejected with HTTP 400. Zero database records created.",
    )

    // =========================================================================
    // SCENARIO 7: INVALID PATIENT CATEGORY
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("SCENARIO 7: Invalid Patient Category (Stage 4 Validation)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture7 = generateUniqueTestData()
    const invalidCatPayload = {
      ...fixture7.validPayload,
      patientCategory: {
        category: "INVALID_SPECIAL_CATEGORY_XYZ",
      },
    }

    const res7 = await postJson(
      testPort,
      "/api/patients/register",
      invalidCatPayload,
    )
    console.log("HTTP Status:", res7.status)
    console.log("Response Body:", JSON.stringify(res7.body, null, 2))

    if (res7.status !== 400 || res7.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 7 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res7.status}`,
      )
    }

    const hasCatError = res7.body.errors?.some((e: any) =>
      e.field.includes("category"),
    )
    if (!hasCatError) {
      throw new Error(
        "Scenario 7 Failed: category not flagged in validation errors.",
      )
    }

    const checkUser7 = await prisma.user.findUnique({
      where: { email: fixture7.email },
    })
    if (checkUser7) {
      throw new Error(
        "Scenario 7 Failed: Database record created for invalid category!",
      )
    }

    console.log(
      "✔ SCENARIO 7 PASSED: Unsupported patient category rejected with HTTP 400. Zero database records created.",
    )

    // =========================================================================
    // SCENARIO 8: MISSING MANDATORY CONSENT
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("SCENARIO 8: Missing Mandatory Consent (Rule M, Q)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture8 = generateUniqueTestData()
    // Remove one of the 7 agreements (e.g. BREAK_GLASS_DISCLOSURE)
    const incompleteConsents = fixture8.allConsents.filter(
      (c) => c.consentType !== ConsentType.BREAK_GLASS_DISCLOSURE,
    )

    const missingConsentPayload = {
      ...fixture8.validPayload,
      consents: incompleteConsents,
    }

    const res8 = await postJson(
      testPort,
      "/api/patients/register",
      missingConsentPayload,
    )
    console.log("HTTP Status:", res8.status)
    console.log("Response Body:", JSON.stringify(res8.body, null, 2))

    if (res8.status !== 400 || res8.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 8 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res8.status}`,
      )
    }

    const hasMissingConsentMsg = res8.body.errors?.some((e: any) =>
      e.message.includes("BREAK_GLASS_DISCLOSURE"),
    )
    if (!hasMissingConsentMsg) {
      throw new Error(
        "Scenario 8 Failed: Missing BREAK_GLASS_DISCLOSURE not flagged.",
      )
    }

    const checkUser8 = await prisma.user.findUnique({
      where: { email: fixture8.email },
    })
    if (checkUser8) {
      throw new Error(
        "Scenario 8 Failed: Database record created despite missing mandatory consent!",
      )
    }

    console.log(
      "✔ SCENARIO 8 PASSED: Missing mandatory consent rejected with HTTP 400 before transaction. Zero database records created.",
    )

    // =========================================================================
    // SCENARIO 9: FALSE MANDATORY CONSENT
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("SCENARIO 9: False Mandatory Consent (Rule M, Q)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture9 = generateUniqueTestData()
    // Set TERMS_AND_PRIVACY to false
    const falseConsents = fixture9.allConsents.map((c) =>
      c.consentType === ConsentType.TERMS_AND_PRIVACY
        ? { ...c, accepted: false }
        : c,
    )

    const falseConsentPayload = {
      ...fixture9.validPayload,
      consents: falseConsents,
    }

    const res9 = await postJson(
      testPort,
      "/api/patients/register",
      falseConsentPayload,
    )
    console.log("HTTP Status:", res9.status)
    console.log("Response Body:", JSON.stringify(res9.body, null, 2))

    if (res9.status !== 400 || res9.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Scenario 9 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res9.status}`,
      )
    }

    const hasFalseConsentMsg = res9.body.errors?.some(
      (e: any) =>
        e.message.includes("TERMS_AND_PRIVACY") &&
        e.message.includes("explicitly accepted"),
    )
    if (!hasFalseConsentMsg) {
      throw new Error(
        "Scenario 9 Failed: False TERMS_AND_PRIVACY acceptance not specifically flagged.",
      )
    }

    const checkUser9 = await prisma.user.findUnique({
      where: { email: fixture9.email },
    })
    if (checkUser9) {
      throw new Error(
        "Scenario 9 Failed: Database record created despite false mandatory consent!",
      )
    }

    console.log(
      "✔ SCENARIO 9 PASSED: Unaccepted mandatory consent rejected with HTTP 400 before transaction. Zero database records created.",
    )

    // =========================================================================
    // SCENARIO 10: FAILURE WHILE CREATING A RELATED RECORD (TRANSACTION ROLLBACK)
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 10: Failure While Creating a Related Database Record (Rule H, I Rollback)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture10 = generateUniqueTestData()
    const countBeforeRollback = {
      users: await prisma.user.count(),
      addresses: await prisma.address.count(),
      emergencyContacts: await prisma.emergencyContact.count(),
      healthProfiles: await prisma.healthProfile.count(),
      patientCategoryRecords: await prisma.patientCategoryRecord.count(),
      consentRecords: await prisma.consentRecord.count(),
    }

    let rollbackErrorCaught = false
    try {
      const parsedFixture10 = patientRegistrationSchema.parse(
        fixture10.validPayload,
      )
      // Injects failure after user & address creation to verify atomicity rollback
      await registerPatient(parsedFixture10, {
        injectSimulatedErrorAfterStep: "address",
      })
    } catch (err: any) {
      rollbackErrorCaught = true
      console.log(
        "Successfully intercepted simulated transaction failure:",
        err.message,
      )
    }

    if (!rollbackErrorCaught) {
      throw new Error(
        "Scenario 10 Failed: Expected simulated transaction error was not thrown!",
      )
    }

    const countAfterRollback = {
      users: await prisma.user.count(),
      addresses: await prisma.address.count(),
      emergencyContacts: await prisma.emergencyContact.count(),
      healthProfiles: await prisma.healthProfile.count(),
      patientCategoryRecords: await prisma.patientCategoryRecord.count(),
      consentRecords: await prisma.consentRecord.count(),
    }

    // Assert that EVERY table rolled back to its exact pre-transaction count
    if (
      countBeforeRollback.users !== countAfterRollback.users ||
      countBeforeRollback.addresses !== countAfterRollback.addresses ||
      countBeforeRollback.emergencyContacts !==
        countAfterRollback.emergencyContacts ||
      countBeforeRollback.healthProfiles !==
        countAfterRollback.healthProfiles ||
      countBeforeRollback.patientCategoryRecords !==
        countAfterRollback.patientCategoryRecords ||
      countBeforeRollback.consentRecords !== countAfterRollback.consentRecords
    ) {
      throw new Error(
        "DATABASE CORRUPTION: Transaction failed to roll back partial records!",
      )
    }

    // Specifically verify fixture10's user was NOT left in the database
    const orphanUser10 = await prisma.user.findUnique({
      where: { email: fixture10.email },
    })
    if (orphanUser10) {
      throw new Error(
        "Scenario 10 Failed: Orphan User record found in database after aborted transaction!",
      )
    }

    console.log(
      "✔ SCENARIO 10 PASSED: Prisma transaction rolled back completely upon failure. ZERO partial records left in database.",
    )

    // =========================================================================
    // SCENARIO 11: REPEATED SUBMISSION OF THE SAME REQUEST
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 11: Repeated Submission of the Same Request (Rule V Prevention)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture11 = generateUniqueTestData()
    createdTestEmails.push(fixture11.email)

    // First submission -> Succeeds (201)
    const res11_first = await postJson(
      testPort,
      "/api/patients/register",
      fixture11.validPayload,
    )
    if (res11_first.status !== 201) {
      throw new Error(
        `Scenario 11 Failed: Initial submission failed with status ${res11_first.status}`,
      )
    }

    // Immediate second submission of identical payload -> Conflict (409)
    const res11_second = await postJson(
      testPort,
      "/api/patients/register",
      fixture11.validPayload,
    )
    console.log("Repeated Submission HTTP Status:", res11_second.status)
    console.log("Response Body:", JSON.stringify(res11_second.body, null, 2))

    if (
      res11_second.status !== 409 ||
      res11_second.body.code !== ErrorCode.RESOURCE_CONFLICT
    ) {
      throw new Error(
        `Scenario 11 Failed: Expected HTTP 409 RESOURCE_CONFLICT on replay, got ${res11_second.status}`,
      )
    }

    // Confirm database has exactly 1 account
    const registeredCount11 = await prisma.user.count({
      where: { email: fixture11.email },
    })
    if (registeredCount11 !== 1) {
      throw new Error(
        `Scenario 11 Failed: Expected exactly 1 user account, found ${registeredCount11}`,
      )
    }

    console.log(
      "✔ SCENARIO 11 PASSED: Repeated submission cleanly rejected with HTTP 409 RESOURCE_CONFLICT. Exactly one account created.",
    )

    // =========================================================================
    // SCENARIO 12: ATTEMPT TO SUBMIT PASSWORDHASH OR SERVER-CONTROLLED PROPERTIES
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "SCENARIO 12: Attempt to Submit passwordHash or Server-Controlled Properties (Rule F, J)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const fixture12 = generateUniqueTestData()
    const maliciousPayload = {
      ...fixture12.validPayload,
      account: {
        ...fixture12.validPayload.account,
        passwordHash: "$2b$12$maliciouslyPrecomputedHashValue1234567890",
        userId: "hacked-uuid-admin-privilege-escalation",
        role: "ADMIN",
        verificationStatus: "VERIFIED",
        isVerified: true,
      },
      isAdmin: true,
    }

    const res12 = await postJson(
      testPort,
      "/api/patients/register",
      maliciousPayload,
    )
    console.log("HTTP Status:", res12.status)
    console.log("Response Body:", JSON.stringify(res12.body, null, 2))

    if (
      res12.status !== 400 ||
      res12.body.code !== ErrorCode.VALIDATION_ERROR
    ) {
      throw new Error(
        `Scenario 12 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res12.status}`,
      )
    }

    const hasUnrecognizedMsg = res12.body.errors?.some(
      (e: any) =>
        e.message.includes("server-controlled") ||
        e.code === "unrecognized_keys",
    )
    if (!hasUnrecognizedMsg) {
      throw new Error(
        "Scenario 12 Failed: Injected passwordHash / server properties not flagged.",
      )
    }

    const checkUser12 = await prisma.user.findUnique({
      where: { email: fixture12.email },
    })
    if (checkUser12) {
      throw new Error(
        "Scenario 12 Failed: User created despite submitting forbidden server-controlled properties!",
      )
    }

    console.log(
      "✔ SCENARIO 12 PASSED: Attempt to inject passwordHash and server-controlled properties strictly rejected with HTTP 400.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 12 PATIENT REGISTRATION SCENARIOS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Clean up created test users from PostgreSQL
    console.log("\n[Cleanup] Removing isolated test users from database...")
    if (createdTestEmails.length > 0) {
      const deleted = await prisma.user.deleteMany({
        where: { email: { in: createdTestEmails } },
      })
      console.log(
        `[Cleanup] Deleted ${deleted.count} test users (cascaded to all child tables).`,
      )
    }

    await new Promise<void>((resolve) => {
      server.close(async () => {
        await prisma.$disconnect()
        resolve()
      })
    })
  }
}

runPatientRegistrationTests().catch((err) => {
  console.error("Patient Registration Test Suite Failed:", err)
  process.exit(1)
})
