import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import {
  generateSessionToken,
  hashSessionToken,
  generateCsrfToken,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "./utils/session"
import {
  Sex,
  PatientCategory,
  CategoryVerificationStatus,
} from "./generated/prisma/enums"
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
  body?: any,
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const reqHeaders: Record<string, string> = {
      ...headers,
    }
    if (payload && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json"
    }
    if (payload) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: reqHeaders,
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
    if (payload) {
      req.write(payload)
    }
    req.end()
  })
}

async function createAuthenticatedSession(userId: string) {
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const csrfToken = generateCsrfToken()
  const cookieHeader = `${SESSION_COOKIE_NAME}=${rawToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`

  return {
    rawToken,
    csrfToken,
    cookieHeader,
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken,
    },
  }
}

async function runPricingTests() {
  console.log("=".repeat(80))
  console.log("HEALTHITUDE: PRICING & COVERAGE BACKEND INTEGRATION TESTS")
  console.log("=".repeat(80))

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const address = server.address() as any
  const port = address.port
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`)

  let patientGeneral: any
  let patientGeneralSession: any
  let patientNhis: any
  let patientNhisSession: any

  try {
    // 1. Setup Patient with GENERAL_PATIENT category
    const emailGeneral = `patient.price.gen.${Date.now()}@example.com`
    const regGen = await registerPatient({
      account: {
        firstName: "Kwabena",
        lastName: "Antwi",
        dateOfBirth: new Date("1990-05-12"),
        sex: Sex.MALE,
        email: emailGeneral,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "45 Liberation Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Yaa Antwi",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "+233240008899",
        },
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
      },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "1.0" },
          {
            consentType: "HEALTH_DATA_PROCESSING",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "PROFESSIONAL_ACCESS",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "PATIENT_DATA_ACKNOWLEDGEMENT",
            accepted: true,
            version: "1.0",
          },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "1.0" },
          {
            consentType: "BREAK_GLASS_DISCLOSURE",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "INFORMATION_ACCURACY",
            accepted: true,
            version: "1.0",
          },
        ],
      },
    })
    patientGeneral = regGen.user
    patientGeneralSession = await createAuthenticatedSession(patientGeneral.id)

    // 2. Setup Patient with NHIS_USER category
    const emailNhis = `patient.price.nhis.${Date.now()}@example.com`
    const regNhis = await registerPatient({
      account: {
        firstName: "Akosua",
        lastName: "Appiah",
        dateOfBirth: new Date("1994-08-20"),
        sex: Sex.FEMALE,
        email: emailNhis,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "18 Ring Road Central",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kwame Appiah",
          relationship: "PARENT",
          phoneNumber: "+233240007788",
        },
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: "GH-NHIS-20240088341",
        nhisSchemeType: "NHIS Standard",
        supportingDocument: "docs/nhis_card_scan.pdf",
      },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "1.0" },
          {
            consentType: "HEALTH_DATA_PROCESSING",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "PROFESSIONAL_ACCESS",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "PATIENT_DATA_ACKNOWLEDGEMENT",
            accepted: true,
            version: "1.0",
          },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "1.0" },
          {
            consentType: "BREAK_GLASS_DISCLOSURE",
            accepted: true,
            version: "1.0",
          },
          {
            consentType: "INFORMATION_ACCURACY",
            accepted: true,
            version: "1.0",
          },
        ],
      },
    })
    patientNhis = regNhis.user
    patientNhisSession = await createAuthenticatedSession(patientNhis.id)

    // -------------------------------------------------------------------------
    // Check 1: Authentication Requirement (401)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Unauthenticated Pricing Request Blocked ---")
    const unauthRes = await request(port, "/api/patient/pricing", "GET", {})
    if (unauthRes.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated request, got ${unauthRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Unauthenticated pricing request rejected with HTTP 401",
    )

    // -------------------------------------------------------------------------
    // Check 2: CSRF Protection on Category Update (403)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 2: Missing CSRF Token on Category Update Blocked ---",
    )
    const noCsrfRes = await request(
      port,
      "/api/patient/category",
      "PATCH",
      {
        Cookie: `${SESSION_COOKIE_NAME}=${patientGeneralSession.rawToken}`,
      },
      { category: "STUDENT" },
    )
    if (noCsrfRes.status !== 403) {
      throw new Error(
        `Expected 403 for missing CSRF token, got ${noCsrfRes.status}`,
      )
    }
    console.log("[PASS] Check 2: Missing CSRF token rejected with HTTP 403")

    // -------------------------------------------------------------------------
    // Check 3: General Patient Pricing Plan Retrieval
    // -------------------------------------------------------------------------
    console.log("\n--- Check 3: Retrieve General Patient Pricing Plan ---")
    const genPriceRes = await request(
      port,
      "/api/patient/pricing",
      "GET",
      patientGeneralSession.headers,
    )
    if (genPriceRes.status !== 200) {
      throw new Error(`Expected 200, got ${genPriceRes.status}`)
    }

    const genData = genPriceRes.body.data
    if (genData.category.code !== "GENERAL") {
      throw new Error(`Expected code GENERAL, got ${genData.category.code}`)
    }
    if (genData.category.name !== "General Patient") {
      throw new Error(
        `Expected name General Patient, got ${genData.category.name}`,
      )
    }
    if (genData.category.rank !== 8) {
      throw new Error(`Expected rank 8, got ${genData.category.rank}`)
    }
    if (genData.plan.name !== "General Patient Pricing Plan") {
      throw new Error(
        `Expected General Patient Pricing Plan, got ${genData.plan.name}`,
      )
    }

    // Verify services
    const genCons = genData.plan.services.find(
      (s: any) => s.service === "General Consultation",
    )
    if (
      !genCons ||
      genCons.standardRate !== 10000 ||
      genCons.patientCopay !== 10000 ||
      genCons.partnerCoverage !== 0
    ) {
      throw new Error(
        `Unexpected General Consultation rates for General Patient: ${JSON.stringify(genCons)}`,
      )
    }
    console.log(
      "[PASS] Check 3: General patient pricing retrieved with 100% patient responsibility",
    )

    // -------------------------------------------------------------------------
    // Check 4: NHIS User Pricing Plan Retrieval
    // -------------------------------------------------------------------------
    console.log("\n--- Check 4: Retrieve NHIS User Pricing Plan ---")
    const nhisPriceRes = await request(
      port,
      "/api/patient/pricing",
      "GET",
      patientNhisSession.headers,
    )
    if (nhisPriceRes.status !== 200) {
      throw new Error(`Expected 200, got ${nhisPriceRes.status}`)
    }

    const nhisData = nhisPriceRes.body.data
    if (nhisData.category.code !== "NHIS") {
      throw new Error(`Expected code NHIS, got ${nhisData.category.code}`)
    }
    if (nhisData.category.name !== "NHIS User") {
      throw new Error(`Expected name NHIS User, got ${nhisData.category.name}`)
    }
    if (nhisData.category.rank !== 6) {
      throw new Error(`Expected rank 6, got ${nhisData.category.rank}`)
    }
    if (!nhisData.category.evidence.includes("GH-NHIS-20240088341")) {
      throw new Error(
        `Expected evidence to include NHIS ID, got ${nhisData.category.evidence}`,
      )
    }

    const nhisCons = nhisData.plan.services.find(
      (s: any) => s.service === "General Consultation",
    )
    if (
      !nhisCons ||
      nhisCons.standardRate !== 10000 ||
      nhisCons.patientCopay !== 2000 ||
      nhisCons.partnerCoverage !== 6500 ||
      nhisCons.healthitudeFee !== 1500
    ) {
      throw new Error(
        `Unexpected General Consultation rates for NHIS: ${JSON.stringify(nhisCons)}`,
      )
    }

    const nhisSpec = nhisData.plan.services.find(
      (s: any) => s.service === "Specialist Consultation",
    )
    if (
      !nhisSpec ||
      nhisSpec.standardRate !== 15000 ||
      nhisSpec.patientCopay !== 3000 ||
      nhisSpec.partnerCoverage !== 9500 ||
      nhisSpec.healthitudeFee !== 2500
    ) {
      throw new Error(
        `Unexpected Specialist Consultation rates for NHIS: ${JSON.stringify(nhisSpec)}`,
      )
    }

    const nhisFollow = nhisData.plan.services.find(
      (s: any) => s.service === "Follow-up Visit",
    )
    if (
      !nhisFollow ||
      nhisFollow.standardRate !== 7000 ||
      nhisFollow.patientCopay !== 1000 ||
      nhisFollow.partnerCoverage !== 4800 ||
      nhisFollow.healthitudeFee !== 1200
    ) {
      throw new Error(
        `Unexpected Follow-up rates for NHIS: ${JSON.stringify(nhisFollow)}`,
      )
    }

    const nhisLab = nhisData.plan.services.find(
      (s: any) => s.service === "Lab Request (standard)",
    )
    if (
      !nhisLab ||
      nhisLab.standardRate !== 5000 ||
      nhisLab.patientCopay !== 500 ||
      nhisLab.partnerCoverage !== 3700 ||
      nhisLab.healthitudeFee !== 800
    ) {
      throw new Error(
        `Unexpected Lab rates for NHIS: ${JSON.stringify(nhisLab)}`,
      )
    }
    console.log(
      "[PASS] Check 4: NHIS user pricing verified with approved copays, subsidies, and fees",
    )

    // -------------------------------------------------------------------------
    // Check 5: Financial Rule Math Verification Across All Services
    // -------------------------------------------------------------------------
    console.log("\n--- Check 5: Financial Rule Math Verification ---")
    const plansRes = await request(
      port,
      "/api/patient/pricing/plans",
      "GET",
      patientGeneralSession.headers,
    )
    if (plansRes.status !== 200) {
      throw new Error(`Expected 200 for plans, got ${plansRes.status}`)
    }

    const allPlans = plansRes.body.data.plans
    for (const [categoryKey, planDef] of Object.entries(allPlans) as any) {
      for (const service of planDef.services) {
        const sum =
          service.patientCopay +
          service.partnerCoverage +
          service.healthitudeFee
        if (sum !== service.standardRate) {
          throw new Error(
            `Financial math mismatch in ${categoryKey} for ${service.service}: ` +
              `${service.patientCopay} + ${service.partnerCoverage} + ${service.healthitudeFee} !== ${service.standardRate} (sum=${sum})`,
          )
        }
      }
    }
    console.log(
      "[PASS] Check 5: Verified patientCopay + partnerCoverage + healthitudeFee === standardRate across all plans",
    )

    // -------------------------------------------------------------------------
    // Check 6: Precedence Order & All Plans Retrieval
    // -------------------------------------------------------------------------
    console.log("\n--- Check 6: Category Precedence Order Verification ---")
    const precedence = plansRes.body.data.categories
    if (precedence.length !== 8) {
      throw new Error(
        `Expected 8 categories in precedence order, got ${precedence.length}`,
      )
    }
    if (precedence[0].code !== "NURSING_MOTHER" || precedence[0].rank !== 1) {
      throw new Error(
        `Expected Rank 1 NURSING_MOTHER, got ${JSON.stringify(precedence[0])}`,
      )
    }
    if (precedence[7].code !== "GENERAL" || precedence[7].rank !== 8) {
      throw new Error(
        `Expected Rank 8 GENERAL, got ${JSON.stringify(precedence[7])}`,
      )
    }
    console.log(
      "[PASS] Check 6: Category precedence order strictly verified (Rank 1 to 8)",
    )

    // -------------------------------------------------------------------------
    // Check 7: Update Category Request & Verification Status Reset
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 7: Patient Requests Category Change to Student ---",
    )
    const updateRes = await request(
      port,
      "/api/patient/category",
      "PATCH",
      patientGeneralSession.headers,
      {
        category: "STUDENT",
        supportingDocument: "docs/student_id.pdf",
      },
    )
    if (updateRes.status !== 200) {
      throw new Error(
        `Expected 200 on category update, got ${updateRes.status}: ${JSON.stringify(updateRes.body)}`,
      )
    }

    const updatedData = updateRes.body.data
    if (updatedData.category.code !== "STUDENT") {
      throw new Error(
        `Expected updated category STUDENT, got ${updatedData.category.code}`,
      )
    }
    if (updatedData.category.rank !== 3) {
      throw new Error(`Expected rank 3, got ${updatedData.category.rank}`)
    }
    if (
      updatedData.category.verificationStatus !==
      CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        `Expected verificationStatus PENDING, got ${updatedData.category.verificationStatus}`,
      )
    }
    if (updatedData.plan.name !== "Student Health Pricing Plan") {
      throw new Error(
        `Expected Student Health Pricing Plan, got ${updatedData.plan.name}`,
      )
    }
    console.log(
      "[PASS] Check 7: Category change requested; status reset to PENDING and student rates applied",
    )

    // -------------------------------------------------------------------------
    // Check 8: Exactly One Primary Category Enforced in PostgreSQL
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 8: Single Primary Category Invariant in Database ---",
    )
    const dbRecords = await prisma.patientCategoryRecord.findMany({
      where: { userId: patientGeneral.id },
    })
    if (dbRecords.length !== 1) {
      throw new Error(
        `Expected exactly 1 PatientCategoryRecord in database, found ${dbRecords.length}`,
      )
    }
    if (dbRecords[0].category !== PatientCategory.STUDENT) {
      throw new Error(
        `Expected database category STUDENT, found ${dbRecords[0].category}`,
      )
    }
    console.log(
      "[PASS] Check 8: Exactly one primary category verified at database layer (@unique on userId)",
    )

    // -------------------------------------------------------------------------
    // Check 9: Rejection of Self-Verification Injections
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 9: Reject Client Injections of verificationStatus ---",
    )
    const tamperRes = await request(
      port,
      "/api/patient/category",
      "PATCH",
      patientGeneralSession.headers,
      {
        category: "NHIS",
        nhisId: "GH-NHIS-11223344",
        verificationStatus: "VERIFIED",
      },
    )
    if (tamperRes.status !== 400) {
      throw new Error(
        `Expected 400 on self-verification attempt, got ${tamperRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 9: Client injection of verificationStatus strictly rejected with HTTP 400",
    )

    // -------------------------------------------------------------------------
    // Check 10: Validation for Missing Evidence Fields
    // -------------------------------------------------------------------------
    console.log("\n--- Check 10: Missing NHIS ID Validation ---")
    const missingNhisRes = await request(
      port,
      "/api/patient/category",
      "PATCH",
      patientGeneralSession.headers,
      {
        category: "NHIS",
      },
    )
    if (missingNhisRes.status !== 400) {
      throw new Error(
        `Expected 400 when missing NHIS ID, got ${missingNhisRes.status}`,
      )
    }
    console.log(
      `[PASS] Check 10: Category change to NHIS without ID rejected (${missingNhisRes.body?.message})`,
    )

    // -------------------------------------------------------------------------
    // Check 11: Permanent Category Deletion Strictly Blocked (403)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 11: Category Deletion Blocked (HTTP 403 Forbidden) ---",
    )
    const delCatRes = await request(
      port,
      "/api/patient/category",
      "DELETE",
      patientGeneralSession.headers,
    )
    if (delCatRes.status !== 403) {
      throw new Error(
        `Expected 403 on DELETE /api/patient/category, got ${delCatRes.status}`,
      )
    }

    const delPriceRes = await request(
      port,
      "/api/patient/pricing",
      "DELETE",
      patientGeneralSession.headers,
    )
    if (delPriceRes.status !== 403) {
      throw new Error(
        `Expected 403 on DELETE /api/patient/pricing, got ${delPriceRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 11: Category and pricing deletion strictly prohibited with HTTP 403 FORBIDDEN",
    )

    // -------------------------------------------------------------------------
    // Check 12: Separation of Billing vs Clinical Priority
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 12: Verify Clinical Priority & Complaints Separation ---",
    )
    const complaintsBefore = await prisma.complaint.findMany({
      where: { patientId: patientGeneral.id },
    })
    const appointmentsBefore = await prisma.appointment.findMany({
      where: { patientId: patientGeneral.id },
    })
    if (complaintsBefore.length > 0 || appointmentsBefore.length > 0) {
      throw new Error(
        "Unexpected complaints or appointments created during pricing operations",
      )
    }
    console.log(
      "[PASS] Check 12: Verified billing operations do not create or alter clinical complaints/appointments",
    )

    console.log("\n" + "=".repeat(80))
    console.log(
      "ALL 12 PRICING & COVERAGE INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log("=".repeat(80) + "\n")
  } finally {
    // Teardown
    console.log("[Teardown] Cleaning up test data...")
    if (patientGeneral) {
      await prisma.user.delete({ where: { id: patientGeneral.id } })
    }
    if (patientNhis) {
      await prisma.user.delete({ where: { id: patientNhis.id } })
    }

    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
    console.log("[Teardown] Test server closed cleanly.")
  }
}

runPricingTests().catch((err) => {
  console.error("Pricing test suite failed:", err)
  process.exit(1)
})
