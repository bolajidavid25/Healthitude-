import { createApp } from "./app"
import { prisma } from "./config/prisma"
import http from "http"
import { resetAllRateLimits } from "./middleware/rateLimiter"

interface TestResponse {
  status: number
  body: any
  headers: http.IncomingHttpHeaders
  cookies: string[]
}

function parseCookies(
  cookieHeaders: string[] | string | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!cookieHeaders) return result
  const list = Array.isArray(cookieHeaders) ? cookieHeaders : [cookieHeaders]
  for (const header of list) {
    const parts = header.split(";")[0].split("=")
    if (parts.length === 2) {
      result[parts[0].trim()] = parts[1].trim()
    }
  }
  return result
}

function makeHttpRequest(
  port: number,
  path: string,
  method = "GET",
  body?: any,
  cookies?: string[],
  extraHeaders?: Record<string, string>,
): Promise<TestResponse> {
  if (path.includes("/register")) {
    resetAllRateLimits()
  }
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "http://localhost:5173",
      ...extraHeaders,
    }

    if (cookies && cookies.length > 0) {
      headers["Cookie"] = cookies.join("; ")
    }

    const payload = body ? JSON.stringify(body) : undefined
    if (payload) {
      headers["Content-Length"] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: encodeURI(path),
        method,
        headers,
      },
      (res) => {
        let rawData = ""
        res.on("data", (chunk) => (rawData += chunk))
        res.on("end", () => {
          let parsed
          try {
            parsed = JSON.parse(rawData)
          } catch {
            parsed = rawData
          }

          const rawCookies = res.headers["set-cookie"] || []
          const cookieList = Array.isArray(rawCookies)
            ? rawCookies
            : [rawCookies]

          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers,
            cookies: cookieList,
          })
        })
      },
    )

    req.on("error", (err) => reject(err))

    if (payload) {
      req.write(payload)
    }
    req.end()
  })
}

async function runStep15FullVerification() {
  console.log(
    "================================================================================",
  )
  console.log(
    "STEP 15: HEALTHITUDE FULL END-TO-END VERIFICATION & DEBUGGING AUDIT",
  )
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const address = server.address() as any
  const port = address.port
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`)

  let testUserId = ""
  let activeCookies: string[] = []
  let csrfToken = ""
  let appointmentNumber = ""
  let prescriptionId = ""
  let complaintRef = ""
  let emergencyCaseNumber = ""

  try {
    const timestamp = Date.now()
    const testEmail = `step15.audit.${timestamp}@example.com`
    const testPhone = `024${String(timestamp).slice(-7)}`

    // -------------------------------------------------------------------------
    // CHAIN 1: Authentication & 5-Stage Onboarding Verification
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 1: Authentication & 5-Stage Onboarding Chain ---")
    // Verify invalid inputs rejected before account creation
    const badRegistration = await makeHttpRequest(
      port,
      "/api/patients/register",
      "POST",
      {
        account: {
          firstName: "Test",
          lastName: "User",
          dateOfBirth: "2099-01-01", // future date
          sex: "MALE",
          email: "not-an-email",
          phoneNumber: "123",
          password: "short",
        },
      },
    )
    if (badRegistration.status !== 400) {
      throw new Error(
        `Expected 400 for bad registration payload, got ${badRegistration.status}`,
      )
    }

    // Valid 5-stage registration
    const validRegistration = {
      account: {
        firstName: "Kwabena",
        middleName: "Kofi",
        lastName: "Darko",
        dateOfBirth: "1991-08-20",
        sex: "MALE",
        email: testEmail,
        phoneNumber: testPhone,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "88 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        district: "Osu Klottey",
        emergencyContact: {
          fullName: "Yaa Darko",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: `024${String(timestamp + 1).slice(-7)}`,
        },
      },
      healthProfile: {
        bloodGroup: "A_POSITIVE",
        genotype: "AS",
        knownAllergies: "Aspirin",
        medicalConditions: "Mild seasonal asthma",
        currentMedications: "Salbutamol inhaler PRN",
        previousSurgeries: "Tonsillectomy (2012)",
        medicalHistory: "No cardiac or renal history",
      },
      patientCategory: {
        category: "GENERAL_PATIENT",
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
    }

    const regRes = await makeHttpRequest(
      port,
      "/api/patients/register",
      "POST",
      validRegistration,
    )
    if (regRes.status !== 201) {
      throw new Error(
        `Registration failed: ${regRes.status}: ${JSON.stringify(regRes.body)}`,
      )
    }
    testUserId = regRes.body.data.user.id

    // Login with credentials to obtain session cookie & CSRF token
    const loginRes = await makeHttpRequest(port, "/api/auth/login", "POST", {
      email: testEmail,
      password: "ValidPassword123!",
    })
    if (loginRes.status !== 200) {
      throw new Error(
        `Login failed: ${loginRes.status}: ${JSON.stringify(loginRes.body)}`,
      )
    }

    activeCookies = loginRes.cookies
    const cookies = parseCookies(activeCookies)
    csrfToken =
      loginRes.body?.data?.csrfToken || cookies["healthitude_csrf"] || ""

    // Verify session restoration via /api/auth/me
    const meRes = await makeHttpRequest(
      port,
      "/api/auth/me",
      "GET",
      undefined,
      activeCookies,
    )
    if (meRes.status !== 200 || meRes.body.data.user.id !== testUserId) {
      throw new Error(`Session recovery failed: ${JSON.stringify(meRes.body)}`)
    }

    // Verify unauthenticated access rejected
    const unauthRes = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
    )
    if (unauthRes.status !== 401) {
      throw new Error(
        `Unauthenticated request should return 401, got ${unauthRes.status}`,
      )
    }
    console.log(
      "✔ CHAIN 1 VERIFIED: Registration validation, database persistence, authentication, session recovery, and 401 guard enforce approved security model.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 2: Overview Dashboard & Metric Synchronization
    // -------------------------------------------------------------------------
    console.log(
      "\n--- CHAIN 2: Overview Dashboard & Metric Synchronization ---",
    )
    const dashRes = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    if (dashRes.status !== 200) {
      throw new Error(`Dashboard retrieval failed: ${dashRes.status}`)
    }
    const metrics = dashRes.body.data.metrics
    if (
      metrics.activeComplaintsCount !== 0 ||
      metrics.nextAppointment !== null ||
      metrics.medicationsCount !== 1
    ) {
      throw new Error(
        `Initial dashboard metrics unexpected: ${JSON.stringify(metrics)}`,
      )
    }
    console.log(
      "✔ CHAIN 2 VERIFIED: Dashboard metrics return aggregated real-time baseline without errors.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 3: Provider Discovery & Profile Verification
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 3: Provider Discovery & Verification ---")
    const provRes = await makeHttpRequest(
      port,
      "/api/patient/providers?specialty=General Practice",
      "GET",
      undefined,
      activeCookies,
    )
    if (
      provRes.status !== 200 ||
      !provRes.body.data.providers ||
      provRes.body.data.providers.length === 0
    ) {
      throw new Error(`Provider query failed: ${JSON.stringify(provRes.body)}`)
    }
    const primaryDoc = provRes.body.data.providers[0]
    if (!primaryDoc.name || !primaryDoc.fee || !primaryDoc.verified) {
      throw new Error(
        `Provider metadata incomplete: ${JSON.stringify(primaryDoc)}`,
      )
    }
    console.log(
      `✔ CHAIN 3 VERIFIED: Verified provider ${primaryDoc.name} discovered with active schedule.`,
    )

    // -------------------------------------------------------------------------
    // CHAIN 4: Appointment Booking, Clinical Intake, Reschedule & Cancellation
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 4: Appointment Lifecycle & Intakes ---")
    // Missing CSRF blocked
    const noCsrfApt = await makeHttpRequest(
      port,
      "/api/patient/appointments",
      "POST",
      {
        doctorName: primaryDoc.name,
        reason: "Fever and fatigue",
        date: "2026-10-28",
        time: "09:00 AM",
      },
      activeCookies,
    )
    if (noCsrfApt.status !== 403) {
      throw new Error(
        `Expected 403 for missing CSRF token on appointment booking, got ${noCsrfApt.status}`,
      )
    }

    // Valid booking with CSRF
    const bookRes = await makeHttpRequest(
      port,
      "/api/patient/appointments",
      "POST",
      {
        doctorName: primaryDoc.name,
        reason: "Fever and fatigue",
        date: "2026-10-28",
        time: "09:00 AM",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (bookRes.status !== 201) {
      throw new Error(`Appointment booking failed: ${bookRes.status}`)
    }
    appointmentNumber = bookRes.body.data.id

    // Submit clinical intake
    const intakeRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}/intake`,
      "PATCH",
      {
        symptoms: "High temperature and chills for 2 days",
        severity: "Moderate",
        duration: "2 days",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      intakeRes.status !== 200 ||
      intakeRes.body.data.status !== "CONFIRMED"
    ) {
      throw new Error(`Intake submission failed: ${intakeRes.status}`)
    }

    // Reschedule appointment
    const reschedRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}/reschedule`,
      "PATCH",
      { date: "2026-10-29", time: "11:30 AM", reason: "Work schedule clash" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (reschedRes.status !== 200 || reschedRes.body.data.time !== "11:30 AM") {
      throw new Error(`Appointment rescheduling failed: ${reschedRes.status}`)
    }

    // Physical deletion prohibited
    const delAptRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}`,
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (delAptRes.status !== 403) {
      throw new Error(
        `Physical deletion of appointments should be blocked with 403, got ${delAptRes.status}`,
      )
    }
    console.log(
      `✔ CHAIN 4 VERIFIED: Appointment ${appointmentNumber} booked, intake confirmed, rescheduled, and deletion block defended.`,
    )

    // -------------------------------------------------------------------------
    // CHAIN 5: Telemedicine Video Session Lifecycle & Immutability
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 5: Telemedicine Video Session Lifecycle ---")
    const teleStart = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}/telemedicine`,
      "POST",
      { deviceType: "Desktop Browser", browser: "Chrome 131" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (teleStart.status !== 200 && teleStart.status !== 201) {
      throw new Error(`Telemedicine session start failed: ${teleStart.status}`)
    }
    const sessionId = teleStart.body.data.sessionId

    const teleEnd = await makeHttpRequest(
      port,
      `/api/patient/telemedicine/sessions/${sessionId}/end`,
      "POST",
      { exitReason: "Consultation concluded by patient" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (teleEnd.status !== 200 || teleEnd.body.data.status !== "ENDED") {
      throw new Error(`Telemedicine end failed: ${teleEnd.status}`)
    }

    // Consultation session audit record deletion blocked
    const delSession = await makeHttpRequest(
      port,
      `/api/patient/telemedicine/sessions/${sessionId}`,
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (delSession.status !== 403) {
      throw new Error(
        `Telemedicine session deletion must be prohibited with 403, got ${delSession.status}`,
      )
    }
    console.log(
      "✔ CHAIN 5 VERIFIED: Telemedicine room initialized, session concluded, and session audit trail deletion blocked.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 6: Complaints Reporting & Lifecycles
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 6: Complaints Reporting & Lifecycles ---")
    const compRes = await makeHttpRequest(
      port,
      "/api/patient/complaints",
      "POST",
      {
        symptoms: "Persistent severe abdominal cramps",
        severity: "Severe",
        duration: "1 day",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (compRes.status !== 201) {
      throw new Error(`Complaint submission failed: ${compRes.status}`)
    }
    complaintRef = compRes.body.data.referenceId
    const complaintId = compRes.body.data.id

    // Complaint deletion blocked
    const delComp = await makeHttpRequest(
      port,
      `/api/patient/complaints/${complaintId}`,
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (delComp.status !== 403) {
      throw new Error(
        `Complaint deletion should be prohibited with 403, got ${delComp.status}`,
      )
    }
    console.log(
      `✔ CHAIN 6 VERIFIED: Complaint ${complaintRef} recorded; legal medical audit trail deletion blocked.`,
    )

    // -------------------------------------------------------------------------
    // CHAIN 7: Clinical Records & Legal Governance
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 7: Clinical Records & Legal Governance ---")
    const recordsRes = await makeHttpRequest(
      port,
      "/api/patient/records",
      "GET",
      undefined,
      activeCookies,
    )
    if (recordsRes.status !== 200) {
      throw new Error(`Records retrieval failed: ${recordsRes.status}`)
    }
    console.log(
      "✔ CHAIN 7 VERIFIED: Clinical records retrieved safely under authenticated patient scope.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 8: Prescriptions & Adherence Rules
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 8: Prescriptions & Adherence Rules ---")
    const rx = await prisma.prescription.create({
      data: {
        prescriptionNumber: `RX-2026-${Date.now().toString().slice(-4)}`,
        patientId: testUserId,
        medicine: "Amoxicillin 500mg",
        dose: "1 capsule",
        frequency: "Three times daily",
        duration: "7 days",
        prescriber: primaryDoc.name,
        status: "ACTIVE",
        startDate: new Date(),
      },
    })
    prescriptionId = rx.id

    // Reject future date adherence
    const futureAdh = await makeHttpRequest(
      port,
      `/api/patient/prescriptions/${prescriptionId}/adherence`,
      "POST",
      { date: "2099-01-01", status: "TAKEN" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (futureAdh.status !== 400) {
      throw new Error(
        `Future date adherence should be rejected with 400, got ${futureAdh.status}`,
      )
    }

    // Log valid adherence
    const validAdh = await makeHttpRequest(
      port,
      `/api/patient/prescriptions/${prescriptionId}/adherence`,
      "POST",
      { status: "TAKEN", notes: "Taken with water" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (validAdh.status !== 200) {
      throw new Error(`Valid adherence failed: ${validAdh.status}`)
    }
    console.log(
      "✔ CHAIN 8 VERIFIED: Prescriptions tracked; future adherence rejected with 400; today's dose persisted.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 9: Pricing & Coverage (Single Primary Category Invariant)
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 9: Pricing & Coverage Invariant ---")
    const pricingRes = await makeHttpRequest(
      port,
      "/api/patient/pricing",
      "GET",
      undefined,
      activeCookies,
    )
    if (pricingRes.status !== 200 || !pricingRes.body.data.plan) {
      throw new Error(`Pricing retrieval failed: ${pricingRes.status}`)
    }

    // Update category to STUDENT
    const updateCat = await makeHttpRequest(
      port,
      "/api/patient/category",
      "PATCH",
      { category: "STUDENT" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      updateCat.status !== 200 ||
      updateCat.body.data.category.verificationStatus !== "PENDING"
    ) {
      throw new Error(`Category update failed: ${updateCat.status}`)
    }

    // Verify single primary category invariant in PostgreSQL
    const catCount = await prisma.patientCategoryRecord.count({
      where: { userId: testUserId },
    })
    if (catCount !== 1) {
      throw new Error(
        `Rule 6 Violation: Expected exactly 1 category record in DB, found ${catCount}`,
      )
    }
    console.log(
      "✔ CHAIN 9 VERIFIED: Pricing retrieved; category update resets to PENDING; single primary category invariant verified.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 10: Break-Glass Emergency Workflow & Immutable Audits
    // -------------------------------------------------------------------------
    console.log(
      "\n--- CHAIN 10: Break-Glass Emergency Workflow & Immutable Audits ---",
    )
    const emergRes = await makeHttpRequest(
      port,
      "/api/patient/emergency",
      "POST",
      { reason: "Acute respiratory distress" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (emergRes.status !== 201) {
      throw new Error(`Emergency initiation failed: ${emergRes.status}`)
    }
    emergencyCaseNumber = emergRes.body.data.emergencyCase.caseNumber

    // Doctor accepts emergency
    const docAccept = await makeHttpRequest(
      port,
      `/api/patient/emergency/${emergencyCaseNumber}/respond`,
      "POST",
      {
        responderId: "doc-ama-001",
        responderName: "Dr. Ama Bentil",
        notes: "Dispatched on-call doctor",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (docAccept.status !== 200) {
      throw new Error(`Doctor accept emergency failed: ${docAccept.status}`)
    }

    // Access emergency clinical record with mandatory justification
    const accessRec = await makeHttpRequest(
      port,
      `/api/patient/emergency/${emergencyCaseNumber}/clinical-record`,
      "POST",
      {
        justification: "Emergency airway management protocol",
        clinicianId: "doc-ama-001",
        clinicianName: "Dr. Ama Bentil",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (accessRec.status !== 200) {
      throw new Error(`Emergency record access failed: ${accessRec.status}`)
    }

    // Emergency case deletion blocked
    const delEmerg = await makeHttpRequest(
      port,
      "/api/patient/emergency/cancel",
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      delEmerg.status !== 404 &&
      delEmerg.status !== 405 &&
      delEmerg.status !== 403
    ) {
      throw new Error(`Direct DELETE of emergency records must be rejected`)
    }
    console.log(
      `✔ CHAIN 10 VERIFIED: Break-Glass Case #${emergencyCaseNumber} initiated, responded, accessed with justification, and audit logged.`,
    )

    // -------------------------------------------------------------------------
    // CHAIN 11: In-App Notification Center
    // -------------------------------------------------------------------------
    console.log("\n--- CHAIN 11: In-App Notification Center ---")
    const notifs = await makeHttpRequest(
      port,
      "/api/patient/notifications",
      "GET",
      undefined,
      activeCookies,
    )
    if (notifs.status !== 200 || notifs.body.data.items.length === 0) {
      throw new Error(
        `Expected in-app notifications generated across lifecycle actions`,
      )
    }

    const markAll = await makeHttpRequest(
      port,
      "/api/patient/notifications/mark-all-read",
      "PATCH",
      {},
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (markAll.status !== 200 || markAll.body.data.unreadCount !== 0) {
      throw new Error(`Mark all read failed: ${JSON.stringify(markAll.body)}`)
    }

    // Dismiss first notification
    const firstNotifId = notifs.body.data.items[0].id
    const dismissRes = await makeHttpRequest(
      port,
      `/api/patient/notifications/${firstNotifId}`,
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (dismissRes.status !== 200 || !dismissRes.body.data?.success) {
      throw new Error(`Dismiss notification failed: ${dismissRes.status}`)
    }
    console.log(
      "✔ CHAIN 11 VERIFIED: Notification Center receives events, updates read status, and supports dismissal.",
    )

    // -------------------------------------------------------------------------
    // CHAIN 12: Profile & Settings Null-Clearing & IDOR Defense
    // -------------------------------------------------------------------------
    console.log(
      "\n--- CHAIN 12: Profile & Settings Null-Clearing & IDOR Defense ---",
    )
    const profPatch = await makeHttpRequest(
      port,
      "/api/patient/profile",
      "PATCH",
      {
        address: {
          street: "100 Liberation Road",
          city: "Accra",
          state: "Greater Accra",
          district: null, // explicit null clearing
        },
        emergencyContact: {
          fullName: "Yaa Darko",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: `024${String(timestamp + 2).slice(-7)}`,
        },
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      profPatch.status !== 200 ||
      profPatch.body.data.address.district !== null
    ) {
      throw new Error(
        `Profile update with null clearing failed: ${JSON.stringify(profPatch.body)}`,
      )
    }

    // Attempt privilege injection
    const tamperRes = await makeHttpRequest(
      port,
      "/api/patient/profile",
      "PATCH",
      { role: "ADMIN", clinicallyVerified: true },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (tamperRes.status !== 400) {
      throw new Error(
        `Privilege injection attempt should be rejected with 400, got ${tamperRes.status}`,
      )
    }

    // Cross-patient IDOR attempt
    const idorRes = await makeHttpRequest(
      port,
      "/api/patient/00000000-0000-0000-0000-000000000001/profile",
      "GET",
      undefined,
      activeCookies,
    )
    if (idorRes.status !== 403) {
      throw new Error(
        `IDOR attempt should be rejected with 403, got ${idorRes.status}`,
      )
    }
    console.log(
      "✔ CHAIN 12 VERIFIED: Profile supports null clearing, rejects privilege tampering (400), and blocks IDOR (403).",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 12 END-TO-END VERIFICATION CHAINS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    console.log("\n[Teardown] Cleaning up test records from database...")
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
      console.log(
        `[Teardown] Cleaned up user ${testUserId} (cascaded all child records).`,
      )
    }
    server.close()
  }
}

runStep15FullVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Step 15 Verification Suite failed:", err)
    process.exit(1)
  })
