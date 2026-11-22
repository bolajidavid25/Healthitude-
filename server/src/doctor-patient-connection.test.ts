import http from "http"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import {
  registerProfessional,
  loginProfessional,
} from "./services/professionalAuthService"
import {
  generateSessionToken,
  hashSessionToken,
  generateCsrfToken,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "./utils/session"
import {
  PROF_SESSION_COOKIE_NAME,
  PROF_CSRF_COOKIE_NAME,
} from "./utils/professionalSession"
import {
  Sex,
  PatientCategory,
  ProfessionalVerificationStatus,
} from "./generated/prisma/enums"

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
    const payload = body !== undefined ? JSON.stringify(body) : undefined
    const reqHeaders: Record<string, string> = { ...headers }
    if (payload && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json"
    }
    if (payload) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      { host: "127.0.0.1", port, path, method, headers: reqHeaders },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsed: any
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode || 500, headers: res.headers, body: parsed })
        })
      },
    )
    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`)
}

async function runDoctorPatientConnectionTests() {
  console.log("================================================================================")
  console.log("HEALTHITUDE: DOCTOR–PATIENT BACKEND CONNECTION & CLINICAL WORKFLOW TESTS")
  console.log("================================================================================")

  const app = createApp()
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port

  const ts = Date.now()
  let patientId = ""
  let verifiedDoctorId = ""
  let pendingDoctorId = ""

  try {
    // 1. Create test patient & authenticate
    const patReg = await registerPatient({
      account: {
        firstName: "Amina",
        lastName: "ConnectTest",
        dateOfBirth: new Date("1995-06-15"),
        sex: Sex.FEMALE,
        email: `pat.conn.${ts}@example.com`,
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "ValidSecurePassword123!",
        confirmPassword: "ValidSecurePassword123!",
      },
      contact: {
        street: "12 Independence Ave",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kofi Connect",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "0200009911",
        },
      },
      healthProfile: {
        bloodGroup: "O_POSITIVE",
        genotype: "AA",
        knownAllergies: "Penicillin",
        medicalConditions: "Mild Asthma",
      },
      patientCategory: { category: PatientCategory.GENERAL_PATIENT },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "1.0" },
          { consentType: "HEALTH_DATA_PROCESSING", accepted: true, version: "1.0" },
          { consentType: "PROFESSIONAL_ACCESS", accepted: true, version: "1.0" },
          { consentType: "PATIENT_DATA_ACKNOWLEDGEMENT", accepted: true, version: "1.0" },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "1.0" },
          { consentType: "BREAK_GLASS_DISCLOSURE", accepted: true, version: "1.0" },
          { consentType: "INFORMATION_ACCURACY", accepted: true, version: "1.0" },
        ],
      },
    })
    patientId = patReg.user.id

    const patToken = generateSessionToken()
    const patCsrf = generateCsrfToken()
    await prisma.session.create({
      data: {
        userId: patientId,
        tokenHash: hashSessionToken(patToken),
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    const patHeaders = {
      Cookie: `${SESSION_COOKIE_NAME}=${patToken}; ${CSRF_COOKIE_NAME}=${patCsrf}`,
      "X-CSRF-Token": patCsrf,
    }

    // 2. Register two doctors: one stays PENDING, one is VERIFIED
    const pendingProf = await registerProfessional({
      firstName: "Pending",
      lastName: "Doctor",
      email: `pending.doc.${ts}@example.com`,
      phoneNumber: `+23324${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: "ValidSecurePassword123!",
      confirmPassword: "ValidSecurePassword123!",
      category: "DOCTOR" as any,
      profession: "Medical Doctor",
      specialty: "General Practice",
      licenceNumber: `MDC-PEND-${ts}`,
      licenceExpiry: new Date("2029-12-31"),
      regulatoryBody: "MDC Ghana",
      facility: "Test Clinic",
      termsAccepted: true,
    })
    pendingDoctorId = pendingProf.id

    const verifiedProf = await registerProfessional({
      firstName: "Chidi",
      lastName: "Okonkwo",
      email: `verified.doc.${ts}@example.com`,
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: "ValidSecurePassword123!",
      confirmPassword: "ValidSecurePassword123!",
      category: "DOCTOR" as any,
      profession: "Consultant Physician",
      specialty: "Internal Medicine",
      qualification: "MBBS",
      specialistQualification: "FWACP",
      graduationYear: 2015,
      licenceNumber: `MDCN-VER-${ts}`,
      regulatoryBody: "MDCN",
      facility: "Lagos University Teaching Hospital",
      licenceExpiry: new Date("2029-12-31"),
      termsAccepted: true,
    })
    verifiedDoctorId = verifiedProf.id

    await prisma.professional.update({
      where: { id: verifiedDoctorId },
      data: {
        verificationStatus: ProfessionalVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    })

    const pendingLogin = await loginProfessional({
      email: pendingProf.email,
      password: "ValidSecurePassword123!",
    })
    const pendingDocHeaders = {
      Cookie: `${PROF_SESSION_COOKIE_NAME}=${pendingLogin.rawToken}; ${PROF_CSRF_COOKIE_NAME}=${pendingLogin.csrfToken}`,
      "X-CSRF-Token": pendingLogin.csrfToken,
    }

    const verifiedLogin = await loginProfessional({
      email: verifiedProf.email,
      password: "ValidSecurePassword123!",
    })
    const docHeaders = {
      Cookie: `${PROF_SESSION_COOKIE_NAME}=${verifiedLogin.rawToken}; ${PROF_CSRF_COOKIE_NAME}=${verifiedLogin.csrfToken}`,
      "X-CSRF-Token": verifiedLogin.csrfToken,
    }

    // Check 1: Unverified (PENDING) doctor is strictly blocked from clinical endpoints (403)
    const blockedDash = await request(port, "/api/professional/dashboard", "GET", pendingDocHeaders)
    assert(blockedDash.status === 403, `Expected 403 for PENDING doctor dashboard, got ${blockedDash.status}`)
    console.log("✓ Check 1 Passed: PENDING professional blocked from clinical endpoints (403).")

    // Check 2: Patient discovers newly verified doctor in /api/patient/providers (and NOT pending doctor)
    const provRes = await request(port, `/api/patient/providers?search=Okonkwo`, "GET", patHeaders)
    assert(provRes.status === 200, `Expected 200 from providers, got ${provRes.status}`)
    assert(
      provRes.body.data.providers.some((p: any) => p.id === verifiedDoctorId),
      "Verified doctor should appear in live patient provider discovery",
    )
    const pendProvRes = await request(port, `/api/patient/providers?search=Pending`, "GET", patHeaders)
    assert(
      !pendProvRes.body.data.providers.some((p: any) => p.id === pendingDoctorId),
      "PENDING doctor must NOT appear in patient provider discovery",
    )
    console.log("✓ Check 2 Passed: Verified doctor appears in patient discovery; PENDING doctor is hidden.")

    // Check 3: Patient books appointment with verified doctor -> appears on Doctor Dashboard
    const todayStr = new Date().toISOString().slice(0, 10)
    const bookRes = await request(port, "/api/patient/appointments", "POST", patHeaders, {
      doctorId: verifiedDoctorId,
      doctorName: "Dr. Chidi Okonkwo",
      department: "Internal Medicine",
      type: "Video",
      reason: "Persistent migraine and fatigue",
      date: todayStr,
      time: "10:00 AM",
      symptoms: "Headache, Fatigue",
      duration: "4 days",
      severity: "Moderate",
    })
    assert(bookRes.status === 201, `Expected 201 booking appointment, got ${bookRes.status}`)
    const appointmentNumber = bookRes.body.data.appointmentNumber

    const docAptsRes = await request(port, "/api/professional/appointments?tab=all", "GET", docHeaders)
    assert(docAptsRes.status === 200, `Expected 200 fetching doc appointments, got ${docAptsRes.status}`)
    const matchedApt = docAptsRes.body.data.appointments.find(
      (a: any) => a.appointmentNumber === appointmentNumber,
    )
    assert(matchedApt, "Booked patient appointment must appear on the doctor's portal")
    assert(matchedApt.allergies === "Penicillin", "Doctor must see patient's reported allergies")
    console.log("✓ Check 3 Passed: Patient appointment connects directly to Doctor's appointment queue.")

    // Check 4: CSRF enforced on mutating professional clinical endpoint
    const noCsrfRes = await request(
      port,
      `/api/professional/appointments/${appointmentNumber}/complete`,
      "POST",
      { Cookie: `${PROF_SESSION_COOKIE_NAME}=${verifiedLogin.rawToken}` },
      { consultationNotes: "Attempt without CSRF token" },
    )
    assert(noCsrfRes.status === 403, `Expected 403 without CSRF token, got ${noCsrfRes.status}`)
    console.log("✓ Check 4 Passed: CSRF protection enforced on mutating professional clinical routes.")

    // Check 5: Doctor completes consultation -> saves notes, diagnosis, prescription -> visible to Patient
    const completeRes = await request(
      port,
      `/api/professional/appointments/${appointmentNumber}/complete`,
      "POST",
      docHeaders,
      {
        consultationNotes: "Patient examined via video. Tension headache likely due to dehydration.",
        diagnoses: ["Tension-type headache (G44.2)"],
        vitalSigns: "BP 118/76 mmHg, HR 72 bpm",
        recommendations: "Hydrate well and rest 48 hours.",
        followUp: "follow2weeks",
        prescriptions: [
          {
            medicine: "Paracetamol",
            dose: "500 mg",
            frequency: "Twice daily",
            duration: "5 days",
            route: "Oral",
            instructions: "Take after meals",
          },
        ],
      },
    )
    assert(completeRes.status === 200, `Expected 200 completing consultation, got ${completeRes.status}`)
    assert(completeRes.body.data.clinicalRecords.length === 3, "Expected 3 verified clinical records created")
    assert(completeRes.body.data.prescriptions.length === 1, "Expected 1 prescription created")

    // Verify patient now sees those clinical records and prescription!
    const patRecs = await request(port, "/api/patient/records", "GET", patHeaders)
    const patRecList = Array.isArray(patRecs.body.data) ? patRecs.body.data : patRecs.body.data?.records || []
    assert(patRecs.status === 200 && patRecList.length >= 3, "Patient should see doctor's verified clinical records")
    const patRx = await request(port, "/api/patient/prescriptions", "GET", patHeaders)
    const patRxList = Array.isArray(patRx.body.data) ? patRx.body.data : patRx.body.data?.prescriptions || []
    assert(
      patRx.status === 200 &&
      patRxList.some((rx: any) => rx.medicine === "Paracetamol"),
      "Patient should see doctor's issued prescription",
    )
    console.log("✓ Check 5 Passed: Consultation completion syncs verified records & prescriptions to Patient portal.")

    // Check 6: Patient submits complaint -> Doctor reviews & resolves -> Patient sees updated status
    const cplRes = await request(port, "/api/patient/complaints", "POST", patHeaders, {
      symptoms: "Severe chest tightness at night",
      severity: "SEVERE",
      duration: "2 days",
    })
    assert(cplRes.status === 201, `Expected 201 submitting complaint, got ${cplRes.status}`)
    const cplRef = cplRes.body.data.referenceId

    const docCplList = await request(port, "/api/professional/complaints", "GET", docHeaders)
    assert(
      docCplList.status === 200 &&
      docCplList.body.data.complaints.some((c: any) => c.referenceId === cplRef),
      "Patient complaint should appear in doctor complaint queue",
    )

    const resolveCpl = await request(
      port,
      `/api/professional/complaints/${cplRef}`,
      "PATCH",
      docHeaders,
      {
        status: "RESOLVED",
        clinicalNotes: "Evaluated; inhaler technique reviewed and symptoms resolved.",
      },
    )
    assert(resolveCpl.status === 200 && resolveCpl.body.data.status === "RESOLVED", "Complaint should be RESOLVED")
    console.log("✓ Check 6 Passed: Patient complaint flows into Doctor queue and resolves cleanly.")

    // Check 7: Doctor clinically verifies Patient HealthProfile (Rule A)
    const verifyHp = await request(
      port,
      `/api/professional/patients/${patientId}/verify-health-profile`,
      "POST",
      docHeaders,
      {},
    )
    assert(verifyHp.status === 200 && verifyHp.body.data.clinicallyVerified === true, "HealthProfile should be clinicallyVerified=true")
    console.log("✓ Check 7 Passed: Doctor clinically verified patient HealthProfile (Rule A).")

    // Check 8: Emergency Break-Glass flow (Patient triggers -> Doctor sees, accesses with audit, responds, resolves)
    const emgInit = await request(port, "/api/patient/emergency", "POST", patHeaders, {
      reason: "Acute asthma attack",
    })
    assert(emgInit.status === 201 || emgInit.status === 200, `Expected 200/201 initiating emergency, got ${emgInit.status}`)
    const caseNumber = emgInit.body.data.emergencyCase.caseNumber

    const docEmgList = await request(port, "/api/professional/emergencies", "GET", docHeaders)
    assert(
      docEmgList.status === 200 &&
      docEmgList.body.data.emergencies.some((e: any) => e.caseNumber === caseNumber),
      "Active emergency must appear in doctor emergency queue",
    )

    const emgRespond = await request(
      port,
      `/api/professional/emergencies/${caseNumber}/respond`,
      "POST",
      docHeaders,
      { notes: "On-call clinician responding immediately" },
    )
    assert(emgRespond.status === 200 && emgRespond.body.data.status === "RESPONDED", "Emergency should be RESPONDED")

    const emgAccess = await request(
      port,
      `/api/professional/emergencies/${caseNumber}/access`,
      "POST",
      docHeaders,
      { justification: "Reviewing allergies and active asthma medications during emergency response" },
    )
    assert(emgAccess.status === 200 && emgAccess.body.data.allergies.value === "Penicillin", "Emergency record should expose allergies")

    const emgResolve = await request(
      port,
      `/api/professional/emergencies/${caseNumber}/resolve`,
      "POST",
      docHeaders,
      { resolutionNotes: "Patient stabilized with nebulized salbutamol." },
    )
    assert(emgResolve.status === 200 && emgResolve.body.data.status === "RESOLVED", "Emergency should be RESOLVED")
    console.log("✓ Check 8 Passed: Emergency Break-Glass full lifecycle (Patient <-> Doctor + Audit) verified.")

    // Check 9: Doctor Dashboard metrics reflect real DB state
    const dashRes = await request(port, "/api/professional/dashboard", "GET", docHeaders)
    assert(dashRes.status === 200, `Expected 200 from dashboard, got ${dashRes.status}`)
    assert(dashRes.body.data.metrics.completedTodayCount >= 1, "completedTodayCount should be >= 1")
    assert(dashRes.body.data.metrics.connectedPatientsCount >= 1, "connectedPatientsCount should be >= 1")
    console.log("✓ Check 9 Passed: Doctor Dashboard metrics accurately reflect live database records.")

    console.log("\n================================================================================")
    console.log("ALL 9 DOCTOR–PATIENT CONNECTION & CLINICAL WORKFLOW CHECKS PASSED (100%)")
    console.log("================================================================================")
  } finally {
    if (patientId) {
      await prisma.user.delete({ where: { id: patientId } }).catch(() => { })
    }
    if (verifiedDoctorId) {
      await prisma.professional.delete({ where: { id: verifiedDoctorId } }).catch(() => { })
    }
    if (pendingDoctorId) {
      await prisma.professional.delete({ where: { id: pendingDoctorId } }).catch(() => { })
    }
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await prisma.$disconnect()
  }
}

runDoctorPatientConnectionTests().catch((err) => {
  console.error("FATAL: Doctor–Patient connection tests failed:", err)
  process.exit(1)
})
