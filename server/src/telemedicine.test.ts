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
  AppointmentStatus,
} from "./generated/prisma/enums"
import { telemedicineService } from "./services/telemedicineService"
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

async function runTelemedicineTests() {
  console.log("=".repeat(80))
  console.log("HEALTHITUDE: TELEMEDICINE BACKEND & FRONTEND INTEGRATION TESTS")
  console.log("=".repeat(80))

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const address = server.address() as any
  const port = address.port
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`)

  let patientA: any
  let patientB: any
  let patientASession: any
  let patientBSession: any
  let appointmentA: any
  let cancelledAppointmentA: any
  let completedAppointmentA: any

  try {
    telemedicineService._clearForTesting()

    // 1. Setup Patient A
    const emailA = `patient.tele.a.${Date.now()}@example.com`
    const regA = await registerPatient({
      account: {
        firstName: "Kwame",
        lastName: "Asare",
        dateOfBirth: new Date("1988-03-21"),
        sex: Sex.MALE,
        email: emailA,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "7 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Abena Asare",
          relationship: "SPOUSE_PARTNER",
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
    patientA = regA.user
    patientASession = await createAuthenticatedSession(patientA.id)

    // 2. Setup Patient B
    const emailB = `patient.tele.b.${Date.now()}@example.com`
    const regB = await registerPatient({
      account: {
        firstName: "Akua",
        lastName: "Osei",
        dateOfBirth: new Date("1992-07-15"),
        sex: Sex.FEMALE,
        email: emailB,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "14 Airport Res",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kwesi Osei",
          relationship: "SIBLING",
          phoneNumber: "+233240003344",
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
    patientBSession = await createAuthenticatedSession(patientB.id)

    // 3. Setup Appointments for Patient A
    const apptDate = new Date()
    apptDate.setDate(apptDate.getDate() + 2)

    appointmentA = await prisma.appointment.create({
      data: {
        appointmentNumber: `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: patientA.id,
        doctorName: "Dr. Kofi Boateng",
        department: "General Practice",
        type: "Video Consultation",
        reason: "Follow-up on persistent migraine",
        date: apptDate,
        time: "10:00 AM",
        status: AppointmentStatus.CONFIRMED,
      },
    })

    cancelledAppointmentA = await prisma.appointment.create({
      data: {
        appointmentNumber: `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: patientA.id,
        doctorName: "Dr. Efua Asante",
        department: "Cardiology",
        type: "Video Consultation",
        reason: "Routine cardiac check",
        date: apptDate,
        time: "02:00 PM",
        status: AppointmentStatus.CANCELLED,
        cancellationReason: "Schedule conflict",
        cancelledAt: new Date(),
      },
    })

    completedAppointmentA = await prisma.appointment.create({
      data: {
        appointmentNumber: `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: patientA.id,
        doctorName: "Dr. Ama Bentil",
        department: "General Practice",
        type: "Video Consultation",
        reason: "Annual health check",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        time: "11:00 AM",
        status: AppointmentStatus.COMPLETED,
      },
    })

    // -------------------------------------------------------------------------
    // Check 1: Authentication Requirement (401)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 1: Unauthenticated Telemedicine Start Blocked ---")
    const unauthRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "POST",
      {},
    )
    if (unauthRes.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated request, got ${unauthRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Unauthenticated telemedicine request rejected with HTTP 401",
    )

    // -------------------------------------------------------------------------
    // Check 2: CSRF Defense (403)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 2: Missing CSRF Token Blocked ---")
    const noCsrfRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "POST",
      {
        Cookie: `${SESSION_COOKIE_NAME}=${patientASession.rawToken}`,
      },
    )
    if (noCsrfRes.status !== 403) {
      throw new Error(
        `Expected 403 for missing CSRF token, got ${noCsrfRes.status}`,
      )
    }
    console.log("[PASS] Check 2: Missing CSRF token rejected with HTTP 403")

    // -------------------------------------------------------------------------
    // Check 3: Non-Existent Appointment (404)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 3: Non-Existent Appointment Returns 404 ---")
    const notFoundRes = await request(
      port,
      "/api/patient/appointments/APT-9999-0000/telemedicine",
      "POST",
      patientASession.headers,
    )
    if (notFoundRes.status !== 404) {
      throw new Error(
        `Expected 404 for non-existent appointment, got ${notFoundRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 3: Non-existent appointment rejected with HTTP 404",
    )

    // -------------------------------------------------------------------------
    // Check 4: Cross-Patient IDOR on Session Start (403)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 4: Cross-Patient IDOR on Telemedicine Start Blocked ---",
    )
    const idorRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "POST",
      patientBSession.headers,
    )
    if (idorRes.status !== 403) {
      throw new Error(
        `Expected 403 for cross-patient session start, got ${idorRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 4: Cross-patient IDOR strictly blocked with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 5: Cancelled Appointment Rejection (400)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 5: Cancelled Appointment Telemedicine Start Blocked ---",
    )
    const cancelledRes = await request(
      port,
      `/api/patient/appointments/${cancelledAppointmentA.appointmentNumber}/telemedicine`,
      "POST",
      patientASession.headers,
    )
    if (cancelledRes.status !== 400) {
      throw new Error(
        `Expected 400 for cancelled appointment, got ${cancelledRes.status}`,
      )
    }
    console.log(
      `[PASS] Check 5: Cancelled appointment rejected with HTTP 400 (${cancelledRes.body?.message})`,
    )

    // -------------------------------------------------------------------------
    // Check 6: Valid Telemedicine Initiation (200 / 201)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 6: Authorized Telemedicine Session Initiation ---")
    const startRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "POST",
      patientASession.headers,
      { deviceType: "Desktop Chrome", browser: "Chrome 124" },
    )
    if (startRes.status !== 200 && startRes.status !== 201) {
      throw new Error(
        `Expected 200/201, got ${startRes.status}: ${JSON.stringify(startRes.body)}`,
      )
    }

    const sessionData = startRes.body.data
    if (!sessionData.sessionId || !sessionData.sessionNumber) {
      throw new Error("Missing sessionId or sessionNumber in response")
    }
    if (!/^TLS-\d{4}-\d{4}$/.test(sessionData.sessionNumber)) {
      throw new Error(
        `sessionNumber does not match TLS-YYYY-XXXX: ${sessionData.sessionNumber}`,
      )
    }
    if (!sessionData.roomToken || sessionData.roomToken.length < 32) {
      throw new Error("Invalid cryptographic roomToken")
    }
    if (sessionData.status !== "IN_PROGRESS") {
      throw new Error(`Expected status IN_PROGRESS, got ${sessionData.status}`)
    }
    if (!sessionData.roomName.startsWith("healthitude-room-")) {
      throw new Error(`Unexpected roomName: ${sessionData.roomName}`)
    }
    if (sessionData.doctorName !== "Dr. Kofi Boateng") {
      throw new Error(`Unexpected doctorName: ${sessionData.doctorName}`)
    }

    // Verify database sync: appointment.schedulingUrl updated
    const updatedApt = await prisma.appointment.findUnique({
      where: { id: appointmentA.id },
    })
    if (
      !updatedApt?.schedulingUrl ||
      !updatedApt.schedulingUrl.includes(sessionData.sessionNumber)
    ) {
      throw new Error(
        `Appointment schedulingUrl not updated in database: ${updatedApt?.schedulingUrl}`,
      )
    }

    console.log(
      `[PASS] Check 6: Telemedicine session active: ${sessionData.sessionNumber}, Room: ${sessionData.roomName}`,
    )
    console.log(
      `       Verified schedulingUrl updated in PostgreSQL: ${updatedApt.schedulingUrl}`,
    )

    // -------------------------------------------------------------------------
    // Check 7: Idempotent Re-join of Active Session
    // -------------------------------------------------------------------------
    console.log("\n--- Check 7: Idempotent Session Re-join ---")
    const rejoinRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "POST",
      patientASession.headers,
    )
    if (rejoinRes.status !== 200) {
      throw new Error(`Expected 200 on rejoin, got ${rejoinRes.status}`)
    }
    if (rejoinRes.body.data.sessionNumber !== sessionData.sessionNumber) {
      throw new Error(
        "Rejoining active session created new session instead of returning active session",
      )
    }
    console.log(
      "[PASS] Check 7: Idempotent rejoin returned existing active session token and room",
    )

    // -------------------------------------------------------------------------
    // Check 8: Retrieve Session by Appointment Identifier
    // -------------------------------------------------------------------------
    console.log("\n--- Check 8: GET Telemedicine Session by Appointment ---")
    const getByAptRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "GET",
      patientASession.headers,
    )
    if (getByAptRes.status !== 200) {
      throw new Error(`Expected 200, got ${getByAptRes.status}`)
    }
    if (getByAptRes.body.data.sessionId !== sessionData.sessionId) {
      throw new Error("Retrieved session does not match initiated session")
    }
    console.log(
      "[PASS] Check 8: Retrieved active session details via appointment identifier",
    )

    // -------------------------------------------------------------------------
    // Check 9: Cross-Patient IDOR on Session Retrieval (403)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 9: Cross-Patient IDOR on Session Retrieval Blocked ---",
    )
    const getOtherRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "GET",
      patientBSession.headers,
    )
    if (getOtherRes.status !== 403) {
      throw new Error(
        `Expected 403 on IDOR retrieval, got ${getOtherRes.status}`,
      )
    }

    const getByIdOtherRes = await request(
      port,
      `/api/patient/telemedicine/sessions/${sessionData.sessionId}`,
      "GET",
      patientBSession.headers,
    )
    if (getByIdOtherRes.status !== 403) {
      throw new Error(
        `Expected 403 on session IDOR retrieval, got ${getByIdOtherRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 9: Cross-patient session queries strictly blocked with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 10: Session Termination & Audit Metrics
    // -------------------------------------------------------------------------
    console.log("\n--- Check 10: End Telemedicine Session & Record Metrics ---")
    const endRes = await request(
      port,
      `/api/patient/telemedicine/sessions/${sessionData.sessionId}/end`,
      "POST",
      patientASession.headers,
      { exitReason: "Consultation concluded normally" },
    )
    if (endRes.status !== 200) {
      throw new Error(
        `Expected 200 on session end, got ${endRes.status}: ${JSON.stringify(endRes.body)}`,
      )
    }

    const endedData = endRes.body.data
    if (endedData.status !== "ENDED") {
      throw new Error(`Expected status ENDED, got ${endedData.status}`)
    }
    if (!endedData.endedAt) {
      throw new Error("endedAt was not recorded")
    }
    if (
      typeof endedData.durationSeconds !== "number" ||
      endedData.durationSeconds < 0
    ) {
      throw new Error(`Invalid durationSeconds: ${endedData.durationSeconds}`)
    }
    if (!endedData.formattedDuration) {
      throw new Error("formattedDuration missing")
    }
    if (endedData.exitReason !== "Consultation concluded normally") {
      throw new Error(`Unexpected exitReason: ${endedData.exitReason}`)
    }
    console.log(
      `[PASS] Check 10: Session successfully ended. Duration: ${endedData.formattedDuration} (${endedData.durationSeconds}s)`,
    )

    // -------------------------------------------------------------------------
    // Check 11: CRITICAL CLINICAL GOVERNANCE - Appointment Status Not Auto-Completed
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 11: Clinical Governance - Appointment Status Not Auto-Completed ---",
    )
    const aptAfterEnd = await prisma.appointment.findUnique({
      where: { id: appointmentA.id },
    })
    if (aptAfterEnd?.status === AppointmentStatus.COMPLETED) {
      throw new Error(
        "VIOLATION: Appointment status was automatically marked COMPLETED upon exiting the video room!",
      )
    }
    if (aptAfterEnd?.status !== AppointmentStatus.CONFIRMED) {
      throw new Error(
        `Appointment status altered unexpectedly: ${aptAfterEnd?.status}`,
      )
    }

    // Verify no synthetic clinical record was generated
    const records = await prisma.clinicalRecord.findMany({
      where: { patientId: patientA.id },
    })
    if (records.length > 0) {
      throw new Error(
        "VIOLATION: Clinical records were fabricated during patient telemedicine flow!",
      )
    }

    console.log(
      "[PASS] Check 11: Appointment status preserved as CONFIRMED (no auto-completion).",
    )
    console.log("       Verified 0 synthetic clinical records were fabricated.")

    // -------------------------------------------------------------------------
    // Check 12: Cannot Start Session for Completed Appointment (400)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 12: Telemedicine Start on Completed Appointment Blocked ---",
    )
    const completedRes = await request(
      port,
      `/api/patient/appointments/${completedAppointmentA.appointmentNumber}/telemedicine`,
      "POST",
      patientASession.headers,
    )
    if (completedRes.status !== 400) {
      throw new Error(
        `Expected 400 on completed appointment, got ${completedRes.status}`,
      )
    }
    console.log(
      `[PASS] Check 12: Completed appointment rejected with HTTP 400 (${completedRes.body?.message})`,
    )

    // -------------------------------------------------------------------------
    // Check 13: Audit Record Deletion Strictly Blocked (403)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 13: Audit Record Deletion Blocked (HTTP 403 Forbidden) ---",
    )
    const deleteSessionRes = await request(
      port,
      `/api/patient/telemedicine/sessions/${sessionData.sessionId}`,
      "DELETE",
      patientASession.headers,
    )
    if (deleteSessionRes.status !== 403) {
      throw new Error(
        `Expected 403 on session DELETE, got ${deleteSessionRes.status}`,
      )
    }

    const deleteAptTeleRes = await request(
      port,
      `/api/patient/appointments/${appointmentA.appointmentNumber}/telemedicine`,
      "DELETE",
      patientASession.headers,
    )
    if (deleteAptTeleRes.status !== 403) {
      throw new Error(
        `Expected 403 on appointment telemedicine DELETE, got ${deleteAptTeleRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 13: Consultation audit deletion strictly prohibited with HTTP 403 FORBIDDEN",
    )

    console.log("\n" + "=".repeat(80))
    console.log(
      "ALL 13 TELEMEDICINE INTEGRATION & SECURITY CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log("=".repeat(80) + "\n")
  } finally {
    // Teardown
    console.log("[Teardown] Cleaning up test data...")
    if (appointmentA) {
      await prisma.appointment.deleteMany({
        where: {
          id: {
            in: [
              appointmentA.id,
              cancelledAppointmentA?.id,
              completedAppointmentA?.id,
            ].filter(Boolean),
          },
        },
      })
    }
    if (patientA) {
      await prisma.user.delete({ where: { id: patientA.id } })
    }
    if (patientB) {
      await prisma.user.delete({ where: { id: patientB.id } })
    }
    telemedicineService._clearForTesting()

    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
    console.log("[Teardown] Test server closed cleanly.")
  }
}

runTelemedicineTests().catch((err) => {
  console.error("Telemedicine test suite failed:", err)
  process.exit(1)
})
