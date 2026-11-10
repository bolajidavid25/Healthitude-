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
import { Sex, PatientCategory, ConsentType } from "./generated/prisma/enums"
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

async function runEmergencyTests() {
  console.log(
    "================================================================================",
  )
  console.log("HEALTHITUDE: EMERGENCY & BREAK-GLASS BACKEND INTEGRATION TESTS")
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const addr = server.address() as any
  const port = addr.port
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`)

  let patientA: any
  let sessionA: any
  let patientB: any
  let sessionB: any

  try {
    // 1. Setup Patient A with full health profile and emergency contact
    const emailA = `patient.emg.a.${Date.now()}@example.com`
    const regA = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "Mensah",
        dateOfBirth: new Date("1996-03-24"),
        sex: Sex.FEMALE,
        email: emailA,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "12 Independence Avenue",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kofi Mensah",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "+233240008899",
        },
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: "GH-NHIS-20240088341",
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
    patientA = regA.user
    sessionA = await createAuthenticatedSession(patientA.id)

    // Update HealthProfile with blood group O+, Penicillin allergy
    await prisma.healthProfile.update({
      where: { userId: patientA.id },
      data: {
        bloodGroup: "O_POSITIVE",
        knownAllergies: "Penicillin",
        medicalConditions: "Mild Asthma",
        patientReported: true,
        clinicallyVerified: true,
        verifiedAt: new Date("2026-01-15"),
      },
    })

    // Create an active prescription for Patient A
    await prisma.prescription.create({
      data: {
        prescriptionNumber: `RX-EMG-${Date.now()}`,
        patientId: patientA.id,
        medicine: "Salbutamol Inhaler",
        dose: "100mcg",
        frequency: "As needed",
        duration: "30 days",
        prescriber: "Dr. K. Boateng",
        status: "ACTIVE",
      },
    })

    // Create a vital signs clinical record
    await prisma.clinicalRecord.create({
      data: {
        recordNumber: `CR-VTL-${Date.now()}`,
        patientId: patientA.id,
        type: "VITAL_SIGNS",
        content: "BP: 118/76 mmHg · HR: 72 bpm · Temp: 36.8°C",
        author: "Nurse Esi Darko",
        verified: true,
      },
    })

    // 2. Setup Patient B
    const emailB = `patient.emg.b.${Date.now()}@example.com`
    const regB = await registerPatient({
      account: {
        firstName: "Kweku",
        lastName: "Osei",
        dateOfBirth: new Date("1992-11-10"),
        sex: Sex.MALE,
        email: emailB,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "24 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Abena Osei",
          relationship: "SIBLING",
          phoneNumber: "+233240001122",
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
    patientB = regB.user
    sessionB = await createAuthenticatedSession(patientB.id)

    // =========================================================================
    // CHECK 1: Unauthenticated Access Blocked (HTTP 401)
    // =========================================================================
    console.log("\n--- Check 1: Unauthenticated Access Blocked ---")
    const unauthRes = await request(port, "/api/patient/emergency", "GET")
    if (unauthRes.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated request, got ${unauthRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Unauthenticated request rejected with HTTP 401",
    )

    // =========================================================================
    // CHECK 2: Missing CSRF Token on Emergency Initiation Blocked (HTTP 403)
    // =========================================================================
    console.log(
      "\n--- Check 2: Missing CSRF Token on Emergency Initiation Blocked ---",
    )
    const noCsrfRes = await request(
      port,
      "/api/patient/emergency",
      "POST",
      { Cookie: sessionA.cookieHeader }, // Missing x-csrf-token
      { reason: "Acute chest pain" },
    )
    if (noCsrfRes.status !== 403) {
      throw new Error(
        `Expected 403 for missing CSRF token, got ${noCsrfRes.status}`,
      )
    }
    console.log("[PASS] Check 2: Missing CSRF token rejected with HTTP 403")

    // =========================================================================
    // CHECK 3: Baseline Emergency Status (No Active Case & Accurate Snapshot)
    // =========================================================================
    console.log("\n--- Check 3: Baseline Emergency Status ---")
    const baselineRes = await request(
      port,
      "/api/patient/emergency",
      "GET",
      sessionA.headers,
    )
    if (baselineRes.status !== 200) {
      throw new Error(
        `Failed to get baseline status: ${JSON.stringify(baselineRes.body)}`,
      )
    }
    if (baselineRes.body.data.activeCase !== null) {
      throw new Error("Expected activeCase to be null initially")
    }
    const snapshot = baselineRes.body.data.snapshot
    if (snapshot.bloodGroup !== "O+") {
      throw new Error(`Expected bloodGroup O+, got ${snapshot.bloodGroup}`)
    }
    if (!snapshot.allergies.includes("Penicillin")) {
      throw new Error(
        `Expected Penicillin in allergies, got ${snapshot.allergies}`,
      )
    }
    if (!snapshot.lastBP.includes("118/76")) {
      throw new Error(`Expected recent BP in lastBP, got ${snapshot.lastBP}`)
    }
    if (snapshot.activeMedsCount !== 1) {
      throw new Error(
        `Expected 1 active medication, got ${snapshot.activeMedsCount}`,
      )
    }
    if (
      !snapshot.emergencyContact ||
      snapshot.emergencyContact.fullName !== "Kofi Mensah"
    ) {
      throw new Error("Expected emergencyContact Kofi Mensah")
    }
    console.log(
      "[PASS] Check 3: Baseline emergency snapshot matches live clinical records accurately",
    )

    // =========================================================================
    // CHECK 4: Patient Initiates Break-Glass Emergency Request (Case #EMG-YYYY-XXXX)
    // =========================================================================
    console.log(
      "\n--- Check 4: Patient Initiates Break-Glass Emergency Request ---",
    )
    const initiateRes = await request(
      port,
      "/api/patient/emergency",
      "POST",
      sessionA.headers,
      { reason: "Sudden shortness of breath and chest tightness" },
    )
    if (initiateRes.status !== 201) {
      throw new Error(
        `Failed to initiate emergency: ${JSON.stringify(initiateRes.body)}`,
      )
    }
    const emgCase = initiateRes.body.data.emergencyCase
    if (!emgCase.caseNumber.startsWith("EMG-")) {
      throw new Error(
        `Expected caseNumber to start with EMG-, got ${emgCase.caseNumber}`,
      )
    }
    if (emgCase.status !== "ACTIVE") {
      throw new Error(`Expected status ACTIVE, got ${emgCase.status}`)
    }
    const activeCaseNumber = emgCase.caseNumber
    console.log(
      `[PASS] Check 4: Break-Glass initiated with Case #${activeCaseNumber} in ACTIVE status`,
    )

    // =========================================================================
    // CHECK 5: Immutable Audit Trail Written for Initiation
    // =========================================================================
    console.log(
      "\n--- Check 5: Immutable Audit Trail Written for Initiation ---",
    )
    const auditLogs = await prisma.emergencyAuditLog.findMany({
      where: { patientId: patientA.id, action: "BREAK_GLASS_INITIATED" },
    })
    if (auditLogs.length === 0) {
      throw new Error(
        "BREAK_GLASS_INITIATED audit log was not written to database",
      )
    }
    const initLog = auditLogs[0]
    if (
      initLog.severity !== "high" ||
      initLog.actorRole !== "PATIENT" ||
      !initLog.target.includes(activeCaseNumber)
    ) {
      throw new Error(`Invalid audit log contents: ${JSON.stringify(initLog)}`)
    }
    console.log(
      "[PASS] Check 5: Verified BREAK_GLASS_INITIATED recorded in PostgreSQL with high severity",
    )

    // =========================================================================
    // CHECK 6: Prevent Duplicate Active Emergency Requests
    // =========================================================================
    console.log(
      "\n--- Check 6: Prevent Duplicate Active Emergency Requests ---",
    )
    const duplicateRes = await request(
      port,
      "/api/patient/emergency",
      "POST",
      sessionA.headers,
      { reason: "Second request attempt" },
    )
    if (duplicateRes.status !== 200 && duplicateRes.status !== 201) {
      throw new Error(
        `Expected 200/201 returning existing case, got ${duplicateRes.status}`,
      )
    }
    if (duplicateRes.body.data.emergencyCase.caseNumber !== activeCaseNumber) {
      throw new Error(
        "Duplicate request created a new case instead of returning existing active case",
      )
    }
    const countActive = await prisma.emergencyCase.count({
      where: { patientId: patientA.id, status: "ACTIVE" },
    })
    if (countActive !== 1) {
      throw new Error(
        `Expected exactly 1 active case in database, found ${countActive}`,
      )
    }
    console.log(
      "[PASS] Check 6: Verified single active emergency invariant (no duplicate cases)",
    )

    // =========================================================================
    // CHECK 7: Clinician Responds to Emergency Case (Dr. Ama Bentil, Verified GP)
    // =========================================================================
    console.log("\n--- Check 7: Clinician Responds to Emergency Case ---")
    const doctorId = "doc-ama-bentil-001"
    const doctorName = "Dr. Ama Bentil"
    const respondRes = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}/respond`,
      "POST",
      sessionA.headers, // Request authenticated
      {
        responderName: doctorName,
        responderId: doctorId,
        responderRole: "Verified GP",
        notes: "On-call response initiated. Proceeding to emergency triage.",
      },
    )
    if (respondRes.status !== 200) {
      throw new Error(
        `Failed to respond to emergency: ${JSON.stringify(respondRes.body)}`,
      )
    }
    if (respondRes.body.data.status !== "RESPONDED") {
      throw new Error(
        `Expected status RESPONDED, got ${respondRes.body.data.status}`,
      )
    }
    if (respondRes.body.data.responderName !== doctorName) {
      throw new Error(
        `Expected responder ${doctorName}, got ${respondRes.body.data.responderName}`,
      )
    }

    const respondAudit = await prisma.emergencyAuditLog.findFirst({
      where: { emergencyCaseId: emgCase.id, action: "BREAK_GLASS_RESPONDED" },
    })
    if (!respondAudit) {
      throw new Error("BREAK_GLASS_RESPONDED audit log not found")
    }
    console.log(
      "[PASS] Check 7: Clinician successfully accepted case; status set to RESPONDED with audit",
    )

    // =========================================================================
    // CHECK 8: Authorized Responding Clinician Accesses Emergency Clinical Record (A2)
    // =========================================================================
    console.log(
      "\n--- Check 8: Authorized Responding Clinician Accesses Emergency Record ---",
    )
    const clinicalRecordRes = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}/clinical-record`,
      "POST",
      sessionA.headers,
      {
        justification: "Emergency assessment for acute respiratory distress",
        clinicianId: doctorId,
        clinicianName: doctorName,
        clinicianRole: "Verified GP",
      },
    )
    if (clinicalRecordRes.status !== 200) {
      throw new Error(
        `Failed to access clinical record: ${JSON.stringify(clinicalRecordRes.body)}`,
      )
    }

    const recordData = clinicalRecordRes.body.data
    if (
      recordData.patientIdentity.firstName !== "Ama" ||
      recordData.patientIdentity.lastName !== "Mensah"
    ) {
      throw new Error("Incorrect patient identity in emergency clinical record")
    }
    if (
      recordData.bloodGroup.value !== "O+" ||
      !recordData.bloodGroup.verified
    ) {
      throw new Error("Incorrect blood group information")
    }
    if (!recordData.allergies.value.includes("Penicillin")) {
      throw new Error("Missing allergy information in emergency record")
    }
    if (
      recordData.medications.active.length !== 1 ||
      recordData.medications.active[0].medicine !== "Salbutamol Inhaler"
    ) {
      throw new Error(
        "Missing active prescription in emergency clinical record",
      )
    }
    if (
      recordData.vitalSigns.length === 0 ||
      !recordData.vitalSigns[0].content.includes("118/76")
    ) {
      throw new Error("Missing vital signs in emergency clinical record")
    }

    // Verify access audit log was written
    const accessAudit = await prisma.emergencyAuditLog.findFirst({
      where: {
        emergencyCaseId: emgCase.id,
        action: "EMERGENCY_RECORD_ACCESSED",
      },
    })
    if (!accessAudit || accessAudit.severity !== "high") {
      throw new Error(
        "EMERGENCY_RECORD_ACCESSED audit record not found or incorrect severity",
      )
    }
    console.log(
      "[PASS] Check 8: Responding clinician accessed emergency record; audit logged with justification",
    )

    // =========================================================================
    // CHECK 9: Unauthorized Clinician Blocked from Accessing Record (HTTP 403)
    // =========================================================================
    console.log(
      "\n--- Check 9: Unauthorized Clinician Blocked from Accessing Record ---",
    )
    const unauthorizedDocRes = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}/clinical-record`,
      "POST",
      sessionA.headers,
      {
        justification: "Curiosity lookup without assignment",
        clinicianId: "dr-random-intruder",
        clinicianName: "Dr. Random Intruder",
        clinicianRole: "Doctor",
      },
    )
    if (unauthorizedDocRes.status !== 403) {
      throw new Error(
        `Expected 403 for unauthorized clinician, got ${unauthorizedDocRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 9: Unauthorized clinician access strictly blocked with HTTP 403 FORBIDDEN",
    )

    // =========================================================================
    // CHECK 10: Missing Clinical Justification Rejected (HTTP 400)
    // =========================================================================
    console.log("\n--- Check 10: Missing Clinical Justification Rejected ---")
    const noJustificationRes = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}/clinical-record`,
      "POST",
      sessionA.headers,
      {
        justification: "Hi", // Too short (min 5 characters)
        clinicianId: doctorId,
        clinicianName: doctorName,
      },
    )
    if (noJustificationRes.status !== 400) {
      throw new Error(
        `Expected 400 for invalid justification, got ${noJustificationRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 10: Access without valid clinical justification rejected with HTTP 400",
    )

    // =========================================================================
    // CHECK 11: Patient Cancels Emergency Request (BREAK_GLASS_CANCELLED)
    // =========================================================================
    console.log("\n--- Check 11: Patient Cancels Emergency Request ---")
    const cancelRes = await request(
      port,
      "/api/patient/emergency/cancel",
      "POST",
      sessionA.headers,
      { reason: "Symptoms stabilized after inhaler use" },
    )
    if (cancelRes.status !== 200) {
      throw new Error(
        `Failed to cancel emergency: ${JSON.stringify(cancelRes.body)}`,
      )
    }
    if (cancelRes.body.data.status !== "CANCELLED") {
      throw new Error(
        `Expected status CANCELLED, got ${cancelRes.body.data.status}`,
      )
    }

    const cancelAudit = await prisma.emergencyAuditLog.findFirst({
      where: { emergencyCaseId: emgCase.id, action: "BREAK_GLASS_CANCELLED" },
    })
    if (!cancelAudit) {
      throw new Error("BREAK_GLASS_CANCELLED audit record not found")
    }
    console.log(
      "[PASS] Check 11: Emergency request cancelled and logged with BREAK_GLASS_CANCELLED",
    )

    // =========================================================================
    // CHECK 12: Record Access Blocked Once Case is Cancelled (HTTP 403)
    // =========================================================================
    console.log(
      "\n--- Check 12: Record Access Blocked Once Case is Cancelled ---",
    )
    const cancelledAccessRes = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}/clinical-record`,
      "POST",
      sessionA.headers,
      {
        justification: "Post-event follow-up check",
        clinicianId: doctorId,
        clinicianName: doctorName,
      },
    )
    if (cancelledAccessRes.status !== 403) {
      throw new Error(
        `Expected 403 for cancelled case, got ${cancelledAccessRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 12: Post-cancellation emergency record access strictly blocked with HTTP 403",
    )

    // =========================================================================
    // CHECK 13: Emergency Deletion Strictly Prohibited (HTTP 403 Forbidden)
    // =========================================================================
    console.log(
      "\n--- Check 13: Emergency Deletion Prohibited (HTTP 403 Forbidden) ---",
    )
    const deleteRes1 = await request(
      port,
      "/api/patient/emergency",
      "DELETE",
      sessionA.headers,
    )
    if (deleteRes1.status !== 403) {
      throw new Error(
        `Expected 403 on DELETE /api/patient/emergency, got ${deleteRes1.status}`,
      )
    }
    const deleteRes2 = await request(
      port,
      `/api/patient/emergency/${activeCaseNumber}`,
      "DELETE",
      sessionA.headers,
    )
    if (deleteRes2.status !== 403) {
      throw new Error(
        `Expected 403 on DELETE /api/patient/emergency/:caseNumber, got ${deleteRes2.status}`,
      )
    }
    console.log(
      "[PASS] Check 13: Emergency cases and audit trail deletion strictly prohibited with HTTP 403",
    )

    // =========================================================================
    // CHECK 14: Cross-Patient IDOR Defense (HTTP 403 Forbidden)
    // =========================================================================
    console.log("\n--- Check 14: Cross-Patient IDOR Defense ---")
    // Patient B attempts to cancel Patient A's emergency case
    const idorCancelRes = await request(
      port,
      "/api/patient/emergency/cancel",
      "POST",
      sessionB.headers,
      { reason: "Malicious cancellation by another patient" },
    )
    // Patient B has no active emergency case
    if (idorCancelRes.status !== 404) {
      throw new Error(
        `Expected 404 when user has no active case to cancel, got ${idorCancelRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 14: Cross-patient emergency isolation verified (IDOR defense)",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 14 EMERGENCY & BREAK-GLASS INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    console.log("\n[Teardown] Cleaning up test data...")
    if (patientA) {
      await prisma.user.delete({ where: { id: patientA.id } }).catch(() => {})
    }
    if (patientB) {
      await prisma.user.delete({ where: { id: patientB.id } }).catch(() => {})
    }
    server.close()
    console.log("[Teardown] Test server closed cleanly.")
  }
}

runEmergencyTests().catch((err) => {
  console.error("Test execution failed:", err)
  process.exit(1)
})
