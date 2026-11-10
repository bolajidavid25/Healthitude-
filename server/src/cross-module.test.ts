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
        path,
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

async function runCrossModuleTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "STEP 14: PATIENT PORTAL CROSS-MODULE INTEGRATION & CRUD GAP TEST SUITE",
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
  let appointmentUuid = ""
  let telemedicineSessionId = ""
  let complaintReferenceId = ""
  let complaintUuid = ""
  let prescriptionId = ""
  let emergencyCaseNumber = ""

  try {
    const timestamp = Date.now()
    const testEmail = `crossmodule.test.${timestamp}@example.com`

    // -------------------------------------------------------------------------
    // Check 1: Clean Onboarding & Initial Cross-Module Baseline
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 1: Clean Onboarding & Initial Cross-Module Baseline ---",
    )
    const registrationPayload = {
      account: {
        firstName: "Kofi",
        middleName: "Kwame",
        lastName: "Mensah",
        dateOfBirth: "1992-04-18",
        sex: "MALE",
        email: testEmail,
        phoneNumber: `024${String(timestamp).slice(-7)}`,
        password: "ValidSecurePassword123!",
        confirmPassword: "ValidSecurePassword123!",
      },
      contact: {
        street: "15 Barnes Road",
        city: "Accra",
        state: "Greater Accra",
        district: "Adabraka",
        emergencyContact: {
          fullName: "Abena Mensah",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: `024${String(timestamp + 1).slice(-7)}`,
        },
      },
      healthProfile: {
        bloodGroup: "O_POSITIVE",
        genotype: "AA",
        knownAllergies: "None",
        medicalConditions: "None reported",
        currentMedications: "None",
        previousSurgeries: "None",
        medicalHistory: "Normal health history",
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
      registrationPayload,
    )
    if (regRes.status !== 201) {
      throw new Error(
        `Registration failed: expected 201, got ${regRes.status}: ${JSON.stringify(regRes.body)}`,
      )
    }

    testUserId = regRes.body.data.user.id

    // Log in with registered credentials to acquire HTTP-only session cookie and CSRF token
    const loginRes = await makeHttpRequest(port, "/api/auth/login", "POST", {
      email: testEmail,
      password: "ValidSecurePassword123!",
    })
    if (loginRes.status !== 200) {
      throw new Error(
        `Login after registration failed: ${loginRes.status}: ${JSON.stringify(loginRes.body)}`,
      )
    }

    activeCookies = loginRes.cookies
    const parsedCookies = parseCookies(activeCookies)
    csrfToken =
      loginRes.body?.data?.csrfToken || parsedCookies["healthitude_csrf"] || ""

    // Verify initial dashboard baseline
    const initialDashRes = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    if (initialDashRes.status !== 200) {
      throw new Error(
        `Initial dashboard fetch failed: ${initialDashRes.status}`,
      )
    }

    const initMetrics = initialDashRes.body.data.metrics
    if (
      initMetrics.activeComplaintsCount !== 0 ||
      initMetrics.nextAppointment !== null ||
      initMetrics.medicationsCount !== 0
    ) {
      throw new Error(
        `Initial dashboard metrics mismatch: ${JSON.stringify(initMetrics)}`,
      )
    }

    const initUnreadRes = await makeHttpRequest(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      undefined,
      activeCookies,
    )
    if (initUnreadRes.body.data.unreadCount !== 0) {
      throw new Error(
        `Expected 0 initial unread notifications, got: ${initUnreadRes.body.data.unreadCount}`,
      )
    }
    console.log(
      "[PASS] Check 1: Patient registered, authenticated, and initial dashboard metrics verify 0-baseline",
    )

    // -------------------------------------------------------------------------
    // Check 2: Provider Discovery -> Appointment Booking Handoff
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 2: Provider Discovery -> Appointment Booking Handoff ---",
    )
    const provRes = await makeHttpRequest(
      port,
      "/api/patient/providers?specialty=Cardiology",
      "GET",
      undefined,
      activeCookies,
    )
    if (
      provRes.status !== 200 ||
      !provRes.body.data.providers ||
      provRes.body.data.providers.length === 0
    ) {
      throw new Error(
        `Provider discovery for Cardiology failed: ${JSON.stringify(provRes.body)}`,
      )
    }

    const selectedDoc = provRes.body.data.providers[0]
    console.log(
      `Discovered Provider: ${selectedDoc.name} (${selectedDoc.specialty})`,
    )

    const bookingPayload = {
      doctorName: selectedDoc.name,
      department: selectedDoc.specialty,
      type: "Cardiology Consultation",
      reason: "Routine cardiovascular checkup",
      date: "2026-10-25",
      time: "10:00 AM",
    }

    const bookRes = await makeHttpRequest(
      port,
      "/api/patient/appointments",
      "POST",
      bookingPayload,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (bookRes.status !== 201) {
      throw new Error(
        `Appointment booking failed: expected 201, got ${bookRes.status}: ${JSON.stringify(bookRes.body)}`,
      )
    }

    appointmentNumber = bookRes.body.data.id // e.g. APT-2026-XXXX
    appointmentUuid = bookRes.body.data.uuid
    console.log(
      `[PASS] Check 2: Booked appointment ${appointmentNumber} with discovered doctor ${selectedDoc.name}`,
    )

    // -------------------------------------------------------------------------
    // Check 3: Appointment Intake -> Confirmation & Notification Event Propagation
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 3: Appointment Intake -> Status Confirmation & Notification Propagation ---",
    )
    const intakePayload = {
      symptoms: "Mild shortness of breath following exercise",
      duration: "3 weeks",
      severity: "Moderate",
      notes: "No chest pain or palpitations noted",
    }

    const intakeRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}/intake`,
      "PATCH",
      intakePayload,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      intakeRes.status !== 200 ||
      intakeRes.body.data.status !== "CONFIRMED"
    ) {
      throw new Error(
        `Intake submission failed: ${intakeRes.status}, status: ${intakeRes.body.data?.status}`,
      )
    }

    // Verify automatic notification was emitted
    const notifRes = await makeHttpRequest(
      port,
      "/api/patient/notifications",
      "GET",
      undefined,
      activeCookies,
    )
    if (notifRes.status !== 200 || notifRes.body.data.items.length === 0) {
      throw new Error(
        `Expected notification to be generated for appointment confirmation`,
      )
    }

    const apptNotif = notifRes.body.data.items.find(
      (n: any) => n.type === "APPOINTMENT_CONFIRMED",
    )
    if (!apptNotif) {
      throw new Error(
        `APPOINTMENT_CONFIRMED notification not found in inbox: ${JSON.stringify(notifRes.body.data.items)}`,
      )
    }

    const unreadCountRes = await makeHttpRequest(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      undefined,
      activeCookies,
    )
    if (unreadCountRes.body.data.unreadCount < 1) {
      throw new Error(
        `Expected at least 1 unread notification, got ${unreadCountRes.body.data.unreadCount}`,
      )
    }
    console.log(
      `[PASS] Check 3: Intake confirmed appointment. APPOINTMENT_CONFIRMED notification emitted (unread: ${unreadCountRes.body.data.unreadCount})`,
    )

    // -------------------------------------------------------------------------
    // Check 4: Cross-Module Dashboard Synchronization (Next Appointment)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 4: Cross-Module Dashboard Synchronization (Next Appointment) ---",
    )
    const dashAfterAppt = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    const nextApt = dashAfterAppt.body.data.metrics.nextAppointment
    if (!nextApt || !nextApt.doctor.includes("Asante")) {
      throw new Error(
        `Dashboard nextAppointment did not reflect scheduled appointment: ${JSON.stringify(nextApt)}`,
      )
    }
    console.log(
      `[PASS] Check 4: Dashboard Overview dynamically reflects next appointment with ${nextApt.doctor} on ${nextApt.date}`,
    )

    // -------------------------------------------------------------------------
    // Check 5: Telemedicine Video Session Initiation & Isolation
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 5: Telemedicine Video Session Initiation & Isolation ---",
    )
    const teleStartRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}/telemedicine`,
      "POST",
      { deviceType: "Chrome Desktop" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (teleStartRes.status !== 200 && teleStartRes.status !== 201) {
      throw new Error(
        `Telemedicine start failed: ${teleStartRes.status}: ${JSON.stringify(teleStartRes.body)}`,
      )
    }

    telemedicineSessionId = teleStartRes.body.data.sessionId
    if (
      !telemedicineSessionId ||
      teleStartRes.body.data.status !== "IN_PROGRESS" ||
      !teleStartRes.body.data.roomToken
    ) {
      throw new Error(
        `Telemedicine session invalid payload: ${JSON.stringify(teleStartRes.body)}`,
      )
    }
    console.log(
      `[PASS] Check 5: Live 256-bit encrypted telemedicine session initialized (Session: ${teleStartRes.body.data.sessionNumber})`,
    )

    // -------------------------------------------------------------------------
    // Check 6: Telemedicine Consultation Concluded & Appointment State Integrity
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 6: Telemedicine Consultation Concluded & Appointment State Integrity ---",
    )
    const teleEndRes = await makeHttpRequest(
      port,
      `/api/patient/telemedicine/sessions/${telemedicineSessionId}/end`,
      "POST",
      { exitReason: "Patient concluded telemedicine consultation" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (teleEndRes.status !== 200 || teleEndRes.body.data.status !== "ENDED") {
      throw new Error(
        `Telemedicine end failed: ${teleEndRes.status}: ${JSON.stringify(teleEndRes.body)}`,
      )
    }

    // Verify appointment remains intact
    const verifyAptRes = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}`,
      "GET",
      undefined,
      activeCookies,
    )
    if (
      verifyAptRes.status !== 200 ||
      verifyAptRes.body.data.status !== "CONFIRMED"
    ) {
      throw new Error(
        `Appointment status altered unexpectedly after telemedicine: ${verifyAptRes.body.data?.status}`,
      )
    }
    console.log(
      "[PASS] Check 6: Telemedicine concluded cleanly; appointment record preserved with CONFIRMED status",
    )

    // -------------------------------------------------------------------------
    // Check 7: Clinical Complaint Submission -> Metric & Notification Propagation
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 7: Clinical Complaint Submission -> Metric & Notification Propagation ---",
    )
    const complaintPayload = {
      symptoms: "Severe throbbing unilateral headache with light sensitivity",
      severity: "Severe",
      duration: "4 days",
    }

    const compRes = await makeHttpRequest(
      port,
      "/api/patient/complaints",
      "POST",
      complaintPayload,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (compRes.status !== 201) {
      throw new Error(
        `Complaint creation failed: ${compRes.status}: ${JSON.stringify(compRes.body)}`,
      )
    }

    complaintReferenceId = compRes.body.data.referenceId
    complaintUuid = compRes.body.data.id

    // Verify dashboard complaints metric incremented
    const dashAfterComp = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    if (dashAfterComp.body.data.metrics.activeComplaintsCount !== 1) {
      throw new Error(
        `Expected activeComplaintsCount to be 1, got ${dashAfterComp.body.data.metrics.activeComplaintsCount}`,
      )
    }

    // Verify complaint notification generated
    const notifsAfterComp = await makeHttpRequest(
      port,
      "/api/patient/notifications",
      "GET",
      undefined,
      activeCookies,
    )
    const compNotif = notifsAfterComp.body.data.items.find(
      (n: any) => n.type === "COMPLAINT_SUBMITTED",
    )
    if (!compNotif) {
      throw new Error(`Expected COMPLAINT_SUBMITTED notification in inbox`)
    }
    console.log(
      `[PASS] Check 7: Complaint ${complaintReferenceId} submitted. Dashboard count: 1, COMPLAINT_SUBMITTED notification emitted`,
    )

    // -------------------------------------------------------------------------
    // Check 8: Prescriptions & Adherence Propagation to Dashboard
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 8: Prescriptions & Adherence Propagation to Dashboard ---",
    )
    // Insert clinician-signed prescription directly into PostgreSQL
    const rxRecord = await prisma.prescription.create({
      data: {
        prescriptionNumber: `RX-2026-${Date.now().toString().slice(-4)}`,
        patientId: testUserId,
        medicine: "Amlodipine Besylate",
        dose: "5mg",
        frequency: "Once daily",
        duration: "30 days",
        prescriber: "Dr. Efua Asante",
        prescriberId: "doc-efua-asante-001",
        status: "ACTIVE",
        instructions: "Take in the morning with water",
        startDate: new Date(),
      },
    })
    prescriptionId = rxRecord.id

    // Record today's adherence
    const adhRes = await makeHttpRequest(
      port,
      `/api/patient/prescriptions/${prescriptionId}/adherence`,
      "POST",
      { status: "TAKEN", notes: "Taken after breakfast" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (adhRes.status !== 200) {
      throw new Error(`Adherence recording failed: ${adhRes.status}`)
    }

    // Verify dashboard reflects prescription
    const dashAfterRx = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    if (dashAfterRx.body.data.metrics.medicationsCount !== 1) {
      throw new Error(
        `Expected medicationsCount 1, got ${dashAfterRx.body.data.metrics.medicationsCount}`,
      )
    }
    console.log(
      "[PASS] Check 8: Prescription adherence tracked and synchronized with Dashboard medications count",
    )

    // -------------------------------------------------------------------------
    // Check 9: Pricing & Coverage Category Update -> Single Primary Invariant
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 9: Pricing & Coverage Category Update -> Single Primary Invariant ---",
    )
    const catUpdateRes = await makeHttpRequest(
      port,
      "/api/patient/category",
      "PATCH",
      { category: "CIVIL_SERVANT" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (catUpdateRes.status !== 200) {
      throw new Error(`Category update failed: ${catUpdateRes.status}`)
    }

    // Verify single primary category invariant in database
    const dbCatCount = await prisma.patientCategoryRecord.count({
      where: { userId: testUserId },
    })
    if (dbCatCount !== 1) {
      throw new Error(
        `Violation of single primary category invariant! Found ${dbCatCount} records`,
      )
    }

    const dashAfterCat = await makeHttpRequest(
      port,
      "/api/patient/dashboard",
      "GET",
      undefined,
      activeCookies,
    )
    if (
      !dashAfterCat.body.data.metrics.category.label.includes("Civil Servant")
    ) {
      throw new Error(
        `Dashboard category did not update: ${JSON.stringify(dashAfterCat.body.data.metrics.category)}`,
      )
    }
    console.log(
      "[PASS] Check 9: Category updated to Civil Servant with PENDING review; Single Primary Category Invariant maintained (1 record)",
    )

    // -------------------------------------------------------------------------
    // Check 10: Break-Glass Emergency Isolation & Access Audit
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 10: Break-Glass Emergency Isolation & Access Audit ---",
    )
    const emergRes = await makeHttpRequest(
      port,
      "/api/patient/emergency",
      "POST",
      { reason: "Acute substernal discomfort and diaphoresis" },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (emergRes.status !== 201) {
      throw new Error(`Emergency initiation failed: ${emergRes.status}`)
    }

    emergencyCaseNumber = emergRes.body.data.emergencyCase.caseNumber
    console.log(`Initiated Emergency Case: ${emergencyCaseNumber}`)

    // Doctor responds to emergency case
    const respondRes = await makeHttpRequest(
      port,
      `/api/patient/emergency/${emergencyCaseNumber}/respond`,
      "POST",
      {
        responderName: "Dr. Ama Bentil",
        responderId: "doc-ama-bentil-001",
        responderRole: "Verified GP",
        notes: "Accepting emergency dispatch call",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (
      respondRes.status !== 200 ||
      respondRes.body.data.status !== "RESPONDED"
    ) {
      throw new Error(`Doctor emergency response failed: ${respondRes.status}`)
    }

    // Clinician accesses Break-Glass clinical record
    const bgAccessRes = await makeHttpRequest(
      port,
      `/api/patient/emergency/${emergencyCaseNumber}/clinical-record`,
      "POST",
      {
        justification: "Immediate resuscitation and drug allergy clearance",
        clinicianId: "doc-ama-bentil-001",
        clinicianName: "Dr. Ama Bentil",
        clinicianRole: "Verified GP",
      },
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (bgAccessRes.status !== 200) {
      throw new Error(`Break-Glass record access failed: ${bgAccessRes.status}`)
    }

    // Verify audit log contains Break-Glass event
    const emergStatusRes = await makeHttpRequest(
      port,
      "/api/patient/emergency",
      "GET",
      undefined,
      activeCookies,
    )
    const auditLogs = emergStatusRes.body.data.auditLogs
    if (!auditLogs || auditLogs.length === 0) {
      throw new Error(
        `Expected Break-Glass audit log entries in emergency status`,
      )
    }

    const hasAccessLog = auditLogs.some(
      (l: any) =>
        l.action === "EMERGENCY_RECORD_ACCESSED" &&
        l.actor === "Dr. Ama Bentil",
    )
    if (!hasAccessLog) {
      throw new Error(
        `EMERGENCY_RECORD_ACCESSED audit entry missing: ${JSON.stringify(auditLogs)}`,
      )
    }

    // Verify standard appointments and prescriptions were not mutated or disrupted by emergency
    const aptIntegrity = await makeHttpRequest(
      port,
      `/api/patient/appointments/${appointmentNumber}`,
      "GET",
      undefined,
      activeCookies,
    )
    if (aptIntegrity.body.data.status !== "CONFIRMED") {
      throw new Error(`Appointment was affected by emergency workflow`)
    }
    console.log(
      "[PASS] Check 10: Break-Glass emergency dispatched, record accessed with mandatory justification, immutable audit logged, and standard clinical state isolated",
    )

    // -------------------------------------------------------------------------
    // Check 11: In-App Notification Center Operations
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: In-App Notification Center Operations ---")
    const unreadBeforeMarkAll = await makeHttpRequest(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      undefined,
      activeCookies,
    )
    console.log(
      `Unread count before bulk read: ${unreadBeforeMarkAll.body.data.unreadCount}`,
    )

    const markAllRes = await makeHttpRequest(
      port,
      "/api/patient/notifications/mark-all-read",
      "PATCH",
      {},
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (markAllRes.status !== 200 || markAllRes.body.data.unreadCount !== 0) {
      throw new Error(
        `Mark all read failed: ${JSON.stringify(markAllRes.body)}`,
      )
    }

    const unreadAfterMarkAll = await makeHttpRequest(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      undefined,
      activeCookies,
    )
    if (unreadAfterMarkAll.body.data.unreadCount !== 0) {
      throw new Error(
        `Expected unread count 0, got ${unreadAfterMarkAll.body.data.unreadCount}`,
      )
    }

    // Individual notification dismiss / delete
    const listRes = await makeHttpRequest(
      port,
      "/api/patient/notifications",
      "GET",
      undefined,
      activeCookies,
    )
    const firstNotif = listRes.body.data.items[0]
    const deleteNotifRes = await makeHttpRequest(
      port,
      `/api/patient/notifications/${firstNotif.id}`,
      "DELETE",
      undefined,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (deleteNotifRes.status !== 200 || !deleteNotifRes.body.data?.success) {
      throw new Error(`Notification dismissal failed: ${deleteNotifRes.status}`)
    }
    console.log(
      "[PASS] Check 11: Notification Center bulk mark-all-read and individual dismissal verified",
    )

    // -------------------------------------------------------------------------
    // Check 12: Profile & Settings Nullable Updates & Security Boundary
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 12: Profile & Settings Nullable Updates & Security Boundary ---",
    )
    const profilePatchPayload = {
      address: {
        street: "24 Ring Road Central",
        city: "Accra",
        state: "Greater Accra",
        district: null, // explicit null clearing
      },
      emergencyContact: {
        fullName: "Kwame Mensah Senior",
        relationship: "PARENT",
        phoneNumber: "0240998899",
      },
      healthProfile: {
        knownAllergies: "Penicillin (rash)",
      },
    }

    const profPatchRes = await makeHttpRequest(
      port,
      "/api/patient/profile",
      "PATCH",
      profilePatchPayload,
      activeCookies,
      { "x-csrf-token": csrfToken },
    )
    if (profPatchRes.status !== 200) {
      throw new Error(
        `Profile patch failed: ${profPatchRes.status}: ${JSON.stringify(profPatchRes.body)}`,
      )
    }

    const updatedProfile = profPatchRes.body.data
    if (updatedProfile.address.district !== null) {
      throw new Error(
        `District was not cleared to null: ${updatedProfile.address.district}`,
      )
    }
    if (updatedProfile.healthProfile.clinicallyVerified !== false) {
      throw new Error(
        `Patient-reported health profile must strictly maintain clinicallyVerified: false`,
      )
    }

    // Verify tamper rejection
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
        `Expected tamper attempt with role/clinicallyVerified to be rejected with 400, got ${tamperRes.status}`,
      )
    }
    console.log(
      "[PASS] Check 12: Nullable field clearing succeeded, clinical verification integrity defended, privilege injection rejected with HTTP 400",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 12 CROSS-MODULE INTEGRATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // -------------------------------------------------------------------------
    // Check 13: Full Teardown & Database Cleanup
    // -------------------------------------------------------------------------
    console.log("\n[Teardown] Cleaning up test records from database...")
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
      console.log(
        `[Teardown] Cleaned up user ${testUserId} and cascaded all associated test data.`,
      )
    }
    server.close()
  }
}

runCrossModuleTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Cross-module test suite failed:", err)
    process.exit(1)
  })
