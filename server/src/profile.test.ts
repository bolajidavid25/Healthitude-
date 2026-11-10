import http from "http"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { ErrorCode } from "./errors/AppError"
import { registerPatient } from "./services/patientRegistrationService"
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  generateSessionToken,
  hashSessionToken,
} from "./utils/session"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
  CategoryVerificationStatus,
} from "./generated/prisma/enums"

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
  setCookies: Record<string, { value: string; flags: string[] }>
}

async function request(
  port: number,
  options: {
    path: string
    method: string
    headers?: Record<string, string>
    body?: any
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const postData =
      options.body !== undefined ? JSON.stringify(options.body) : undefined
    const headers: Record<string, any> = {
      ...options.headers,
    }

    if (postData !== undefined) {
      headers["Content-Type"] = "application/json"
      headers["Content-Length"] = Buffer.byteLength(postData)
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: options.path,
        method: options.method,
        headers,
      },
      (res) => {
        let rawData = ""
        res.on("data", (chunk) => (rawData += chunk))
        res.on("end", () => {
          let parsedBody
          try {
            parsedBody = JSON.parse(rawData)
          } catch {
            parsedBody = rawData
          }

          const rawCookies = res.headers["set-cookie"] || []
          const setCookies: Record<string, { value: string; flags: string[] }> =
            {}
          for (const cStr of rawCookies) {
            const parts = cStr.split(";").map((p) => p.trim())
            const [cName, cVal] = parts[0].split("=")
            setCookies[cName] = {
              value: cVal,
              flags: parts.slice(1),
            }
          }

          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
            setCookies,
          })
        })
      },
    )

    req.on("error", reject)
    if (postData) req.write(postData)
    req.end()
  })
}

/**
 * Creates an active database session for a user and returns session cookie + csrf token
 */
async function createTestSession(
  userId: string,
): Promise<{ sessionCookie: string; csrfToken: string }> {
  const rawSessionToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawSessionToken)
  const csrfToken = "test-csrf-token-" + Math.random().toString(36).substring(2)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const sessionCookie = `${SESSION_COOKIE_NAME}=${rawSessionToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`
  return { sessionCookie, csrfToken }
}

async function runProfileTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: PATIENT PROFILE, ONBOARDING STATUS & CONSENT TEST SUITE",
  )
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5198
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)

  // Test users tracked for cleanup
  const createdUserIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // Setup: Create Patient A (Fully Onboarded)
    // -------------------------------------------------------------------------
    const nonceA = Date.now().toString().slice(-6)
    const emailA = `patient.a.${nonceA}@example.com`
    const phoneA = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`\n[Setup] Registering primary test Patient A (${emailA})...`)
    const regResultA = await registerPatient({
      account: {
        firstName: "Kwame",
        middleName: "Kofi",
        lastName: "Appiah",
        dateOfBirth: new Date("1992-05-15"),
        sex: Sex.MALE,
        email: emailA,
        phoneNumber: phoneA,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        profilePhoto: undefined,
      },
      contact: {
        street: "12 Independence Ave",
        city: "Accra",
        state: "Greater Accra",
        district: "Ayawaso West",
        emergencyContact: {
          fullName: "Akosua Appiah",
          relationship: Relationship.SIBLING,
          phoneNumber: "+233201112233",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.O_POSITIVE,
        genotype: Genotype.AA,
        knownAllergies: "Penicillin",
        medicalConditions: "Mild asthma",
        currentMedications: "Salbutamol inhaler as needed",
        previousSurgeries: undefined,
        medicalHistory: undefined,
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: "GH-NHIS-20240088341",
        nhisSchemeType: "NHIS",
        supportingDocument: "https://documents.example.com/nhis-card.jpg",
      },
      consents: {
        consents: [
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
          {
            consentType: ConsentType.AI_LIMITATIONS,
            accepted: true,
            version: "1.0",
          },
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
        ],
      },
    })

    const patientAId = regResultA.user.id
    createdUserIds.push(patientAId)
    const sessionA = await createTestSession(patientAId)

    // Setup: Create Patient B (Different User)
    const nonceB = (Date.now() + 1).toString().slice(-6)
    const emailB = `patient.b.${nonceB}@example.com`
    const phoneB = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`[Setup] Registering secondary test Patient B (${emailB})...`)
    const regResultB = await registerPatient({
      account: {
        firstName: "Abena",
        lastName: "Osei",
        dateOfBirth: new Date("1996-08-20"),
        sex: Sex.FEMALE,
        email: emailB,
        phoneNumber: phoneB,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        profilePhoto: undefined,
      },
      contact: {
        street: "8 Castle Road",
        city: "Cape Coast",
        state: "Central",
        district: undefined,
        emergencyContact: {
          fullName: "Yaw Osei",
          relationship: Relationship.PARENT,
          phoneNumber: "+233249998877",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.A_POSITIVE,
        genotype: Genotype.AS,
        knownAllergies: undefined,
        medicalConditions: undefined,
        currentMedications: undefined,
        previousSurgeries: undefined,
        medicalHistory: undefined,
      },
      patientCategory: {
        category: PatientCategory.STUDENT,
        nhisId: undefined,
        nhisSchemeType: undefined,
        supportingDocument: undefined,
      },
      consents: {
        consents: [
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
          {
            consentType: ConsentType.AI_LIMITATIONS,
            accepted: true,
            version: "1.0",
          },
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
        ],
      },
    })

    const patientBId = regResultB.user.id
    createdUserIds.push(patientBId)

    // -------------------------------------------------------------------------
    // CHECK 1: An Authenticated Patient Can Retrieve Their Own Profile
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 1: Authenticated Patient Retrieves Own Profile (Rule B, C, D, L)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const getProfileRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    if (getProfileRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 but received ${getProfileRes.status}: ${JSON.stringify(getProfileRes.body)}`,
      )
    }

    const profileData = getProfileRes.body.data
    if (profileData.user.id !== patientAId) {
      throw new Error(
        `Expected profile user.id to be ${patientAId}, got ${profileData.user.id}`,
      )
    }
    if (profileData.user.email !== emailA) {
      throw new Error(`Expected email ${emailA}, got ${profileData.user.email}`)
    }
    if ("passwordHash" in profileData.user) {
      throw new Error(
        "SECURITY VIOLATION: passwordHash was exposed in profile response!",
      )
    }
    if (
      !profileData.address ||
      profileData.address.street !== "12 Independence Ave"
    ) {
      throw new Error("Address data missing or incorrect in profile response")
    }
    if (
      !profileData.emergencyContact ||
      profileData.emergencyContact.fullName !== "Akosua Appiah"
    ) {
      throw new Error(
        "Emergency contact data missing or incorrect in profile response",
      )
    }
    if (
      !profileData.healthProfile ||
      profileData.healthProfile.knownAllergies !== "Penicillin"
    ) {
      throw new Error(
        "Health profile data missing or incorrect in profile response",
      )
    }
    if (
      !profileData.patientCategory ||
      profileData.patientCategory.category !== PatientCategory.NHIS_USER
    ) {
      throw new Error(
        "Patient category data missing or incorrect in profile response",
      )
    }
    if (
      !Array.isArray(profileData.consents) ||
      profileData.consents.length < 7
    ) {
      throw new Error(
        `Expected at least 7 consents, got ${profileData.consents?.length}`,
      )
    }

    console.log("Status Code: 200")
    console.log(
      "Profile User:",
      profileData.user.firstName,
      profileData.user.lastName,
      `(${profileData.user.email})`,
    )
    console.log(
      "Address:",
      profileData.address.street,
      profileData.address.city,
    )
    console.log(
      "Health Profile:",
      `allergies="${profileData.healthProfile.knownAllergies}", clinicallyVerified=${profileData.healthProfile.clinicallyVerified}`,
    )
    console.log("Consents Count:", profileData.consents.length)
    console.log(
      "✔ CHECK 1 PASSED: Authenticated patient successfully retrieved own sanitized profile without passwordHash.",
    )

    // -------------------------------------------------------------------------
    // CHECK 2: Patient Cannot Retrieve Another Patient's Profile Without Authorization
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 2: IDOR Defense - Reject Unauthorized Access to Another Patient's Profile (Rule C)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 2.1 Patient A tries to access Patient B's profile
    const idorRes = await request(testPort, {
      path: `/api/patient/${patientBId}/profile`,
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    console.log(`Patient A accessing Patient B ID Status: ${idorRes.status}`)
    console.log("Response Body:", JSON.stringify(idorRes.body, null, 2))

    if (idorRes.status !== 403) {
      throw new Error(
        `Expected HTTP 403 Forbidden for IDOR attempt, got ${idorRes.status}`,
      )
    }
    if (idorRes.body.code !== ErrorCode.FORBIDDEN) {
      throw new Error(`Expected error code FORBIDDEN, got ${idorRes.body.code}`)
    }

    // 2.2 Patient A accessing own profile by explicit ID succeeds
    const selfIdRes = await request(testPort, {
      path: `/api/patient/${patientAId}/profile`,
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    if (selfIdRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 when accessing own profile by ID, got ${selfIdRes.status}`,
      )
    }

    console.log("Patient A accessing own ID Status: 200")
    console.log(
      "✔ CHECK 2 PASSED: Cross-patient IDOR blocked with HTTP 403 FORBIDDEN. Own profile accessible.",
    )

    // -------------------------------------------------------------------------
    // CHECK 3: A Patient Can Update Permitted Fields in Their Profile
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 3: Patient Updates Permitted Fields (Rule E, F, R)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const updatePayload = {
      address: {
        street: "77 Ring Road Central",
        city: "Kumasi",
        state: "Ashanti",
        district: "Subin",
      },
      emergencyContact: {
        fullName: "Akosua Appiah-Danquah",
        relationship: Relationship.SPOUSE_PARTNER,
        phoneNumber: "0245556677",
      },
    }

    const updateRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: updatePayload,
    })

    console.log(`Update Status Code: ${updateRes.status}`)
    console.log("Response Message:", updateRes.body.message)

    if (updateRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for permitted profile update, got ${updateRes.status}: ${JSON.stringify(updateRes.body)}`,
      )
    }

    const updatedData = updateRes.body.data
    if (
      updatedData.address.street !== "77 Ring Road Central" ||
      updatedData.address.city !== "Kumasi"
    ) {
      throw new Error("Address fields were not updated correctly")
    }
    if (
      updatedData.emergencyContact.fullName !== "Akosua Appiah-Danquah" ||
      updatedData.emergencyContact.phoneNumber !== "+233245556677"
    ) {
      throw new Error(
        "Emergency contact fields were not updated or normalized correctly",
      )
    }

    // Verify in database directly
    const dbAddress = await prisma.address.findUnique({
      where: { userId: patientAId },
    })
    if (dbAddress?.street !== "77 Ring Road Central") {
      throw new Error("Database address does not match update")
    }

    console.log(
      "✔ CHECK 3 PASSED: Permitted address and emergency contact fields successfully updated and persisted.",
    )

    // -------------------------------------------------------------------------
    // CHECK 4: Updates With Invalid Values Are Rejected With Validation Errors
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 4: Invalid Update Values Rejected With Validation Errors (Rule E, S)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const invalidPayload = {
      identity: {
        phoneNumber: "123-bad-phone-number",
      },
    }

    const invalidRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: invalidPayload,
    })

    console.log(`Invalid Update Status: ${invalidRes.status}`)
    console.log(
      "Invalid Update Response:",
      JSON.stringify(invalidRes.body, null, 2),
    )

    if (invalidRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for invalid phone number, got ${invalidRes.status}`,
      )
    }
    if (invalidRes.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        `Expected error code VALIDATION_ERROR, got ${invalidRes.body.code}`,
      )
    }
    if (
      !Array.isArray(invalidRes.body.errors) ||
      invalidRes.body.errors.length === 0
    ) {
      throw new Error(
        "Expected structured validation errors in response envelope",
      )
    }

    console.log(
      "✔ CHECK 4 PASSED: Malformed input properly rejected with HTTP 400 VALIDATION_ERROR.",
    )

    // -------------------------------------------------------------------------
    // CHECK 5: Attempts to Modify Server-Controlled Verification Fields Fail or Are Ignored
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 5: Modification of Server-Controlled Verification Fields Blocked (Rule G, H, J)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 5.1 Patient attempts to send clinicallyVerified in healthProfile
    const tamperHealthPayload = {
      healthProfile: {
        clinicallyVerified: true,
      },
    }

    const tamperHealthRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: tamperHealthPayload,
    })

    console.log(`Tamper clinicallyVerified Status: ${tamperHealthRes.status}`)
    console.log(
      "Tamper clinicallyVerified Response:",
      JSON.stringify(tamperHealthRes.body, null, 2),
    )

    if (tamperHealthRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 when sending unpermitted field clinicallyVerified, got ${tamperHealthRes.status}`,
      )
    }

    // 5.2 Patient attempts to send verificationStatus in patientCategory
    const tamperCategoryPayload = {
      patientCategory: {
        verificationStatus: "VERIFIED",
      },
    }

    const tamperCatRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: tamperCategoryPayload,
    })

    console.log(`Tamper verificationStatus Status: ${tamperCatRes.status}`)
    console.log(
      "Tamper verificationStatus Response:",
      JSON.stringify(tamperCatRes.body, null, 2),
    )

    if (tamperCatRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 when sending unpermitted field verificationStatus, got ${tamperCatRes.status}`,
      )
    }

    console.log(
      "✔ CHECK 5 PASSED: Direct client tampering with server-controlled verification fields strictly blocked by schema.",
    )

    // -------------------------------------------------------------------------
    // CHECK 6: Onboarding-Status Correctly Reports isComplete = true When Complete
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 6: Onboarding-Status Reports isComplete = true For Fully Onboarded Patient (Rule N, Q)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const statusCompleteRes = await request(testPort, {
      path: "/api/patient/onboarding-status",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    console.log(`Status Code: ${statusCompleteRes.status}`)
    console.log(
      "Status Data:",
      JSON.stringify(statusCompleteRes.body.data, null, 2),
    )

    if (statusCompleteRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for onboarding status, got ${statusCompleteRes.status}`,
      )
    }

    const completeData = statusCompleteRes.body.data
    if (completeData.isComplete !== true || completeData.canProceed !== true) {
      throw new Error(
        `Expected isComplete: true and canProceed: true, got ${completeData.isComplete}`,
      )
    }
    if (completeData.completedStages.length !== 5) {
      throw new Error(
        `Expected 5 completed stages, got ${completeData.completedStages.length}`,
      )
    }
    if (completeData.pendingStages.length !== 0) {
      throw new Error(
        `Expected 0 pending stages, got ${completeData.pendingStages.length}`,
      )
    }
    if (completeData.missingRequiredFields.length !== 0) {
      throw new Error(
        `Expected 0 missing required fields, got ${JSON.stringify(completeData.missingRequiredFields)}`,
      )
    }
    if (completeData.missingMandatoryConsents.length !== 0) {
      throw new Error(
        `Expected 0 missing mandatory consents, got ${JSON.stringify(completeData.missingMandatoryConsents)}`,
      )
    }

    console.log(
      "✔ CHECK 6 PASSED: Fully onboarded patient correctly returns isComplete = true, canProceed = true, 5 completed stages.",
    )

    // -------------------------------------------------------------------------
    // CHECK 7: Onboarding-Status Correctly Identifies Missing Fields/Consents
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 7: Onboarding-Status Identifies Incomplete Stages & Missing Items (Rule N, O, Q)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Create an incomplete patient: only User account created in db (no address, no emergency contact, no consents)
    const nonceInc = (Date.now() + 2).toString().slice(-6)
    const emailInc = `patient.incomplete.${nonceInc}@example.com`
    const phoneInc = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    const incompleteUser = await prisma.user.create({
      data: {
        firstName: "Kojo",
        lastName: "Antwi",
        email: emailInc,
        phoneNumber: phoneInc,
        dateOfBirth: new Date("1998-03-25"),
        sex: Sex.MALE,
        passwordHash: "$2a$12$eXampleHashedPasswordForTestOnly",
      },
    })
    createdUserIds.push(incompleteUser.id)
    const sessionInc = await createTestSession(incompleteUser.id)

    const statusIncompleteRes = await request(testPort, {
      path: "/api/patient/onboarding-status",
      method: "GET",
      headers: {
        Cookie: sessionInc.sessionCookie,
      },
    })

    console.log(`Incomplete Status Code: ${statusIncompleteRes.status}`)
    console.log(
      "Incomplete Status Data:",
      JSON.stringify(statusIncompleteRes.body.data, null, 2),
    )

    if (statusIncompleteRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for incomplete onboarding status, got ${statusIncompleteRes.status}`,
      )
    }

    const incData = statusIncompleteRes.body.data
    if (incData.isComplete !== false || incData.canProceed !== false) {
      throw new Error(
        `Expected isComplete: false and canProceed: false for incomplete account, got ${incData.isComplete}`,
      )
    }
    if (!incData.completedStages.includes("identity")) {
      throw new Error(
        "Identity stage should be marked complete since basic user identity exists",
      )
    }
    if (incData.pendingStages.length < 4) {
      throw new Error(
        `Expected at least 4 pending stages, got ${incData.pendingStages.length}`,
      )
    }
    if (incData.missingMandatoryConsents.length !== 7) {
      throw new Error(
        `Expected all 7 mandatory consents missing, got ${incData.missingMandatoryConsents.length}`,
      )
    }

    console.log(
      "✔ CHECK 7 PASSED: Incomplete patient correctly reports isComplete = false, identifies pending stages, missing fields and consents.",
    )

    // -------------------------------------------------------------------------
    // CHECK 8: Category Verification Status Remains PENDING
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 8: Category Verification Status Remains PENDING on Update (Rule G, J)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 8.1 Retrieve initial category status
    const initialCatRes = await request(testPort, {
      path: "/api/patient/category-status",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    if (initialCatRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 from category-status, got ${initialCatRes.status}`,
      )
    }
    if (
      initialCatRes.body.data.verificationStatus !==
      CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        `Expected PENDING status, got ${initialCatRes.body.data.verificationStatus}`,
      )
    }

    console.log(
      "Initial Category Status:",
      initialCatRes.body.data.category,
      "->",
      initialCatRes.body.data.verificationStatus,
    )

    // 8.2 Patient updates category
    const catUpdateRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        patientCategory: {
          category: PatientCategory.STUDENT,
          supportingDocument: "https://documents.example.com/student-id.pdf",
        },
      },
    })

    if (catUpdateRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for category update, got ${catUpdateRes.status}: ${JSON.stringify(catUpdateRes.body)}`,
      )
    }

    // 8.3 Verify category status is still PENDING
    const postUpdateCatRes = await request(testPort, {
      path: "/api/patient/category-status",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    console.log(
      "Post-Update Category Status:",
      postUpdateCatRes.body.data.category,
      "->",
      postUpdateCatRes.body.data.verificationStatus,
    )
    if (postUpdateCatRes.body.data.category !== PatientCategory.STUDENT) {
      throw new Error(
        `Expected category STUDENT, got ${postUpdateCatRes.body.data.category}`,
      )
    }
    if (
      postUpdateCatRes.body.data.verificationStatus !==
      CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        `Expected verificationStatus PENDING, got ${postUpdateCatRes.body.data.verificationStatus}`,
      )
    }

    console.log(
      "✔ CHECK 8 PASSED: Category update persisted with verificationStatus strictly preserved as PENDING.",
    )

    // -------------------------------------------------------------------------
    // CHECK 9: Record New Consent Version Without Destroying Previous Record
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 9: Record New Consent Version as Distinct Event (Rule K, M)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const newConsentRes = await request(testPort, {
      path: "/api/patient/consents",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        consentType: ConsentType.TERMS_AND_PRIVACY,
        accepted: true,
        version: "2.0",
      },
    })

    console.log(`New Consent Status Code: ${newConsentRes.status}`)
    console.log(
      "New Consent Response:",
      JSON.stringify(newConsentRes.body, null, 2),
    )

    if (newConsentRes.status !== 201) {
      throw new Error(
        `Expected HTTP 201 for recording consent, got ${newConsentRes.status}`,
      )
    }
    if (newConsentRes.body.data.version !== "2.0") {
      throw new Error(
        `Expected version 2.0, got ${newConsentRes.body.data.version}`,
      )
    }
    if (!newConsentRes.body.data.acceptedAt) {
      throw new Error("Expected server timestamp acceptedAt")
    }

    console.log(
      "✔ CHECK 9 PASSED: New consent version 2.0 recorded with HTTP 201 and server timestamp.",
    )

    // -------------------------------------------------------------------------
    // CHECK 10: Database Inspection Confirms Historical Consent Evidence Is Preserved
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 10: Database Audit Trail Confirms Both v1.0 and v2.0 Records Exist (Rule K)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const allDbConsents = await prisma.consentRecord.findMany({
      where: {
        userId: patientAId,
        consentType: ConsentType.TERMS_AND_PRIVACY,
      },
      orderBy: { version: "asc" },
    })

    console.log(
      `Found ${allDbConsents.length} database records for TERMS_AND_PRIVACY:`,
    )
    for (const c of allDbConsents) {
      console.log(
        `  - Version: ${c.version}, Accepted: ${c.accepted}, AcceptedAt: ${c.acceptedAt?.toISOString()}, CreatedAt: ${c.createdAt.toISOString()}`,
      )
    }

    if (allDbConsents.length < 2) {
      throw new Error(
        `Expected at least 2 records for TERMS_AND_PRIVACY, but found ${allDbConsents.length}`,
      )
    }
    const hasV1 = allDbConsents.some((c) => c.version === "1.0")
    const hasV2 = allDbConsents.some((c) => c.version === "2.0")
    if (!hasV1 || !hasV2) {
      throw new Error(
        "Both version 1.0 and version 2.0 must exist concurrently in database",
      )
    }

    console.log(
      "✔ CHECK 10 PASSED: Historical consent records preserved. Immutable audit trail confirmed in database.",
    )

    // -------------------------------------------------------------------------
    // CHECK 11: Patient-Reported Health Information Stored With clinicallyVerified = false
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 11: Patient-Reported Health Data Remains clinicallyVerified = false (Rule G, H)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const healthUpdateRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        healthProfile: {
          bloodGroup: BloodGroup.B_POSITIVE,
          genotype: Genotype.AS,
          knownAllergies: "Sulfa antibiotics and dust mites",
          medicalConditions: "Controlled hypertension",
          currentMedications: "Amlodipine 5mg daily",
          previousSurgeries: "Appendectomy (2018)",
          medicalHistory: "No prior hospitalizations except surgery",
        },
      },
    })

    if (healthUpdateRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for health profile update, got ${healthUpdateRes.status}`,
      )
    }

    // Inspect database record directly
    const dbHealthProfile = await prisma.healthProfile.findUnique({
      where: { userId: patientAId },
    })

    console.log("Database Health Profile State:")
    console.log("  Blood Group:", dbHealthProfile?.bloodGroup)
    console.log("  Allergies:", dbHealthProfile?.knownAllergies)
    console.log("  patientReported:", dbHealthProfile?.patientReported)
    console.log("  clinicallyVerified:", dbHealthProfile?.clinicallyVerified)
    console.log("  verifiedAt:", dbHealthProfile?.verifiedAt)

    if (dbHealthProfile?.clinicallyVerified !== false) {
      throw new Error(
        `Expected clinicallyVerified: false, got ${dbHealthProfile?.clinicallyVerified}`,
      )
    }
    if (dbHealthProfile?.patientReported !== true) {
      throw new Error(
        `Expected patientReported: true, got ${dbHealthProfile?.patientReported}`,
      )
    }
    if (dbHealthProfile?.verifiedAt !== null) {
      throw new Error(
        `Expected verifiedAt: null, got ${dbHealthProfile?.verifiedAt}`,
      )
    }

    console.log(
      "✔ CHECK 11 PASSED: Patient updates to health profile strictly maintain patientReported = true and clinicallyVerified = false.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 11 PATIENT PROFILE, ONBOARDING & CONSENT CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Teardown test server
    server.close()

    // Clean up created test users and related records
    console.log("\n[Cleanup] Cleaning up test users and related records...")
    for (const uId of createdUserIds) {
      try {
        await prisma.user.delete({ where: { id: uId } })
      } catch (err) {
        // Ignore deletion errors on teardown
      }
    }
    console.log(
      `[Cleanup] Completed cleanup of ${createdUserIds.length} test users.`,
    )
  }
}

runProfileTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:", err)
  process.exit(1)
})
