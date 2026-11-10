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
  ComplaintStatus,
  ComplaintSeverity,
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

async function runComplaintTests() {
  console.log(
    "================================================================================",
  )
  console.log("HEALTHITUDE: COMPLAINTS & SYMPTOMS CRUD INTEGRATION TESTS")
  console.log(
    "================================================================================",
  )

  const testPort = 5064
  const app = createApp()
  const server = app.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  let patient1Id = ""
  let patient2Id = ""
  let sessionToken1 = ""
  let csrfToken1 = ""
  let sessionToken2 = ""
  let csrfToken2 = ""

  try {
    const nonce = Date.now().toString().slice(-6)

    // Setup Patient 1
    const reg1 = await registerPatient({
      account: {
        firstName: "Abena",
        lastName: "Appiah",
        email: `complaint.p1.${nonce}@example.com`,
        phoneNumber: `0241${nonce}`,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        dateOfBirth: new Date("1995-03-21"),
        sex: Sex.FEMALE,
      },
      contact: {
        street: "14 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kofi Appiah",
          relationship: "SIBLING",
          phoneNumber: "0240003344",
        },
      },
      healthProfile: {
        bloodGroup: "A_POSITIVE",
        genotype: "AA",
      },
      patientCategory: {
        category: PatientCategory.STUDENT,
        supportingDocument: "student-id.pdf",
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
    patient1Id = reg1.user.id
    sessionToken1 = generateSessionToken()
    csrfToken1 = generateCsrfToken()
    await prisma.session.create({
      data: {
        userId: patient1Id,
        tokenHash: hashSessionToken(sessionToken1),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Setup Patient 2 (for IDOR testing)
    const reg2 = await registerPatient({
      account: {
        firstName: "Kweku",
        lastName: "Boateng",
        email: `complaint.p2.${nonce}@example.com`,
        phoneNumber: `0242${nonce}`,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        dateOfBirth: new Date("1991-08-11"),
        sex: Sex.MALE,
      },
      contact: {
        street: "22 Oxford Street",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Yaa Boateng",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "0240005566",
        },
      },
      healthProfile: {},
      patientCategory: { category: PatientCategory.GENERAL_PATIENT },
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
    patient2Id = reg2.user.id
    sessionToken2 = generateSessionToken()
    csrfToken2 = generateCsrfToken()
    await prisma.session.create({
      data: {
        userId: patient2Id,
        tokenHash: hashSessionToken(sessionToken2),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const p1Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken1}; ${CSRF_COOKIE_NAME}=${csrfToken1}`,
      "x-csrf-token": csrfToken1,
    }

    const p2Headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken2}; ${CSRF_COOKIE_NAME}=${csrfToken2}`,
      "x-csrf-token": csrfToken2,
    }

    // -------------------------------------------------------------------------
    // Check 1: Authentication & CSRF Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Authentication & CSRF Protection ---")
    const unauthGet = await request(testPort, "/api/patient/complaints")
    if (unauthGet.status !== 401) {
      throw new Error(`Expected 401 unauthenticated, got ${unauthGet.status}`)
    }

    const noCsrfPost = await request(
      testPort,
      "/api/patient/complaints",
      "POST",
      { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken1}` },
      { symptoms: "Fever and chills", severity: "Moderate" },
    )
    if (noCsrfPost.status !== 403) {
      throw new Error(`Expected 403 missing CSRF, got ${noCsrfPost.status}`)
    }
    console.log(
      "[PASS] Check 1: Authentication and CSRF strictly enforced on complaint endpoints",
    )

    // -------------------------------------------------------------------------
    // Check 2: Validation of Symptoms and Severity
    // -------------------------------------------------------------------------
    console.log("\n--- Check 2: Field Validation ---")
    const invalidSeverityRes = await request(
      testPort,
      "/api/patient/complaints",
      "POST",
      p1Headers,
      { symptoms: "Headache", severity: "ExtremelySevere" },
    )
    if (invalidSeverityRes.status !== 400) {
      throw new Error(
        `Expected 400 for invalid severity, got ${invalidSeverityRes.status}`,
      )
    }

    const emptySymptomsRes = await request(
      testPort,
      "/api/patient/complaints",
      "POST",
      p1Headers,
      { symptoms: "", severity: "Mild" },
    )
    if (emptySymptomsRes.status !== 400) {
      throw new Error(
        `Expected 400 for empty symptoms, got ${emptySymptomsRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 2: Invalid severity and missing symptoms rejected with HTTP 400",
    )

    // -------------------------------------------------------------------------
    // Check 3: Rejection of Server-Controlled Property Injections
    // -------------------------------------------------------------------------
    console.log("\n--- Check 3: Server-Controlled Field Injection Defense ---")
    const injectRes = await request(
      testPort,
      "/api/patient/complaints",
      "POST",
      p1Headers,
      {
        symptoms: "Stomach ache",
        severity: "Moderate",
        status: "RESOLVED",
        assignedDoctor: "Dr. Hacker",
        clinicalNotes: "Tampered diagnosis",
      },
    )
    if (injectRes.status !== 400) {
      throw new Error(
        `Expected 400 for injected server-controlled fields, got ${injectRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 3: Attempt to inject status, assignedDoctor, and clinicalNotes strictly rejected",
    )

    // -------------------------------------------------------------------------
    // Check 4: Successful Complaint Submission (CREATE)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 4: Successful Complaint Creation (CREATE) ---")
    const createRes = await request(
      testPort,
      "/api/patient/complaints",
      "POST",
      p1Headers,
      {
        symptoms: "Persistent headache, mild fever, fatigue",
        severity: "Moderate",
        duration: "3 days",
      },
    )

    if (createRes.status !== 201 || createRes.body.status !== "success") {
      throw new Error(
        `Expected 201 success, got ${createRes.status}: ${JSON.stringify(createRes.body)}`,
      )
    }

    const createdComplaint = createRes.body.data
    if (
      !createdComplaint.referenceId ||
      !createdComplaint.referenceId.startsWith("CPL-")
    ) {
      throw new Error(
        `Expected referenceId to start with 'CPL-', got ${createdComplaint.referenceId}`,
      )
    }
    if (createdComplaint.status !== "NEW") {
      throw new Error(
        `Expected default status 'NEW', got ${createdComplaint.status}`,
      )
    }
    if (createdComplaint.patientId !== patient1Id) {
      throw new Error(
        "Complaint patientId does not match authenticated patient",
      )
    }
    console.log(
      `[PASS] Check 4: Created complaint ${createdComplaint.referenceId} with status NEW`,
    )

    // -------------------------------------------------------------------------
    // Check 5: Retrieve Patient Complaints (READ)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 5: Retrieve Patient Complaints (READ) ---")
    const listRes = await request(
      testPort,
      "/api/patient/complaints",
      "GET",
      p1Headers,
    )
    if (
      listRes.status !== 200 ||
      !Array.isArray(listRes.body.data.complaints)
    ) {
      throw new Error(
        `Expected 200 with complaints array, got ${listRes.status}`,
      )
    }
    if (listRes.body.data.complaints.length !== 1) {
      throw new Error(
        `Expected 1 complaint for patient 1, got ${listRes.body.data.complaints.length}`,
      )
    }
    console.log(
      "[PASS] Check 5: Correctly retrieved list of patient's complaints",
    )

    // -------------------------------------------------------------------------
    // Check 6: Single Complaint Retrieval by ID & Reference
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 6: Single Complaint Lookup by ID and Reference ---",
    )
    const getByIdRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.id}`,
      "GET",
      p1Headers,
    )
    if (
      getByIdRes.status !== 200 ||
      getByIdRes.body.data.referenceId !== createdComplaint.referenceId
    ) {
      throw new Error("Failed to retrieve complaint by UUID")
    }

    const getByRefRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.referenceId}`,
      "GET",
      p1Headers,
    )
    if (
      getByRefRes.status !== 200 ||
      getByRefRes.body.data.id !== createdComplaint.id
    ) {
      throw new Error(
        "Failed to retrieve complaint by human-readable reference",
      )
    }
    console.log(
      "[PASS] Check 6: Lookup by UUID and reference ID both succeeded",
    )

    // -------------------------------------------------------------------------
    // Check 7: Cross-Patient IDOR Access Prevention
    // -------------------------------------------------------------------------
    console.log("\n--- Check 7: IDOR Defense ---")
    const idorRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.id}`,
      "GET",
      p2Headers,
    )
    if (idorRes.status !== 403 || idorRes.body.code !== "FORBIDDEN") {
      throw new Error(
        `Expected 403 FORBIDDEN on foreign complaint, got ${idorRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 7: Foreign patient cannot view or query complaint (HTTP 403)",
    )

    // -------------------------------------------------------------------------
    // Check 8: Update Complaint while NEW (UPDATE)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 8: Patient Update while NEW (UPDATE) ---")
    const updateRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.id}`,
      "PATCH",
      p1Headers,
      {
        symptoms: "Severe migraine with aura and visual disturbance",
        severity: "Severe",
        duration: "4 days",
      },
    )

    if (updateRes.status !== 200 || updateRes.body.data.severity !== "SEVERE") {
      throw new Error(
        `Expected 200 with updated severity SEVERE, got ${updateRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 8: Patient successfully updated symptoms and severity while in NEW status",
    )

    // -------------------------------------------------------------------------
    // Check 9: Lock Complaint after Clinical Review Commences
    // -------------------------------------------------------------------------
    console.log("\n--- Check 9: Lock Complaint on Status Transition ---")
    // Simulate doctor beginning review
    await prisma.complaint.update({
      where: { id: createdComplaint.id },
      data: {
        status: ComplaintStatus.UNDER_REVIEW,
        assignedDoctor: "Dr. Kofi Boateng",
      },
    })

    const lockedUpdateRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.id}`,
      "PATCH",
      p1Headers,
      {
        symptoms: "Attempting to change after review started",
      },
    )
    if (lockedUpdateRes.status !== 400) {
      throw new Error(
        `Expected 400 when editing UNDER_REVIEW complaint, got ${lockedUpdateRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 9: Modification rejected once complaint is UNDER_REVIEW",
    )

    // -------------------------------------------------------------------------
    // Check 10: Permanent Deletion Prohibited (DELETE)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 10: Prohibit Deletion (Audit Trail Defense) ---")
    const deleteRes = await request(
      testPort,
      `/api/patient/complaints/${createdComplaint.id}`,
      "DELETE",
      p1Headers,
    )
    if (deleteRes.status !== 403) {
      throw new Error(
        `Expected 403 for complaint deletion attempt, got ${deleteRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 10: Permanent deletion rejected with HTTP 403 (audit trail protected)",
    )

    // -------------------------------------------------------------------------
    // Check 11: Dashboard Overview Synchronization
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: Dashboard Active Complaints Counter Sync ---")
    const dashRes = await request(
      testPort,
      "/api/patient/dashboard",
      "GET",
      p1Headers,
    )
    if (
      dashRes.status !== 200 ||
      dashRes.body.data.metrics.activeComplaintsCount !== 1
    ) {
      throw new Error(
        `Expected activeComplaintsCount = 1 on dashboard, got ${dashRes.body.data.metrics.activeComplaintsCount}`,
      )
    }
    if (dashRes.body.data.metrics.underReviewComplaintsCount !== 1) {
      throw new Error(
        `Expected underReviewComplaintsCount = 1 on dashboard, got ${dashRes.body.data.metrics.underReviewComplaintsCount}`,
      )
    }
    console.log(
      "[PASS] Check 11: Dashboard counter correctly synchronized: 1 active, 1 under review",
    )

    console.log(
      "================================================================================",
    )
    console.log(
      "ALL 11 COMPLAINT CRUD & LIFECYCLE CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    server.close()
    if (patient1Id) {
      await prisma.user.delete({ where: { id: patient1Id } }).catch(() => {})
    }
    if (patient2Id) {
      await prisma.user.delete({ where: { id: patient2Id } }).catch(() => {})
    }
    await prisma.$disconnect()
  }
}

runComplaintTests().catch((err) => {
  console.error("Complaint test failed:", err)
  process.exit(1)
})
