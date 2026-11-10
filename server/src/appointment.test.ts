import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import { createAppointment } from "./services/appointmentService"
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

async function runAppointmentTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: APPOINTMENTS & SCHEDULING INTEGRATION & SECURITY TESTS",
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
    const p1Email = `apt.patient1.${Date.now()}@example.com`
    const p1Phone = `024${Math.floor(1000000 + Math.random() * 9000000)}`
    const regResult1 = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "AppointmentTest",
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
    const p2Email = `apt.patient2.${Date.now()}@example.com`
    const p2Phone = `024${Math.floor(1000000 + Math.random() * 9000000)}`
    const regResult2 = await registerPatient({
      account: {
        firstName: "Kweku",
        lastName: "AppointmentTest2",
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
      "/api/patient/appointments",
      "GET",
    )
    if (unauthGet.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated GET /appointments, got ${unauthGet.status}`,
      )
    }

    const unauthPost = await request(
      testPort,
      "/api/patient/appointments",
      "POST",
      {},
      { doctorName: "Dr. K" },
    )
    if (unauthPost.status !== 401) {
      throw new Error(
        `Expected 401 for unauthenticated POST /appointments, got ${unauthPost.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: Authentication strictly enforced on appointment endpoints (401)",
    )

    // -------------------------------------------------------------------------
    // Check 2: Prohibit Physical Deletion
    // -------------------------------------------------------------------------
    console.log("\n--- Check 2: Prohibit Physical Deletion ---")
    const deleteRes = await request(
      testPort,
      "/api/patient/appointments/fake-apt-id",
      "DELETE",
      p1Headers,
    )
    if (deleteRes.status !== 403) {
      throw new Error(
        `Expected 403 for physical appointment deletion, got ${deleteRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 2: Physical appointment deletion strictly prohibited with HTTP 403 Forbidden",
    )

    // -------------------------------------------------------------------------
    // Check 3: Create Appointment Booking
    // -------------------------------------------------------------------------
    console.log("\n--- Check 3: Create Appointment Booking ---")
    const bookingRes = await request(
      testPort,
      "/api/patient/appointments",
      "POST",
      p1Headers,
      {
        doctorName: "Dr. Kofi Boateng",
        department: "General Practice",
        type: "Follow-up Consultation",
        reason: "General consultation",
        date: "2026-10-25",
        time: "10:00 AM",
      },
    )
    if (bookingRes.status !== 201) {
      throw new Error(
        `Failed to book appointment: status=${bookingRes.status}, body=${JSON.stringify(bookingRes.body)}`,
      )
    }
    const apt1 = bookingRes.body.data
    if (
      !apt1.appointmentNumber.startsWith("APT-") ||
      !apt1.appointmentNumber.includes("-2026-")
    ) {
      throw new Error(
        `Invalid appointmentNumber format: ${apt1.appointmentNumber}`,
      )
    }
    if (apt1.doctor !== "Dr. Kofi Boateng" || apt1.status !== "CONFIRMED") {
      throw new Error(`Appointment data mismatch: ${JSON.stringify(apt1)}`)
    }
    console.log(
      `[PASS] Check 3: Appointment successfully booked: ${apt1.appointmentNumber} (201 Created)`,
    )

    // -------------------------------------------------------------------------
    // Check 4: Submit Post-Booking Intake
    // -------------------------------------------------------------------------
    console.log("\n--- Check 4: Submit Post-Booking Intake ---")
    const intakeRes = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/intake`,
      "PATCH",
      p1Headers,
      {
        symptoms: "Persistent headache and fatigue",
        duration: "3 days",
        severity: "Moderate",
        notes: "Worse in the morning after waking up",
      },
    )
    if (intakeRes.status !== 200) {
      throw new Error(`Failed to submit intake: status=${intakeRes.status}`)
    }
    const updatedWithIntake = intakeRes.body.data
    if (
      updatedWithIntake.symptoms !== "Persistent headache and fatigue" ||
      updatedWithIntake.severity !== "Moderate"
    ) {
      throw new Error(
        `Intake form data mismatch: ${JSON.stringify(updatedWithIntake)}`,
      )
    }
    console.log(
      "[PASS] Check 4: Post-booking intake successfully persisted on appointment record",
    )

    // -------------------------------------------------------------------------
    // Check 5: Retrieve Appointments by Tab (upcoming, completed, cancelled)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 5: Retrieve Appointments by Tab ---")
    // Seed a completed appointment for Patient 1
    const aptCompleted = await createAppointment(patient1Id, {
      doctorName: "Dr. Efua Asante",
      department: "Cardiology",
      type: "Specialist Review",
      reason: "Follow-up",
      date: "2026-08-12",
      time: "09:00 AM",
    })
    // Set status to COMPLETED directly
    await prisma.appointment.update({
      where: { appointmentNumber: aptCompleted.appointmentNumber },
      data: { status: AppointmentStatus.COMPLETED },
    })

    const upcomingList = await request(
      testPort,
      "/api/patient/appointments?tab=upcoming",
      "GET",
      p1Headers,
    )
    if (upcomingList.status !== 200 || upcomingList.body.data.length !== 1) {
      throw new Error(
        `Expected 1 upcoming appointment, got ${upcomingList.body.data?.length}`,
      )
    }

    const completedList = await request(
      testPort,
      "/api/patient/appointments?tab=completed",
      "GET",
      p1Headers,
    )
    if (completedList.status !== 200 || completedList.body.data.length !== 1) {
      throw new Error(
        `Expected 1 completed appointment, got ${completedList.body.data?.length}`,
      )
    }

    const cancelledList = await request(
      testPort,
      "/api/patient/appointments?tab=cancelled",
      "GET",
      p1Headers,
    )
    if (cancelledList.status !== 200 || cancelledList.body.data.length !== 0) {
      throw new Error(
        `Expected 0 cancelled appointments, got ${cancelledList.body.data?.length}`,
      )
    }
    console.log(
      "[PASS] Check 5: Appointments accurately filtered across tabs (upcoming, completed, cancelled)",
    )

    // -------------------------------------------------------------------------
    // Check 6: Single Appointment Lookup by UUID and appointmentNumber
    // -------------------------------------------------------------------------
    console.log("\n--- Check 6: Single Appointment Lookup ---")
    const getByNumber = await request(
      testPort,
      `/api/patient/appointments/${apt1.appointmentNumber}`,
      "GET",
      p1Headers,
    )
    if (
      getByNumber.status !== 200 ||
      getByNumber.body.data.id !== apt1.appointmentNumber
    ) {
      throw new Error(
        `Failed to lookup by appointmentNumber: status=${getByNumber.status}`,
      )
    }

    const getByUuid = await request(
      testPort,
      `/api/patient/appointments/${apt1.uuid}`,
      "GET",
      p1Headers,
    )
    if (getByUuid.status !== 200 || getByUuid.body.data.uuid !== apt1.uuid) {
      throw new Error(`Failed to lookup by UUID: status=${getByUuid.status}`)
    }

    const getNonExistent = await request(
      testPort,
      "/api/patient/appointments/APT-9999-0000",
      "GET",
      p1Headers,
    )
    if (getNonExistent.status !== 404) {
      throw new Error(
        `Expected 404 for non-existent appointment, got ${getNonExistent.status}`,
      )
    }
    console.log(
      "[PASS] Check 6: Appointment lookup by UUID and reference number succeeded",
    )

    // -------------------------------------------------------------------------
    // Check 7: Cross-Patient IDOR Defense
    // -------------------------------------------------------------------------
    console.log("\n--- Check 7: Cross-Patient IDOR Defense ---")
    const idorLookup = await request(
      testPort,
      `/api/patient/appointments/${apt1.appointmentNumber}`,
      "GET",
      p2Headers,
    )
    if (idorLookup.status !== 403) {
      throw new Error(
        `Expected 403 when Patient 2 accesses Patient 1 appointment, got ${idorLookup.status}`,
      )
    }
    console.log(
      "[PASS] Check 7: Cross-patient appointment access strictly blocked with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 8: Reschedule Upcoming Appointment
    // -------------------------------------------------------------------------
    console.log("\n--- Check 8: Reschedule Upcoming Appointment ---")
    const rescheduleRes = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/reschedule`,
      "PATCH",
      p1Headers,
      {
        date: "2026-10-28",
        time: "02:30 PM",
        reason: "Patient requested afternoon time slot",
      },
    )
    if (rescheduleRes.status !== 200) {
      throw new Error(`Failed to reschedule: status=${rescheduleRes.status}`)
    }
    const rescheduledApt = rescheduleRes.body.data
    if (
      rescheduledApt.time !== "02:30 PM" ||
      !rescheduledApt.date.includes("28")
    ) {
      throw new Error(
        `Rescheduled date/time mismatch: ${JSON.stringify(rescheduledApt)}`,
      )
    }
    console.log(
      "[PASS] Check 8: Appointment rescheduled with updated date/time and reason",
    )

    // -------------------------------------------------------------------------
    // Check 9: Soft Cancel Upcoming Appointment
    // -------------------------------------------------------------------------
    console.log("\n--- Check 9: Soft Cancel Upcoming Appointment ---")
    const cancelRes = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/cancel`,
      "POST",
      p1Headers,
      {
        reason: "Patient symptoms resolved prior to visit",
      },
    )
    if (cancelRes.status !== 200) {
      throw new Error(
        `Failed to cancel appointment: status=${cancelRes.status}`,
      )
    }
    const cancelledApt = cancelRes.body.data
    if (cancelledApt.status !== "CANCELLED" || !cancelledApt.cancelledAt) {
      throw new Error(
        `Cancelled appointment state mismatch: ${JSON.stringify(cancelledApt)}`,
      )
    }

    // Verify presence in cancelled tab and removal from upcoming tab
    const postCancelUpcoming = await request(
      testPort,
      "/api/patient/appointments?tab=upcoming",
      "GET",
      p1Headers,
    )
    if (postCancelUpcoming.body.data.length !== 0) {
      throw new Error("Cancelled appointment still appearing in upcoming tab")
    }

    const postCancelCancelled = await request(
      testPort,
      "/api/patient/appointments?tab=cancelled",
      "GET",
      p1Headers,
    )
    if (postCancelCancelled.body.data.length !== 1) {
      throw new Error("Cancelled appointment missing from cancelled tab")
    }
    console.log(
      "[PASS] Check 9: Soft-cancellation preserved audit trail and moved item to cancelled tab",
    )

    // -------------------------------------------------------------------------
    // Check 10: Reject Rescheduling/Cancelling Already Cancelled Appointment
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 10: Reject Actions on Already Cancelled Appointment ---",
    )
    const repeatCancel = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/cancel`,
      "POST",
      p1Headers,
      { reason: "Already cancelled" },
    )
    if (repeatCancel.status !== 400) {
      throw new Error(
        `Expected 400 when cancelling already cancelled appointment, got ${repeatCancel.status}`,
      )
    }

    const rescheduleCancelled = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/reschedule`,
      "PATCH",
      p1Headers,
      {
        date: "2026-11-01",
        time: "10:00 AM",
      },
    )
    if (rescheduleCancelled.status !== 400) {
      throw new Error(
        `Expected 400 when rescheduling cancelled appointment, got ${rescheduleCancelled.status}`,
      )
    }
    console.log(
      "[PASS] Check 10: Redundant cancellation and invalid rescheduling rejected with HTTP 400",
    )

    // -------------------------------------------------------------------------
    // Check 11: Cross-Patient IDOR on Reschedule & Cancel
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: Cross-Patient IDOR on Mutation ---")
    const idorReschedule = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/reschedule`,
      "PATCH",
      p2Headers,
      {
        date: "2026-11-01",
        time: "10:00 AM",
      },
    )
    if (idorReschedule.status !== 403) {
      throw new Error(
        `Expected 403 on IDOR reschedule, got ${idorReschedule.status}`,
      )
    }

    const idorCancel = await request(
      testPort,
      `/api/patient/appointments/${apt1.id}/cancel`,
      "POST",
      p2Headers,
      { reason: "Malicious cancel" },
    )
    if (idorCancel.status !== 403) {
      throw new Error(`Expected 403 on IDOR cancel, got ${idorCancel.status}`)
    }
    console.log(
      "[PASS] Check 11: Cross-patient reschedule and cancellation strictly rejected with HTTP 403",
    )

    // -------------------------------------------------------------------------
    // Check 12: Dashboard Overview Reflects Next Appointment
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 12: Dashboard Overview Reflects Next Appointment ---",
    )
    // Create an active upcoming appointment for Patient 1
    const nextVisit = await createAppointment(patient1Id, {
      doctorName: "Dr. Kofi Boateng",
      department: "General Practice",
      type: "Initial Consultation",
      reason: "General consultation",
      date: "2026-11-15",
      time: "11:30 AM",
    })

    const dashRes = await request(
      testPort,
      "/api/patient/dashboard",
      "GET",
      p1Headers,
    )
    if (dashRes.status !== 200) {
      throw new Error(`Dashboard retrieval failed: status=${dashRes.status}`)
    }
    const nextAptInDash = dashRes.body.data.metrics.nextAppointment
    if (
      !nextAptInDash ||
      nextAptInDash.doctor !== "Dr. Kofi Boateng" ||
      nextAptInDash.time !== "11:30 AM"
    ) {
      throw new Error(
        `Next appointment in dashboard mismatch: ${JSON.stringify(nextAptInDash)}`,
      )
    }
    console.log(
      `[PASS] Check 12: Dashboard displays next appointment: ${nextAptInDash.doctor} on ${nextAptInDash.date} (${nextAptInDash.time})`,
    )

    // -------------------------------------------------------------------------
    // Check 13: Database Persistence Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Check 13: Database Persistence Verification ---")
    const dbAppointments = await prisma.appointment.findMany({
      where: { patientId: patient1Id },
    })
    if (dbAppointments.length !== 3) {
      throw new Error(
        `Expected 3 appointments in database, found ${dbAppointments.length}`,
      )
    }
    console.log(
      "[PASS] Check 13: All appointments and state transitions reliably persisted in PostgreSQL",
    )

    console.log(
      "================================================================================",
    )
    console.log(
      "ALL 13 APPOINTMENTS & SCHEDULING INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
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

runAppointmentTests().catch((err) => {
  console.error("Appointment test failed:", err)
  process.exit(1)
})
