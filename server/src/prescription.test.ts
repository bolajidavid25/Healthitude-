import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import { createPrescription } from "./services/prescriptionService"
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
  PrescriptionStatus,
  AdherenceStatus,
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
    if (payload) req.write(payload)
    req.end()
  })
}

async function runPrescriptionTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: MEDICATIONS & ADHERENCE INTEGRATION & SECURITY TESTS",
  )
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const testServer = http.createServer(app)
  await new Promise<void>((resolve) => testServer.listen(0, resolve))
  const testPort = (testServer.address() as any).port

  let patient1Id = ""
  let patient2Id = ""

  try {
    // -------------------------------------------------------------------------
    // Setup: Register Test Patient 1
    // -------------------------------------------------------------------------
    const p1Email = `rx.patient1.${Date.now()}@example.com`
    const p1Phone = `024${Math.floor(1000000 + Math.random() * 9000000)}`
    const regResult1 = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "PrescriptionTest",
        dateOfBirth: new Date("1994-06-15"),
        sex: Sex.FEMALE,
        email: p1Email,
        phoneNumber: p1Phone,
        password: "ValidSecurePassword123!",
        confirmPassword: "ValidSecurePassword123!",
      },
      contact: {
        street: "12 Independence Ave",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Akosua Mensah",
          relationship: "SIBLING",
          phoneNumber: "0200001122",
        },
      },
      healthProfile: {
        bloodGroup: "O_POSITIVE",
        genotype: "AA",
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
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
    patient1Id = regResult1.user.id

    // Create session for Patient 1
    const p1Token = generateSessionToken()
    const p1TokenHash = hashSessionToken(p1Token)
    await prisma.session.create({
      data: {
        userId: patient1Id,
        tokenHash: p1TokenHash,
        expiresAt: new Date(Date.now() + 86400 * 1000),
      },
    })
    const p1Csrf = generateCsrfToken()
    const p1Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${p1Token}; ${CSRF_COOKIE_NAME}=${p1Csrf}`,
      "X-CSRF-Token": p1Csrf,
    }

    // -------------------------------------------------------------------------
    // Setup: Register Test Patient 2 (for IDOR verification)
    // -------------------------------------------------------------------------
    const p2Email = `rx.patient2.${Date.now()}@example.com`
    const p2Phone = `024${Math.floor(1000000 + Math.random() * 9000000)}`
    const regResult2 = await registerPatient({
      account: {
        firstName: "Kweku",
        lastName: "PrescriptionTest2",
        dateOfBirth: new Date("1990-01-01"),
        sex: Sex.MALE,
        email: p2Email,
        phoneNumber: p2Phone,
        password: "ValidSecurePassword123!",
        confirmPassword: "ValidSecurePassword123!",
      },
      contact: {
        street: "45 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Yaw Osei",
          relationship: "PARENT",
          phoneNumber: "0200003344",
        },
      },
      healthProfile: {
        bloodGroup: "A_POSITIVE",
        genotype: "AS",
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
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
    patient2Id = regResult2.user.id

    // Create session for Patient 2
    const p2Token = generateSessionToken()
    const p2TokenHash = hashSessionToken(p2Token)
    await prisma.session.create({
      data: {
        userId: patient2Id,
        tokenHash: p2TokenHash,
        expiresAt: new Date(Date.now() + 86400 * 1000),
      },
    })
    const p2Csrf = generateCsrfToken()
    const p2Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${p2Token}; ${CSRF_COOKIE_NAME}=${p2Csrf}`,
      "X-CSRF-Token": p2Csrf,
    }

    // -------------------------------------------------------------------------
    // Check 1: Authentication Requirement
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Authentication Requirement ---")
    const unauthGet = await request(
      testPort,
      "/api/patient/prescriptions",
      "GET",
    )
    if (unauthGet.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated GET /prescriptions, got ${unauthGet.status}`,
      )
    }

    const unauthAdherence = await request(
      testPort,
      "/api/patient/prescriptions/some-id/adherence",
      "POST",
      {},
      { status: "TAKEN" },
    )
    if (unauthAdherence.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated adherence POST, got ${unauthAdherence.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Authentication strictly enforced on prescription endpoints (401)",
    )

    // -------------------------------------------------------------------------
    // Check 2: Prohibit Patient Prescription Creation (Rule 2)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 2: Prohibit Patient Prescription Creation (Rule 2) ---",
    )
    const createRes = await request(
      testPort,
      "/api/patient/prescriptions",
      "POST",
      p1Headers,
      {
        medicine: "Self-Prescribed Diazepam",
        dose: "10mg",
        frequency: "Once daily",
        duration: "30 days",
      },
    )
    if (createRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to issue prescription, got ${createRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 2: Patient prescription creation strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 3: Prohibit Patient Prescription Modification (Rule 3)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 3: Prohibit Patient Prescription Modification (Rule 3) ---",
    )
    const updateRes = await request(
      testPort,
      "/api/patient/prescriptions/fake-rx-id",
      "PATCH",
      p1Headers,
      {
        dose: "Tampered 2 tablets",
      },
    )
    if (updateRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to update prescription, got ${updateRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 3: Patient prescription modification strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 4: Prohibit Patient Prescription Deletion (Rule 6)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 4: Prohibit Patient Prescription Deletion (Rule 6) ---",
    )
    const deleteRes = await request(
      testPort,
      "/api/patient/prescriptions/fake-rx-id",
      "DELETE",
      p1Headers,
    )
    if (deleteRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to delete prescription, got ${deleteRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 4: Permanent prescription deletion strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 5: Retrieve Prescriptions for Patient (Empty then Populated)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 5: Retrieve Prescriptions (Empty & Seeded) ---")
    const emptyList = await request(
      testPort,
      "/api/patient/prescriptions",
      "GET",
      p1Headers,
    )
    if (
      emptyList.status !== 200 ||
      !Array.isArray(emptyList.body.data) ||
      emptyList.body.data.length !== 0
    ) {
      throw new Error("Expected empty prescription array before seeding")
    }

    // Seed clinician-issued prescriptions for Patient 1
    const rx1 = await createPrescription({
      patientId: patient1Id,
      medicine: "Ibuprofen 400mg",
      dose: "1 tablet",
      frequency: "3× daily after meals",
      duration: "7 days",
      prescriber: "Dr. K. Boateng",
      status: PrescriptionStatus.ACTIVE,
      instructions: "Take with food to prevent gastric discomfort.",
    })

    const rx2 = await createPrescription({
      patientId: patient1Id,
      medicine: "Amoxicillin 500mg",
      dose: "1 capsule",
      frequency: "3× daily",
      duration: "5 days",
      prescriber: "Dr. E. Asante",
      status: PrescriptionStatus.COMPLETED,
    })

    const populatedList = await request(
      testPort,
      "/api/patient/prescriptions",
      "GET",
      p1Headers,
    )
    if (populatedList.status !== 200 || populatedList.body.data.length !== 2) {
      throw new Error(
        `Expected 2 prescriptions, found ${populatedList.body.data?.length}`,
      )
    }
    const retrievedRx1 = populatedList.body.data.find(
      (r: any) => r.id === rx1.id,
    )
    if (
      !retrievedRx1 ||
      retrievedRx1.medicine !== "Ibuprofen 400mg" ||
      retrievedRx1.status !== "ACTIVE"
    ) {
      throw new Error("Prescription 1 details mismatch")
    }
    if (
      !Array.isArray(retrievedRx1.adherence) ||
      retrievedRx1.adherence.length !== 7
    ) {
      throw new Error(
        `Expected 7-day adherence array, got length ${retrievedRx1.adherence?.length}`,
      )
    }
    console.log(
      "[PASS] Check 5: Successfully retrieved prescriptions with 7-day adherence structure",
    )

    // -------------------------------------------------------------------------
    // Check 6: Single Prescription Lookup by UUID and prescriptionNumber
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 6: Single Prescription Lookup by UUID and prescriptionNumber ---",
    )
    const getByUuid = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}`,
      "GET",
      p1Headers,
    )
    if (getByUuid.status !== 200 || getByUuid.body.data.id !== rx1.id) {
      throw new Error(
        `Failed to retrieve prescription by UUID: ${getByUuid.status}`,
      )
    }

    const getByNumber = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.prescriptionNumber}`,
      "GET",
      p1Headers,
    )
    if (getByNumber.status !== 200 || getByNumber.body.data.id !== rx1.id) {
      throw new Error(
        `Failed to retrieve prescription by prescriptionNumber: ${getByNumber.status}`,
      )
    }

    const getNonExistent = await request(
      testPort,
      "/api/patient/prescriptions/RX-9999-0000",
      "GET",
      p1Headers,
    )
    if (getNonExistent.status !== 404) {
      throw new Error(
        `Expected 404 for non-existent prescription, got ${getNonExistent.status}`,
      )
    }
    console.log(
      "[PASS] Check 6: Single prescription lookup by UUID and reference number succeeded",
    )

    // -------------------------------------------------------------------------
    // Check 7: Cross-Patient IDOR Defense
    // -------------------------------------------------------------------------
    console.log("\n--- Check 7: Cross-Patient Prescription IDOR Defense ---")
    const idorLookup = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}`,
      "GET",
      p2Headers,
    )
    if (idorLookup.status !== 403) {
      throw new Error(
        `Expected 403 when Patient 2 accesses Patient 1 prescription, got ${idorLookup.status}`,
      )
    }
    console.log(
      "[PASS] Check 7: Foreign patient access to prescription strictly rejected with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 8: Daily Adherence Recording (TAKEN -> true, SKIPPED -> false)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 8: Daily Adherence Recording ---")
    // 1. Mark today as TAKEN
    const todayLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}/adherence`,
      "POST",
      p1Headers,
      {
        status: "TAKEN",
        notes: "Taken after lunch",
      },
    )
    if (todayLogRes.status !== 200) {
      throw new Error(
        `Failed to record adherence for today: status=${todayLogRes.status}`,
      )
    }
    const todayAdherence = todayLogRes.body.data.adherence
    if (todayAdherence[6] !== true) {
      throw new Error(
        `Expected today's adherence to be true, got ${todayAdherence[6]}`,
      )
    }

    // 2. Mark yesterday as SKIPPED
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const yesterdayLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}/adherence`,
      "POST",
      p1Headers,
      {
        date: yesterdayStr,
        status: "SKIPPED",
        notes: "Forgot morning dose",
      },
    )
    if (yesterdayLogRes.status !== 200) {
      throw new Error(
        `Failed to record adherence for yesterday: status=${yesterdayLogRes.status}`,
      )
    }
    const updatedAdherence = yesterdayLogRes.body.data.adherence
    if (updatedAdherence[5] !== false || updatedAdherence[6] !== true) {
      throw new Error(
        `Adherence history mismatch: ${JSON.stringify(updatedAdherence)}`,
      )
    }
    console.log(
      "[PASS] Check 8: Daily adherence reliably logged (TAKEN=true, SKIPPED=false)",
    )

    // -------------------------------------------------------------------------
    // Check 9: Adherence Upsert for Same Day (Idempotent update)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 9: Adherence Idempotent Upsert ---")
    const changeLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}/adherence`,
      "POST",
      p1Headers,
      {
        date: yesterdayStr,
        status: "TAKEN",
        notes: "Corrected: took dose later in evening",
      },
    )
    if (changeLogRes.status !== 200) {
      throw new Error(
        `Failed to update adherence: status=${changeLogRes.status}`,
      )
    }
    const correctedAdherence = changeLogRes.body.data.adherence
    if (correctedAdherence[5] !== true) {
      throw new Error(
        `Expected corrected adherence to be true, got ${correctedAdherence[5]}`,
      )
    }

    const logCount = await prisma.medicationAdherence.count({
      where: { prescriptionId: rx1.id },
    })
    if (logCount !== 2) {
      throw new Error(
        `Expected exactly 2 adherence records in DB after upsert, found ${logCount}`,
      )
    }
    console.log(
      "[PASS] Check 9: Same-day adherence updates successfully upserted without duplication",
    )

    // -------------------------------------------------------------------------
    // Check 10: Reject Adherence on Inactive/Completed Prescriptions
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 10: Reject Adherence on Completed Prescriptions ---",
    )
    const completedLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx2.id}/adherence`,
      "POST",
      p1Headers,
      {
        status: "TAKEN",
      },
    )
    if (completedLogRes.status !== 400) {
      throw new Error(
        `Expected 400 when logging adherence on completed rx, got ${completedLogRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 10: Adherence recording on completed prescriptions rejected with HTTP 400",
    )

    // -------------------------------------------------------------------------
    // Check 11: Cross-Patient Adherence IDOR Defense
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: Cross-Patient Adherence IDOR Defense ---")
    const idorLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}/adherence`,
      "POST",
      p2Headers,
      {
        status: "TAKEN",
      },
    )
    if (idorLogRes.status !== 403) {
      throw new Error(
        `Expected 403 when Patient 2 logs adherence on Patient 1 prescription, got ${idorLogRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 11: Cross-patient adherence recording strictly blocked with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 12: Reject Future Date Adherence
    // -------------------------------------------------------------------------
    console.log("\n--- Check 12: Reject Future Date Adherence ---")
    const futureDate = new Date()
    futureDate.setUTCDate(futureDate.getUTCDate() + 3)
    const futureStr = futureDate.toISOString().slice(0, 10)

    const futureLogRes = await request(
      testPort,
      `/api/patient/prescriptions/${rx1.id}/adherence`,
      "POST",
      p1Headers,
      {
        date: futureStr,
        status: "TAKEN",
      },
    )
    if (futureLogRes.status !== 400) {
      throw new Error(
        `Expected 400 for future date adherence, got ${futureLogRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 12: Future date adherence recording strictly rejected with HTTP 400",
    )

    // -------------------------------------------------------------------------
    // Check 13: Dashboard Metrics Connection Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Check 13: Dashboard Overview Metrics Integration ---")
    const dashRes = await request(
      testPort,
      "/api/patient/dashboard",
      "GET",
      p1Headers,
    )
    if (dashRes.status !== 200) {
      throw new Error(`Failed to retrieve dashboard: status=${dashRes.status}`)
    }
    if (dashRes.body.data.metrics.medicationsCount !== 1) {
      throw new Error(
        `Expected medicationsCount=1 (active rx), got ${dashRes.body.data.metrics.medicationsCount}`,
      )
    }
    if (
      dashRes.body.data.metrics.medicationsSummary !== "1 active prescription"
    ) {
      throw new Error(
        `Unexpected medicationsSummary: ${dashRes.body.data.metrics.medicationsSummary}`,
      )
    }
    console.log(
      "[PASS] Check 13: Dashboard metrics reflect active prescription counts accurately",
    )

    // -------------------------------------------------------------------------
    // Check 14: Database Persistence Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Check 14: Database Persistence Verification ---")
    const dbRxs = await prisma.prescription.findMany({
      where: { patientId: patient1Id },
    })
    if (dbRxs.length !== 2) {
      throw new Error(
        `Expected 2 persisted prescriptions, found ${dbRxs.length}`,
      )
    }
    const dbAdherences = await prisma.medicationAdherence.findMany({
      where: { patientId: patient1Id },
    })
    if (dbAdherences.length !== 2) {
      throw new Error(
        `Expected 2 persisted adherence records, found ${dbAdherences.length}`,
      )
    }
    console.log(
      "[PASS] Check 14: Prescriptions and adherence logs reliably persisted in PostgreSQL database",
    )

    console.log(
      "================================================================================",
    )
    console.log(
      "ALL 14 PRESCRIPTIONS & ADHERENCE INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    testServer.close()
    if (patient1Id) {
      await prisma.user.delete({ where: { id: patient1Id } }).catch(() => {})
    }
    if (patient2Id) {
      await prisma.user.delete({ where: { id: patient2Id } }).catch(() => {})
    }
  }
}

runPrescriptionTests().catch((err) => {
  console.error("Prescription test failed:", err)
  process.exit(1)
})
