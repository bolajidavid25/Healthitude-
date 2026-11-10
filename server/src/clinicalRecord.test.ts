import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import { createClinicalRecord } from "./services/clinicalRecordService"
import { saveFile, deleteFile } from "./services/storageService"
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
  ClinicalRecordType,
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

async function runClinicalRecordTests() {
  console.log(
    "================================================================================",
  )
  console.log("HEALTHITUDE: CLINICAL RECORDS INTEGRATION & SECURITY TESTS")
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const testServer = http.createServer(app)
  await new Promise<void>((resolve) => testServer.listen(0, resolve))
  const testPort = (testServer.address() as any).port

  let patient1Id = ""
  let patient2Id = ""
  let testDocKey = ""

  try {
    // -------------------------------------------------------------------------
    // Setup: Register Test Patient 1
    // -------------------------------------------------------------------------
    const email1 = `rec.patient1.${Date.now()}@example.com`
    const regResult1 = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "Mensah",
        dateOfBirth: new Date("1993-04-18"),
        sex: Sex.FEMALE,
        email: email1,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 90000000)}`,
        password: "SecurePassword123!",
      },
      contact: {
        street: "42 Barnes Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kwesi Mensah",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "+233200000001",
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

    // Create active session and CSRF tokens for Patient 1
    const p1RawToken = generateSessionToken()
    const p1TokenHash = hashSessionToken(p1RawToken)
    const p1CsrfToken = generateCsrfToken()
    await prisma.session.create({
      data: {
        userId: patient1Id,
        tokenHash: p1TokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const p1Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${p1RawToken}; ${CSRF_COOKIE_NAME}=${p1CsrfToken}`,
      "x-csrf-token": p1CsrfToken,
    }

    // -------------------------------------------------------------------------
    // Setup: Register Test Patient 2 (for IDOR tests)
    // -------------------------------------------------------------------------
    const email2 = `rec.patient2.${Date.now()}@example.com`
    const regResult2 = await registerPatient({
      account: {
        firstName: "Kweku",
        lastName: "Osei",
        dateOfBirth: new Date("1989-11-23"),
        sex: Sex.MALE,
        email: email2,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 90000000)}`,
        password: "SecurePassword123!",
      },
      contact: {
        street: "8 Ring Road",
        city: "Kumasi",
        state: "Ashanti",
        emergencyContact: {
          fullName: "Abena Osei",
          relationship: "SIBLING",
          phoneNumber: "+233200000002",
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

    const p2RawToken = generateSessionToken()
    const p2TokenHash = hashSessionToken(p2RawToken)
    const p2CsrfToken = generateCsrfToken()
    await prisma.session.create({
      data: {
        userId: patient2Id,
        tokenHash: p2TokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const p2Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${p2RawToken}; ${CSRF_COOKIE_NAME}=${p2CsrfToken}`,
      "x-csrf-token": p2CsrfToken,
    }

    // -------------------------------------------------------------------------
    // Check 1: Authentication Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Authentication Requirement ---")
    const unauthList = await request(testPort, "/api/patient/records", "GET")
    if (unauthList.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated records GET, got ${unauthList.status}`,
      )
    }

    const unauthSingle = await request(
      testPort,
      "/api/patient/records/sample-id",
      "GET",
    )
    if (unauthSingle.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated single record GET, got ${unauthSingle.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Authentication strictly enforced on records endpoints (401)",
    )

    // -------------------------------------------------------------------------
    // Check 2: Patient Cannot Create Clinical Records (Rule 4)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 2: Prohibit Patient Record Creation (Rule 4) ---")
    const patientCreateRes = await request(
      testPort,
      "/api/patient/records",
      "POST",
      p1Headers,
      {
        type: "DIAGNOSIS",
        content: "Patient-reported self diagnosis",
        author: "Self",
      },
    )
    if (patientCreateRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to POST record, got ${patientCreateRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 2: Patient record creation strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 3: Patient Cannot Modify Clinical Records (Rule 2)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 3: Prohibit Patient Record Modification (Rule 2) ---",
    )
    const patientUpdateRes = await request(
      testPort,
      "/api/patient/records/fake-id",
      "PATCH",
      p1Headers,
      {
        content: "Tampered diagnosis",
      },
    )
    if (patientUpdateRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to PATCH record, got ${patientUpdateRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 3: Patient record modification strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 4: Patient Cannot Delete Clinical Records (Rule 3)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 4: Prohibit Patient Record Deletion (Rule 3) ---")
    const patientDeleteRes = await request(
      testPort,
      "/api/patient/records/fake-id",
      "DELETE",
      p1Headers,
    )
    if (patientDeleteRes.status !== 403) {
      throw new Error(
        `Expected 403 when patient attempts to DELETE record, got ${patientDeleteRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 4: Permanent record deletion strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 5: Retrieve Authorized Clinical Records across all 5 Categories
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 5: Retrieve Clinical Records across All 5 Categories ---",
    )
    // Seed verified clinical records for Patient 1
    const rec1 = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.DIAGNOSIS,
      content: "Tension-type headache, mild viral syndrome",
      author: "Dr. K. Boateng",
      authorRole: "General Practitioner",
    })

    const rec2 = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.LAB_RESULT,
      content:
        "FBC — WBC 6.2 × 10³/μL, Hgb 13.8 g/dL, Platelets 224 × 10³/μL. Within normal limits.",
      author: "Dr. K. Boateng",
      authorRole: "General Practitioner",
    })

    const rec3 = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.VITAL_SIGNS,
      content: "BP 118/76 · HR 72 bpm · Temp 36.8 °C · SpO₂ 98%",
      author: "Nurse Afua Darko",
      authorRole: "Registered Nurse",
    })

    const rec4 = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.TREATMENT_NOTE,
      content:
        "Adequate oral hydration and rest advised. Follow-up in 7 days if symptoms persist.",
      author: "Dr. K. Boateng",
      authorRole: "General Practitioner",
    })

    const rec5 = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.REFERRAL,
      content: "Referral to Cardiology for routine cardiovascular assessment.",
      author: "Dr. E. Asante",
      authorRole: "Specialist Physician",
    })

    const listRes = await request(
      testPort,
      "/api/patient/records",
      "GET",
      p1Headers,
    )
    if (listRes.status !== 200 || !Array.isArray(listRes.body.data)) {
      throw new Error(`Failed to list records: ${JSON.stringify(listRes.body)}`)
    }
    if (listRes.body.data.length !== 5) {
      throw new Error(`Expected 5 records, got ${listRes.body.data.length}`)
    }

    // Verify all records have verified: true and unique record numbers
    for (const r of listRes.body.data) {
      if (!r.verified || !r.recordNumber.startsWith("REC-")) {
        throw new Error(
          `Record verification failed for ${r.id}: verified=${r.verified}, number=${r.recordNumber}`,
        )
      }
    }
    console.log(
      "[PASS] Check 5: Successfully retrieved all 5 clinical records with verified: true",
    )

    // -------------------------------------------------------------------------
    // Check 6: Single Record Retrieval by UUID and recordNumber
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 6: Single Record Lookup by UUID and recordNumber ---",
    )
    const getByUuid = await request(
      testPort,
      `/api/patient/records/${rec1.id}`,
      "GET",
      p1Headers,
    )
    if (
      getByUuid.status !== 200 ||
      getByUuid.body.data.content !== rec1.content
    ) {
      throw new Error(`UUID lookup failed: ${JSON.stringify(getByUuid.body)}`)
    }

    const getByRecordNumber = await request(
      testPort,
      `/api/patient/records/${rec1.recordNumber}`,
      "GET",
      p1Headers,
    )
    if (
      getByRecordNumber.status !== 200 ||
      getByRecordNumber.body.data.id !== rec1.id
    ) {
      throw new Error(
        `recordNumber lookup failed: ${JSON.stringify(getByRecordNumber.body)}`,
      )
    }
    console.log(
      "[PASS] Check 6: Single record lookup by UUID and reference recordNumber succeeded",
    )

    // -------------------------------------------------------------------------
    // Check 7: IDOR Defense (Cross-Patient Access Blocked)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 7: Cross-Patient Access IDOR Defense ---")
    const idorRes = await request(
      testPort,
      `/api/patient/records/${rec1.id}`,
      "GET",
      p2Headers,
    )
    if (idorRes.status !== 403) {
      throw new Error(
        `Expected 403 for IDOR record lookup, got ${idorRes.status}`,
      )
    }

    const idorNumRes = await request(
      testPort,
      `/api/patient/records/${rec1.recordNumber}`,
      "GET",
      p2Headers,
    )
    if (idorNumRes.status !== 403) {
      throw new Error(
        `Expected 403 for IDOR recordNumber lookup, got ${idorNumRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 7: Foreign patient access to clinical record strictly rejected with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 8: Category Filtering
    // -------------------------------------------------------------------------
    console.log("\n--- Check 8: Category Filtering ---")
    const filterDiag = await request(
      testPort,
      "/api/patient/records?type=DIAGNOSIS",
      "GET",
      p1Headers,
    )
    if (
      filterDiag.status !== 200 ||
      filterDiag.body.data.length !== 1 ||
      filterDiag.body.data[0].type !== "DIAGNOSIS"
    ) {
      throw new Error(
        `Filter by DIAGNOSIS failed: got ${filterDiag.body.data?.length} items`,
      )
    }

    // Friendly shorthand filter e.g. "Vital Signs"
    const filterVitals = await request(
      testPort,
      "/api/patient/records?type=Vital%20Signs",
      "GET",
      p1Headers,
    )
    if (
      filterVitals.status !== 200 ||
      filterVitals.body.data.length !== 1 ||
      filterVitals.body.data[0].type !== "VITAL_SIGNS"
    ) {
      throw new Error(
        `Filter by 'Vital Signs' failed: got ${filterVitals.body.data?.length} items`,
      )
    }

    // Invalid category returns 400
    const filterInvalid = await request(
      testPort,
      "/api/patient/records?type=NotARealCategory",
      "GET",
      p1Headers,
    )
    if (filterInvalid.status !== 400) {
      throw new Error(
        `Expected 400 for invalid category filter, got ${filterInvalid.status}`,
      )
    }
    console.log(
      "[PASS] Check 8: Category filtering accurately resolves enums and rejects invalid types (400)",
    )

    // -------------------------------------------------------------------------
    // Check 9: Attachment Storage and Authorized Streaming
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 9: Document Attachment Storage & Authorized Streaming ---",
    )
    const mockPdfBuffer = Buffer.from(
      "%PDF-1.4 Mock Lab Report Content",
      "utf-8",
    )
    const storedDoc = await saveFile(
      "documents",
      mockPdfBuffer,
      ".pdf",
      patient1Id,
    )
    testDocKey = storedDoc.storageKey

    const recWithAttach = await createClinicalRecord({
      patientId: patient1Id,
      type: ClinicalRecordType.LAB_RESULT,
      content: "Complete Blood Count & Liver Function Test report",
      author: "Dr. K. Boateng",
      attachmentName: "fbc_lab_report.pdf",
      attachmentUrl: storedDoc.storageKey,
    })

    const streamRes = await request(
      testPort,
      `/api/patient/records/${recWithAttach.id}/attachment`,
      "GET",
      p1Headers,
    )
    if (streamRes.status !== 200) {
      throw new Error(`Failed to stream attachment: status=${streamRes.status}`)
    }
    if (streamRes.headers["x-content-type-options"] !== "nosniff") {
      throw new Error(
        "Missing X-Content-Type-Options: nosniff header on attachment response",
      )
    }
    if (!streamRes.headers["content-type"]?.includes("application/pdf")) {
      throw new Error(
        `Unexpected Content-Type: ${streamRes.headers["content-type"]}`,
      )
    }
    console.log(
      "[PASS] Check 9: Attached document streamed securely with application/pdf and nosniff header",
    )

    // -------------------------------------------------------------------------
    // Check 10: Unauthorized Attachment Access Blocked (IDOR)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 10: Cross-Patient Attachment IDOR Defense ---")
    const idorAttach = await request(
      testPort,
      `/api/patient/records/${recWithAttach.id}/attachment`,
      "GET",
      p2Headers,
    )
    if (idorAttach.status !== 403) {
      throw new Error(
        `Expected 403 when Patient 2 accesses Patient 1 attachment, got ${idorAttach.status}`,
      )
    }
    console.log(
      "[PASS] Check 10: Unauthorized access to clinical record attachment strictly blocked (403)",
    )

    // -------------------------------------------------------------------------
    // Check 11: Database Persistence Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: Database Persistence Verification ---")
    const dbRecords = await prisma.clinicalRecord.findMany({
      where: { patientId: patient1Id },
    })
    if (dbRecords.length !== 6) {
      throw new Error(
        `Expected 6 persisted clinical records in PostgreSQL, found ${dbRecords.length}`,
      )
    }
    console.log(
      "[PASS] Check 11: All clinical records reliably persisted in PostgreSQL database",
    )

    console.log(
      "================================================================================",
    )
    console.log(
      "ALL 11 CLINICAL RECORD INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Teardown test server and patients
    testServer.close()
    if (testDocKey) {
      await deleteFile("documents", testDocKey).catch(() => {})
    }
    if (patient1Id) {
      await prisma.user.delete({ where: { id: patient1Id } }).catch(() => {})
    }
    if (patient2Id) {
      await prisma.user.delete({ where: { id: patient2Id } }).catch(() => {})
    }
  }
}

runClinicalRecordTests().catch((err) => {
  console.error("Clinical record test failed:", err)
  process.exit(1)
})
