import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import {
  generateSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "./utils/session"
import { Sex, PatientCategory } from "./generated/prisma/enums"
import http from "http"

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
}

async function request(
  port: number,
  path: string,
  method = "GET",
  headers: Record<string, string> = {},
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsedBody
          try {
            parsedBody = JSON.parse(data)
          } catch {
            parsedBody = data
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
          })
        })
      },
    )
    req.on("error", reject)
    req.end()
  })
}

async function runDashboardTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: PATIENT DASHBOARD OVERVIEW BACKEND INTEGRATION TESTS",
  )
  console.log(
    "================================================================================",
  )

  const testPort = 5062
  const app = createApp()
  const server = app.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  let testUserId = ""
  let sessionToken = ""

  try {
    // -------------------------------------------------------------------------
    // Setup: Create a registered test patient
    // -------------------------------------------------------------------------
    const nonce = Date.now().toString().slice(-6)
    const regResult = await registerPatient({
      account: {
        firstName: "Kwabena",
        middleName: "Kofi",
        lastName: "Asante",
        email: `dashboard.test.${nonce}@example.com`,
        phoneNumber: `020${nonce}`,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        dateOfBirth: new Date("1992-05-14"),
        sex: Sex.MALE,
      },
      contact: {
        street: "45 Ring Road Central",
        city: "Accra",
        state: "Greater Accra",
        district: "Accra Metro",
        emergencyContact: {
          fullName: "Akua Asante",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "0240001122",
        },
      },
      healthProfile: {
        bloodGroup: "O_POSITIVE",
        genotype: "AA",
        knownAllergies: "None",
        medicalConditions: "None",
        currentMedications: "Paracetamol 500mg, Multivitamins Daily",
        previousSurgeries: "None",
        medicalHistory: "None",
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: `GH-NHIS-${nonce}`,
        nhisSchemeType: "Standard NHIS",
        supportingDocument: "nhis-doc.pdf",
      },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "v1.0" },
          {
            consentType: "HEALTH_DATA_PROCESSING",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PROFESSIONAL_ACCESS",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PATIENT_DATA_ACKNOWLEDGEMENT",
            accepted: true,
            version: "v1.0",
          },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "v1.0" },
          {
            consentType: "BREAK_GLASS_DISCLOSURE",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "INFORMATION_ACCURACY",
            accepted: true,
            version: "v1.0",
          },
        ],
      },
    })

    testUserId = regResult.user.id

    // Create active session in database
    sessionToken = generateSessionToken()
    const tokenHash = hashSessionToken(sessionToken)
    await prisma.session.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    console.log(
      `[Setup] Created test patient ${testUserId} with active session`,
    )

    // -------------------------------------------------------------------------
    // Check 1: Authentication Required (401 on unauthenticated request)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Unauthenticated Dashboard Access Rejection ---")
    const unauthRes = await request(testPort, "/api/patient/dashboard")
    if (
      unauthRes.status !== 401 ||
      unauthRes.body.code !== "AUTHENTICATION_REQUIRED"
    ) {
      throw new Error(
        `Expected 401 AUTHENTICATION_REQUIRED, got ${unauthRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Unauthenticated request rejected with HTTP 401 AUTHENTICATION_REQUIRED",
    )

    // -------------------------------------------------------------------------
    // Check 2: Authenticated Dashboard Retrieval
    // -------------------------------------------------------------------------
    console.log("\n--- Check 2: Authenticated Dashboard Query ---")
    const authRes = await request(testPort, "/api/patient/dashboard", "GET", {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    })

    if (authRes.status !== 200 || authRes.body.status !== "success") {
      throw new Error(
        `Expected 200 success, got ${authRes.status}: ${JSON.stringify(authRes.body)}`,
      )
    }

    const d = authRes.body.data
    if (
      d.user.id !== testUserId ||
      d.user.firstName !== "Kwabena" ||
      d.user.lastName !== "Asante"
    ) {
      throw new Error("Returned user data does not match authenticated patient")
    }
    console.log(
      "[PASS] Check 2: Authoritative user identity verified in dashboard payload",
    )

    // -------------------------------------------------------------------------
    // Check 3: Authoritative Billing Category Data
    // -------------------------------------------------------------------------
    console.log("\n--- Check 3: Billing Category Resolution ---")
    if (
      d.metrics.category.code !== "NHIS_USER" ||
      d.metrics.category.verificationStatus !== "PENDING"
    ) {
      throw new Error(
        `Expected NHIS_USER / PENDING, got ${d.metrics.category.code} / ${d.metrics.category.verificationStatus}`,
      )
    }
    if (d.metrics.category.label !== "NHIS User") {
      throw new Error(
        `Expected category label 'NHIS User', got '${d.metrics.category.label}'`,
      )
    }
    console.log(
      `[PASS] Check 3: Category correctly correlated: ${d.metrics.category.label} (${d.metrics.category.verificationStatus})`,
    )

    // -------------------------------------------------------------------------
    // Check 4: Medication Parsing from HealthProfile
    // -------------------------------------------------------------------------
    console.log("\n--- Check 4: Medication Parsing ---")
    if (d.metrics.medicationsCount !== 2) {
      throw new Error(
        `Expected medicationsCount = 2, got ${d.metrics.medicationsCount}`,
      )
    }
    if (!d.metrics.medicationsSummary.includes("2 reported medications")) {
      throw new Error(
        `Expected '2 reported medications', got '${d.metrics.medicationsSummary}'`,
      )
    }
    console.log(
      `[PASS] Check 4: Correctly parsed reported medications: ${d.metrics.medicationsSummary}`,
    )

    // -------------------------------------------------------------------------
    // Check 5: Clean Empty States for Phase 2/3 Entities
    // -------------------------------------------------------------------------
    console.log("\n--- Check 5: Clean Empty States ---")
    if (
      d.metrics.activeComplaintsCount !== 0 ||
      d.metrics.underReviewComplaintsCount !== 0
    ) {
      throw new Error(
        "Active complaints should be 0 for newly registered patient",
      )
    }
    if (d.metrics.nextAppointment !== null) {
      throw new Error("nextAppointment should be null when none scheduled")
    }
    if (!Array.isArray(d.vitals.items) || d.vitals.items.length !== 0) {
      throw new Error(
        "vitals.items should be empty array for newly registered patient",
      )
    }
    if (d.vitals.clinicallyVerified !== false) {
      throw new Error(
        "clinicallyVerified should be false before clinical review",
      )
    }
    if (!Array.isArray(d.careTeam) || d.careTeam.length !== 0) {
      throw new Error(
        "careTeam should be empty array before provider assignment",
      )
    }
    console.log(
      "[PASS] Check 5: Clean empty states verified (0 complaints, null appointment, empty vitals/careTeam)",
    )

    // -------------------------------------------------------------------------
    // Check 6: IDOR Protection on :userId/dashboard
    // -------------------------------------------------------------------------
    console.log("\n--- Check 6: IDOR Defense ---")
    const rogueRes = await request(
      testPort,
      "/api/patient/00000000-0000-0000-0000-000000000099/dashboard",
      "GET",
      {
        Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    )
    if (rogueRes.status !== 403 || rogueRes.body.code !== "FORBIDDEN") {
      throw new Error(
        `Expected 403 FORBIDDEN on foreign patient ID, got ${rogueRes.status}`,
      )
    }

    const selfRes = await request(
      testPort,
      `/api/patient/${testUserId}/dashboard`,
      "GET",
      {
        Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    )
    if (selfRes.status !== 200 || selfRes.body.data.user.id !== testUserId) {
      throw new Error(`Expected 200 on own patient ID, got ${selfRes.status}`)
    }
    console.log(
      "[PASS] Check 6: Cross-patient IDOR strictly blocked with HTTP 403 FORBIDDEN",
    )

    console.log(
      "================================================================================",
    )
    console.log(
      "ALL 6 PATIENT DASHBOARD BACKEND CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    server.close()
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
      console.log(`[Cleanup] Deleted test user ${testUserId}`)
    }
    await prisma.$disconnect()
  }
}

runDashboardTests().catch((err) => {
  console.error("Dashboard test failed:", err)
  process.exit(1)
})
