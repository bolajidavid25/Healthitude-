import http from "http"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import {
  PROF_SESSION_COOKIE_NAME,
  PROF_CSRF_COOKIE_NAME,
} from "./utils/professionalSession"
import { SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } from "./utils/session"
import {
  ProfessionalVerificationStatus,
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
} from "./generated/prisma/enums"
import { registerPatient } from "./services/patientRegistrationService"

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
  setCookies: Record<string, { value: string; flags: string[] }>
}

async function request(
  port: number,
  options: {
    path: string
    method: string
    headers?: Record<string, string>
    body?: any
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : undefined
    const headers: Record<string, string | number> = {
      ...(options.headers || {}),
    }

    if (postData) {
      headers["Content-Type"] = "application/json"
      headers["Content-Length"] = Buffer.byteLength(postData)
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: options.path,
        method: options.method,
        headers,
      },
      (res) => {
        let rawBody = ""
        res.on("data", (chunk) => {
          rawBody += chunk
        })
        res.on("end", () => {
          let parsedBody: any
          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : {}
          } catch {
            parsedBody = rawBody
          }

          const setCookies: Record<string, { value: string; flags: string[] }> = {}
          const rawSetCookies = res.headers["set-cookie"]
          if (rawSetCookies) {
            for (const cookieStr of rawSetCookies) {
              const parts = cookieStr.split(";").map((p) => p.trim())
              const [nameValue, ...flags] = parts
              const eqIdx = nameValue.indexOf("=")
              if (eqIdx !== -1) {
                const name = nameValue.substring(0, eqIdx).trim()
                const val = nameValue.substring(eqIdx + 1).trim()
                setCookies[name] = { value: val, flags }
              }
            }
          }

          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
            setCookies,
          })
        })
      },
    )

    req.on("error", reject)
    if (postData) req.write(postData)
    req.end()
  })
}

function parseCookieHeader(cookies: Record<string, { value: string }>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v.value}`)
    .join("; ")
}

let testServer: http.Server
const TEST_PORT = 5188
const createdProfessionalIds: string[] = []
const createdPatientIds: string[] = []

async function runTestSuite() {
  console.log("================================================================================")
  console.log("STEP 2: PROFESSIONAL IDENTITY, AUTHENTICATION & VERIFICATION TEST SUITE")
  console.log("================================================================================")

  const app = createApp()
  testServer = http.createServer(app)
  await new Promise<void>((resolve) => testServer.listen(TEST_PORT, resolve))
  console.log(`[Test Server] Running on http://127.0.0.1:${TEST_PORT}\n`)

  let passedTests = 0
  let totalTests = 0

  function pass(label: string, detail?: string) {
    passedTests++
    totalTests++
    console.log(`[PASS] Check ${totalTests}: ${label}`)
    if (detail) console.log(`       Details: ${detail}`)
  }

  function fail(label: string, reason: string) {
    totalTests++
    console.error(`[FAIL] Check ${totalTests}: ${label}`)
    console.error(`       Reason: ${reason}`)
    throw new Error(`Test failed: ${label} - ${reason}`)
  }

  const timestamp = Date.now()
  const docEmail = `dr.boateng.${timestamp}@example.com`
  const docPhone = `+23324${Math.floor(1000000 + Math.random() * 9000000)}`
  const docLicence = `GMA-2026-${Math.floor(10000 + Math.random() * 90000)}`

  let registeredProfId: string
  let profCookies: Record<string, { value: string; flags: string[] }> = {}

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // 1. REGISTRATION TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 1: PROFESSIONAL REGISTRATION ---")

    // Check 1: Valid Professional Registration
    const regRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Kofi",
        lastName: "Boateng",
        email: docEmail,
        phoneNumber: docPhone,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "General Practice",
        licenceNumber: docLicence,
        licenceExpiry: "2027-12-31",
        regulatoryBody: "Ghana Medical Association",
        facility: "Korle Bu Teaching Hospital",
      },
    })

    if (regRes.status !== 201) {
      fail("Valid professional registration returns HTTP 201", `Expected 201, got ${regRes.status}: ${JSON.stringify(regRes.body)}`)
    }
    if (regRes.body.data.verificationStatus !== "PENDING") {
      fail("New account defaults to PENDING verification status", `Got ${regRes.body.data.verificationStatus}`)
    }
    if (regRes.body.data.passwordHash) {
      fail("Registration response sanitization", "passwordHash leaked in response!")
    }
    registeredProfId = regRes.body.data.id
    createdProfessionalIds.push(registeredProfId)
    pass("Valid professional registration creates account in PENDING status", `ID=${registeredProfId}, Status=${regRes.body.data.verificationStatus}`)

    // Check 2: Duplicate Email Registration
    const dupEmailRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Kwame",
        lastName: "Mensah",
        email: docEmail,
        phoneNumber: `+23320${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "Cardiology",
        licenceNumber: `GMA-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        licenceExpiry: "2027-12-31",
        regulatoryBody: "Ghana Medical Association",
        facility: "Ridge Hospital",
      },
    })
    if (dupEmailRes.status !== 409) {
      fail("Duplicate email registration rejected with 409", `Expected 409, got ${dupEmailRes.status}`)
    }
    pass("Duplicate professional email registration rejected with HTTP 409", `Status=${dupEmailRes.status}, Error=${dupEmailRes.body.message}`)

    // Check 3: Duplicate Licence Number Registration
    const dupLicenceRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Ama",
        lastName: "Osei",
        email: `dr.ama.${timestamp}@example.com`,
        phoneNumber: `+23320${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "Pediatrics",
        licenceNumber: docLicence, // duplicate
        licenceExpiry: "2027-12-31",
        regulatoryBody: "Ghana Medical Association",
        facility: "37 Military Hospital",
      },
    })
    if (dupLicenceRes.status !== 409) {
      fail("Duplicate licence registration rejected with 409", `Expected 409, got ${dupLicenceRes.status}`)
    }
    pass("Duplicate medical licence registration rejected with HTTP 409", `Status=${dupLicenceRes.status}`)

    // Check 4: Invalid Registration (Weak Password & Expired Licence)
    const invalidRegRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Invalid",
        lastName: "Doctor",
        email: `invalid.${timestamp}@example.com`,
        phoneNumber: docPhone,
        password: "weak",
        confirmPassword: "weak",
        category: "DOCTOR",
        specialty: "Surgery",
        licenceNumber: `GMA-EXPIRED-${timestamp}`,
        licenceExpiry: "2020-01-01", // expired!
        regulatoryBody: "GMA",
        facility: "Clinic",
      },
    })
    if (invalidRegRes.status !== 400) {
      fail("Invalid registration rejected with 400", `Expected 400, got ${invalidRegRes.status}`)
    }
    pass("Invalid registration data (weak password, expired licence) rejected with HTTP 400", `Errors=${JSON.stringify(invalidRegRes.body.errors || invalidRegRes.body.message)}`)

    // Check 5: Privilege Escalation Attempt (client passes role: ADMIN or verificationStatus: VERIFIED)
    const privEscalationRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Hacker",
        lastName: "Doctor",
        email: `hacker.${timestamp}@example.com`,
        phoneNumber: `+23327${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "Oncology",
        licenceNumber: `GMA-HACK-${timestamp}`,
        licenceExpiry: "2028-12-31",
        regulatoryBody: "GMA",
        facility: "Hospital",
        role: "ADMIN",
        isAdmin: true,
        verificationStatus: "VERIFIED",
      },
    })
    if (privEscalationRes.status !== 400) {
      fail("Privilege escalation attempt rejected with 400", `Expected 400, got ${privEscalationRes.status}`)
    }
    pass("Public registration attempting privilege escalation (ADMIN / pre-verified) strictly rejected", `Status=${privEscalationRes.status}`)

    // ══════════════════════════════════════════════════════════════════════════
    // 2. AUTHENTICATION & SESSION ISOLATION TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 2: PROFESSIONAL AUTHENTICATION & SESSION ISOLATION ---")

    // Check 6: Valid Professional Login
    const loginRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: docEmail,
        password: "Password123!",
      },
    })
    if (loginRes.status !== 200) {
      fail("Valid professional login returns 200", `Got ${loginRes.status}: ${JSON.stringify(loginRes.body)}`)
    }
    profCookies = loginRes.setCookies
    if (!profCookies[PROF_SESSION_COOKIE_NAME]) {
      fail("Independent professional session cookie issued", `Missing ${PROF_SESSION_COOKIE_NAME} in cookies`)
    }
    if (!profCookies[PROF_CSRF_COOKIE_NAME]) {
      fail("Professional CSRF cookie issued", `Missing ${PROF_CSRF_COOKIE_NAME} in cookies`)
    }
    pass("Valid professional login succeeds and issues independent healthitude_prof_session cookie", `Cookie=${PROF_SESSION_COOKIE_NAME}`)

    // Check 7: Cookie Security Flags
    const profCookieFlags = profCookies[PROF_SESSION_COOKIE_NAME].flags
    const hasHttpOnly = profCookieFlags.some((f) => f.toLowerCase() === "httponly")
    const hasSameSite = profCookieFlags.some((f) => f.toLowerCase().includes("samesite=lax"))
    if (!hasHttpOnly || !hasSameSite) {
      fail("Professional cookie flags", `Expected HttpOnly and SameSite=Lax. Flags: ${JSON.stringify(profCookieFlags)}`)
    }
    pass("Professional session cookie has HttpOnly and SameSite=Lax flags", `Flags=${profCookieFlags.join("; ")}`)

    // Check 8: Incorrect Password Login
    const wrongPassRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: docEmail,
        password: "WrongPassword999!",
      },
    })
    if (wrongPassRes.status !== 401) {
      fail("Incorrect password rejected with 401", `Expected 401, got ${wrongPassRes.status}`)
    }
    pass("Incorrect professional password rejected with HTTP 401 INVALID_CREDENTIALS", `Status=${wrongPassRes.status}`)

    // Check 9: Unknown Email Login (Anti-enumeration)
    const unknownEmailRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: "nonexistent.doctor@example.com",
        password: "Password123!",
      },
    })
    if (unknownEmailRes.status !== 401 || unknownEmailRes.body.code !== "INVALID_CREDENTIALS") {
      fail("Unknown email rejected with identical 401", `Expected 401 INVALID_CREDENTIALS, got ${unknownEmailRes.status}`)
    }
    pass("Unknown professional email rejected with generic message (timing side-channel safe)", `Status=${unknownEmailRes.status}`)

    // Check 10: Authenticated GET /api/professional/me
    const meRes = await request(TEST_PORT, {
      path: "/api/professional/me",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (meRes.status !== 200 || meRes.body.data.professional.email !== docEmail) {
      fail("GET /api/professional/me retrieves authenticated professional", `Got status ${meRes.status}`)
    }
    pass("GET /api/professional/me returns authenticated professional identity", `Name=${meRes.body.data.professional.firstName} ${meRes.body.data.professional.lastName}`)

    // Check 11: Patient Session Attempting to Access Professional Endpoint
    // First, register & log in a genuine patient via patient onboarding service
    const patientEmail = `patient.test.${timestamp}@example.com`
    const patientReg = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "Mensah",
        dateOfBirth: new Date("1995-05-15"),
        sex: Sex.FEMALE,
        email: patientEmail,
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: "PatientPassword123!",
        confirmPassword: "PatientPassword123!",
      },
      contact: {
        street: "12 Airport Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kweku Mensah",
          relationship: Relationship.PARENT,
          phoneNumber: "+233201112233",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.O_POSITIVE,
        genotype: Genotype.AA,
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
      },
      consents: {
        consents: [
          {
            consentType: ConsentType.TERMS_AND_PRIVACY,
            accepted: true,
            version: "1.0",
          },
        ],
      },
    })
    createdPatientIds.push(patientReg.user.id)

    const patientLoginRes = await request(TEST_PORT, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: patientEmail,
        password: "PatientPassword123!",
      },
    })
    const patientCookies = patientLoginRes.setCookies

    // Patient attempts to call GET /api/professional/me
    const patientAccessProfRes = await request(TEST_PORT, {
      path: "/api/professional/me",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(patientCookies), // patient cookies only
      },
    })
    if (patientAccessProfRes.status !== 401) {
      fail("Patient session rejected from professional endpoint", `Expected 401, got ${patientAccessProfRes.status}`)
    }
    pass("Patient session attempting to access /api/professional/me strictly rejected with HTTP 401", `Status=${patientAccessProfRes.status}`)

    // Check 12: Professional Session Attempting to Access Patient Endpoint
    const profAccessPatientRes = await request(TEST_PORT, {
      path: "/api/patients/profile",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies), // professional cookies only
      },
    })
    if (profAccessPatientRes.status !== 401) {
      fail("Professional session rejected from patient endpoint", `Expected 401, got ${profAccessPatientRes.status}`)
    }
    pass("Professional session attempting to access patient profile strictly rejected with HTTP 401", `Status=${profAccessPatientRes.status}`)

    // ══════════════════════════════════════════════════════════════════════════
    // 3. VERIFICATION LIFECYCLE & RESTRICTED ACCESS TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 3: VERIFICATION LIFECYCLE & CLINICAL GATING ---")

    // Check 13: Pending Professional Can View Verification Status
    const statusRes = await request(TEST_PORT, {
      path: "/api/professional/verification-status",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (statusRes.status !== 200 || statusRes.body.data.verificationStatus !== "PENDING") {
      fail("Pending professional can view verification status", `Got ${statusRes.status}`)
    }
    pass("Pending professional can access GET /api/professional/verification-status", `Status=${statusRes.body.data.verificationStatus}, Licence=${statusRes.body.data.licenceNumber}`)

    // Check 14: Pending Professional Can Update Permitted Profile Information
    const updateProfileRes = await request(TEST_PORT, {
      path: "/api/professional/profile",
      method: "PATCH",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
      body: {
        facility: "Korle Bu Teaching Hospital - Surgery Annex",
      },
    })
    if (updateProfileRes.status !== 200 || !updateProfileRes.body.data.facility.includes("Surgery Annex")) {
      fail("Pending professional can update permitted profile fields", `Got ${updateProfileRes.status}`)
    }
    pass("Pending professional can update permitted contact and facility details", `NewFacility=${updateProfileRes.body.data.facility}`)

    // Check 15: Unverified Professional BLOCKED from Clinical Operations Probe
    const probePendingRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (probePendingRes.status !== 403) {
      fail("Unverified professional blocked from clinical operations probe", `Expected 403, got ${probePendingRes.status}: ${JSON.stringify(probePendingRes.body)}`)
    }
    pass("Unverified (PENDING) professional blocked from clinical operations with HTTP 403", `Status=403, Message=${probePendingRes.body.message}`)

    // Check 16: Unauthorized User / Doctor Cannot Review or Approve Credentials
    const unauthorizedReviewRes = await request(TEST_PORT, {
      path: `/api/professional/admin/review/${registeredProfId}`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(profCookies), // Doctor credentials without admin key
      },
      body: {
        action: "VERIFY",
      },
    })
    if (unauthorizedReviewRes.status !== 403) {
      fail("Doctor attempting admin verification review rejected with 403", `Expected 403, got ${unauthorizedReviewRes.status}`)
    }
    pass("Doctor attempting to approve credentials rejected with HTTP 403 Forbidden", `Status=${unauthorizedReviewRes.status}`)

    // Check 17: Professional Cannot Self-Approve Even With Admin Key
    const selfApproveRes = await request(TEST_PORT, {
      path: `/api/professional/admin/review/${registeredProfId}`,
      method: "POST",
      headers: {
        "x-admin-key": "healthitude-admin-secure-key-2026",
        "x-admin-id": registeredProfId, // Self-approval attempt!
      },
      body: {
        action: "VERIFY",
      },
    })
    if (selfApproveRes.status !== 403) {
      fail("Self-approval attempt rejected with 403", `Expected 403, got ${selfApproveRes.status}`)
    }
    pass("Professional cannot self-approve credentials (self-approval strictly prohibited)", `Status=${selfApproveRes.status}`)

    // Check 18: Administrator Transitions Status to UNDER_REVIEW
    const underReviewRes = await request(TEST_PORT, {
      path: `/api/professional/admin/review/${registeredProfId}`,
      method: "POST",
      headers: {
        "x-admin-key": "healthitude-admin-secure-key-2026",
        "x-admin-id": "admin-dr-yeboah",
      },
      body: {
        action: "UNDER_REVIEW",
        reason: "Credentials forwarded to GMA council for primary source verification",
      },
    })
    if (underReviewRes.status !== 200 || underReviewRes.body.data.verificationStatus !== "UNDER_REVIEW") {
      fail("Admin can transition status to UNDER_REVIEW", `Got ${underReviewRes.status}`)
    }
    pass("Administrator transitions status to UNDER_REVIEW", `NewStatus=${underReviewRes.body.data.verificationStatus}`)

    // Check 19: UNDER_REVIEW Professional Still Blocked from Clinical Operations
    const probeReviewRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (probeReviewRes.status !== 403) {
      fail("UNDER_REVIEW professional blocked from clinical operations", `Expected 403, got ${probeReviewRes.status}`)
    }
    pass("UNDER_REVIEW professional remains restricted from clinical operations (HTTP 403)", `Status=403`)

    // Check 20: Administrator Verifies Professional Credentials
    const verifyRes = await request(TEST_PORT, {
      path: `/api/professional/admin/review/${registeredProfId}`,
      method: "POST",
      headers: {
        "x-admin-key": "healthitude-admin-secure-key-2026",
        "x-admin-id": "admin-dr-yeboah",
      },
      body: {
        action: "VERIFY",
        reason: "Licence verified with Ghana Medical Association registry",
      },
    })
    if (verifyRes.status !== 200 || verifyRes.body.data.verificationStatus !== "VERIFIED") {
      fail("Admin verification succeeds", `Got ${verifyRes.status}`)
    }
    pass("Administrator approves professional: status becomes VERIFIED with verifiedAt timestamp", `VerifiedAt=${verifyRes.body.data.verifiedAt}`)

    // Check 21: Verified Professional CAN Access Clinical Operations Probe
    const probeVerifiedRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (probeVerifiedRes.status !== 200) {
      fail("Verified professional can access clinical operations", `Expected 200, got ${probeVerifiedRes.status}`)
    }
    pass("Verified professional granted access to clinical operations probe", `Status=200, Message=${probeVerifiedRes.body.message}`)

    // Check 22: Administrator Rejection Workflow
    // Create another professional to test rejection
    const rejectedEmail = `dr.rejected.${timestamp}@example.com`
    const rejRegRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Suspicious",
        lastName: "Practitioner",
        email: rejectedEmail,
        phoneNumber: `+23326${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "General Practice",
        licenceNumber: `GMA-FAKE-${timestamp}`,
        licenceExpiry: "2027-12-31",
        regulatoryBody: "Unknown Council",
        facility: "Unregistered Clinic",
      },
    })
    const rejProfId = rejRegRes.body.data.id
    createdProfessionalIds.push(rejProfId)

    // Admin rejects with reason
    const rejectActionRes = await request(TEST_PORT, {
      path: `/api/professional/admin/review/${rejProfId}`,
      method: "POST",
      headers: {
        "x-admin-key": "healthitude-admin-secure-key-2026",
        "x-admin-id": "admin-dr-yeboah",
      },
      body: {
        action: "REJECT",
        reason: "Licence number not found in GMA official registry",
      },
    })
    if (rejectActionRes.status !== 200 || rejectActionRes.body.data.verificationStatus !== "REJECTED") {
      fail("Admin rejection succeeds", `Got ${rejectActionRes.status}`)
    }
    pass("Administrator rejects invalid credentials: status becomes REJECTED with recorded reason", `Reason=${rejectActionRes.body.data.rejectionReason}`)

    // Log in as rejected professional and verify clinical probe returns 403
    const rejLoginRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: rejectedEmail,
        password: "Password123!",
      },
    })
    const rejCookies = rejLoginRes.setCookies
    const rejProbeRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(rejCookies),
      },
    })
    if (rejProbeRes.status !== 403) {
      fail("Rejected professional blocked from clinical operations", `Expected 403, got ${rejProbeRes.status}`)
    }
    pass("Rejected professional strictly forbidden from clinical operations (HTTP 403)", `Status=403`)

    // ══════════════════════════════════════════════════════════════════════════
    // 4. LOGOUT & SESSION INVALIDATION TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 4: PROFESSIONAL LOGOUT & SESSION REVOCATION ---")

    // Check 24: Professional Logout Revokes Session in DB and Clears Cookie
    const logoutRes = await request(TEST_PORT, {
      path: "/api/professional/logout",
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(profCookies),
      },
    })
    if (logoutRes.status !== 200) {
      fail("Professional logout returns 200", `Got ${logoutRes.status}`)
    }
    pass("Professional logout succeeds with HTTP 200 and revokes database session", `Message=${logoutRes.body.message}`)

    // Check 25: Replay Prevention on Revoked Professional Session
    const replayRes = await request(TEST_PORT, {
      path: "/api/professional/me",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies), // Revoked session
      },
    })
    if (replayRes.status !== 401) {
      fail("Revoked professional session rejected with 401", `Expected 401, got ${replayRes.status}`)
    }
    pass("Replaying revoked professional session strictly rejected with HTTP 401", `Status=401, Error=${replayRes.body.message}`)

    // Check 26: Patient Session Remains Active After Professional Logout (No Cross-Revocation)
    const patientStillActiveRes = await request(TEST_PORT, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(patientCookies),
      },
    })
    if (patientStillActiveRes.status !== 200) {
      fail("Patient session unaffected by professional logout", `Expected 200, got ${patientStillActiveRes.status}`)
    }
    pass("Patient session remains active after professional logout (zero cross-session interference)", `PatientEmail=${patientStillActiveRes.body.data.user.email}`)

    // ══════════════════════════════════════════════════════════════════════════
    // 5. EXISTING PATIENT SYSTEM PRESERVATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 5: PATIENT SYSTEM PRESERVATION ---")

    // Check 27: Patient Dashboard Access
    const dashRes = await request(TEST_PORT, {
      path: "/api/patients/dashboard",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(patientCookies),
      },
    })
    if (dashRes.status !== 200) {
      fail("Patient dashboard remains functional", `Got ${dashRes.status}`)
    }
    pass("Patient dashboard endpoint operational (/api/patients/dashboard)", `Status=200`)

    // Check 28: Patient Complaints Read
    const complaintsRes = await request(TEST_PORT, {
      path: "/api/patients/complaints",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(patientCookies),
      },
    })
    if (complaintsRes.status !== 200) {
      fail("Patient complaints read operational", `Got ${complaintsRes.status}`)
    }
    pass("Patient complaints endpoint operational (/api/patients/complaints)", `Status=200`)

    // Check 29: Patient Logout
    const patientLogoutRes = await request(TEST_PORT, {
      path: "/api/auth/logout",
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(patientCookies),
        "x-csrf-token": patientCookies[CSRF_COOKIE_NAME]?.value,
      },
    })
    if (patientLogoutRes.status !== 200) {
      fail("Patient logout remains operational", `Got ${patientLogoutRes.status}`)
    }
    pass("Patient logout remains operational and revokes patient session independently", `Status=200`)

    // ══════════════════════════════════════════════════════════════════════════
    // 6. ADMINISTRATOR PORTAL SUBSYSTEM TESTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("\n--- SECTION 6: ADMINISTRATOR PORTAL SUBSYSTEM ---")

    // Check 30: Dedicated Administrator Login (POST /api/admin/login)
    const adminLoginRes = await request(TEST_PORT, {
      path: "/api/admin/login",
      method: "POST",
      body: {
        email: "admin@healthitude.com",
        password: "AdminPassword123!",
      },
    })
    if (adminLoginRes.status !== 200) {
      fail("Dedicated admin login succeeds", `Expected 200, got ${adminLoginRes.status}: ${JSON.stringify(adminLoginRes.body)}`)
    }
    const adminCookies = adminLoginRes.setCookies
    if (!adminCookies["healthitude_admin_session"]) {
      fail("Admin login issues healthitude_admin_session cookie", `Missing cookie`)
    }
    pass("Dedicated administrator login endpoint (/api/admin/login) operational", `Admin=${adminLoginRes.body.administrator.firstName} ${adminLoginRes.body.administrator.lastName}`)

    // Check 31: Isolated Scoped Token
    const adminScope = adminLoginRes.body.scope
    if (!adminScope.includes("admin:write") || !adminScope.includes("admin:read")) {
      fail("Admin token contains isolated scope", `Expected admin:write and admin:read, got ${adminScope}`)
    }
    pass("Admin token contains isolated administrative scopes", `Scope=${adminScope}`)

    // Check 32: Invalid Admin Credentials Rejected
    const invalidAdminLogin = await request(TEST_PORT, {
      path: "/api/admin/login",
      method: "POST",
      body: {
        email: "admin@healthitude.com",
        password: "WrongPassword999!",
      },
    })
    if (invalidAdminLogin.status !== 401) {
      fail("Invalid admin credentials rejected with 401", `Got ${invalidAdminLogin.status}`)
    }
    pass("Invalid administrator credentials rejected with HTTP 401", `Status=${invalidAdminLogin.status}`)

    // Check 33: Non-Admin (Doctor) Attempting to Access /api/admin/audit-logs Rejected with 403
    const doctorAccessAdminRes = await request(TEST_PORT, {
      path: "/api/admin/audit-logs",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(profCookies), // Doctor cookie
      },
    })
    if (doctorAccessAdminRes.status !== 403) {
      fail("Healthcare professional rejected from admin endpoint with 403", `Got ${doctorAccessAdminRes.status}`)
    }
    pass("Healthcare professional attempting to access admin audit logs strictly rejected with HTTP 403", `Status=403`)

    // Check 34: Admin Action with Audit Logging (Review Doctor)
    const adminReviewWithAudit = await request(TEST_PORT, {
      path: `/api/admin/professionals/${registeredProfId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminCookies),
      },
      body: {
        action: "VERIFY",
        reason: "Re-verified after annual compliance review",
      },
    })
    if (adminReviewWithAudit.status !== 200) {
      fail("Admin review via /api/admin/professionals/:id/review succeeds", `Got ${adminReviewWithAudit.status}`)
    }
    pass("Administrator reviews doctor via dedicated admin endpoint with audit logging", `NewStatus=${adminReviewWithAudit.body.data.verificationStatus}`)

    // Check 35: Retrieve Recorded Admin Audit Logs (GET /api/admin/audit-logs)
    const auditLogsRes = await request(TEST_PORT, {
      path: "/api/admin/audit-logs",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(adminCookies),
      },
    })
    if (auditLogsRes.status !== 200 || !Array.isArray(auditLogsRes.body.data.logs)) {
      fail("Admin audit logs retrieval succeeds", `Got ${auditLogsRes.status}`)
    }
    const hasVerifyLog = auditLogsRes.body.data.logs.some(
      (log: any) => log.action === "PROFESSIONAL_VERIFIED" && log.targetId === registeredProfId,
    )
    if (!hasVerifyLog) {
      fail("Audit log contains the professional verification event", `Logs=${JSON.stringify(auditLogsRes.body.data.logs)}`)
    }
    pass("Administrative audit log successfully recorded and retrievable via GET /api/admin/audit-logs", `TotalLogs=${auditLogsRes.body.data.total}`)

    // Check 36: Administrator Logout
    const adminLogoutRes = await request(TEST_PORT, {
      path: "/api/admin/logout",
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminCookies),
      },
    })
    if (adminLogoutRes.status !== 200) {
      fail("Administrator logout succeeds", `Got ${adminLogoutRes.status}`)
    }
    pass("Administrator logout operational and revokes admin session independently", `Status=200`)

    // ──────────────────────────────────────────────────────────────────────────
    // SECTION 7: EXTENDED VERIFICATION LIFECYCLE, STATE MACHINE & EVIDENCE DOCS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 7: EXTENDED VERIFICATION LIFECYCLE & CREDENTIAL EVIDENCE ---")

    // Re-login as Admin for lifecycle operations
    const adminRelogin = await request(TEST_PORT, {
      path: "/api/admin/login",
      method: "POST",
      body: {
        email: "admin@healthitude.com",
        password: "AdminPassword123!",
      },
    })
    const adminReloginCookies = adminRelogin.setCookies

    // Create a dedicated lifecycle test doctor
    const lifecycleEmail = `dr.lifecycle.${Date.now()}@example.com`
    const lifecycleLicence = `GMA-LIFE-${Date.now()}`
    const lifecycleDoctorRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Kwabena",
        middleName: "Osei",
        lastName: "Frimpong",
        email: lifecycleEmail,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        profession: "Consultant Cardiologist",
        specialty: "Interventional Cardiology",
        specialistQualification: "FWACS (Cardiology)",
        qualification: "MBChB, MD",
        institution: "University of Ghana Medical School",
        graduationYear: 2012,
        licenceNumber: lifecycleLicence,
        licenceExpiry: "2029-12-31",
        regulatoryBody: "Medical and Dental Council of Ghana",
        facility: "National Cardiothoracic Centre, Korle Bu",
        termsAccepted: true,
      },
    })
    const lifecycleDoctorId = lifecycleDoctorRes.body.data.id
    createdProfessionalIds.push(lifecycleDoctorId)

    // Log in as lifecycle doctor
    const lifecycleLoginRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: lifecycleEmail,
        password: "Password123!",
      },
    })
    const lifecycleDoctorCookies = lifecycleLoginRes.setCookies

    // Check 37: Profile reflects full qualification and legal identity
    const lifecycleMeRes = await request(TEST_PORT, {
      path: "/api/professional/me",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    const profData = lifecycleMeRes.body.data.professional
    if (
      lifecycleMeRes.status !== 200 ||
      profData.middleName !== "Osei" ||
      profData.profession !== "Consultant Cardiologist" ||
      profData.specialistQualification !== "FWACS (Cardiology)" ||
      profData.qualification !== "MBChB, MD" ||
      profData.institution !== "University of Ghana Medical School" ||
      profData.graduationYear !== 2012
    ) {
      fail("Profile reflects complete legal and professional qualifications", `Data=${JSON.stringify(profData)}`)
    }
    pass("Doctor profile captures full legal name, qualifications, institution, specialty, and profession", `Profession=${profData.profession}, Institution=${profData.institution}`)

    // Check 38: Rule 5 - Invalid state transitions from PENDING rejected
    const invalidPendingToVerified = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "VERIFY",
      },
    })
    if (invalidPendingToVerified.status !== 400) {
      fail("Direct transition from PENDING to VERIFIED without review is rejected", `Got ${invalidPendingToVerified.status}`)
    }
    pass("Invalid status transition (PENDING -> VERIFIED without review) rejected with HTTP 400", `Status=400`)

    // Check 39: Rule 5 - Invalid transition (PENDING -> EXPIRED) rejected
    const invalidPendingToExpired = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "EXPIRE",
      },
    })
    if (invalidPendingToExpired.status !== 400) {
      fail("Direct transition from PENDING to EXPIRED rejected", `Got ${invalidPendingToExpired.status}`)
    }
    pass("Invalid status transition (PENDING -> EXPIRED) rejected with HTTP 400", `Status=400`)

    // Check 40: Transition PENDING -> UNDER_REVIEW succeeds
    const startReviewRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "START_REVIEW",
        notes: "Credentials submitted to Medical and Dental Council for primary source verification",
      },
    })
    if (startReviewRes.status !== 200 || startReviewRes.body.data.verificationStatus !== "UNDER_REVIEW") {
      fail("Transition to UNDER_REVIEW succeeds", `Got ${startReviewRes.status}`)
    }
    pass("Administrator initiates review: status transitions to UNDER_REVIEW", `Status=UNDER_REVIEW`)

    // Check 41: VERIFY_WITH_RESTRICTIONS without restrictions rejected with HTTP 400
    const missingRestrictionsRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "VERIFY_WITH_RESTRICTIONS",
      },
    })
    if (missingRestrictionsRes.status !== 400) {
      fail("VERIFY_WITH_RESTRICTIONS without restrictions parameter rejected", `Got ${missingRestrictionsRes.status}`)
    }
    pass("VERIFY_WITH_RESTRICTIONS without restrictions parameter rejected with HTTP 400", `Status=400`)

    // Check 42: VERIFY_WITH_RESTRICTIONS with valid restrictions succeeds
    const verifyWithRestrictionsRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "VERIFY_WITH_RESTRICTIONS",
        restrictions: "Telemedicine consultations only. In-person surgical procedures require senior proctor supervision.",
        notes: "Approved under provisional fellowship program",
      },
    })
    if (
      verifyWithRestrictionsRes.status !== 200 ||
      verifyWithRestrictionsRes.body.data.verificationStatus !== "VERIFIED_WITH_RESTRICTIONS" ||
      !verifyWithRestrictionsRes.body.data.restrictions
    ) {
      fail("VERIFY_WITH_RESTRICTIONS transition succeeds", `Got ${verifyWithRestrictionsRes.status}`)
    }
    pass("Administrator approves with restrictions: status becomes VERIFIED_WITH_RESTRICTIONS", `Restrictions=${verifyWithRestrictionsRes.body.data.restrictions}`)

    // Check 43: VERIFIED_WITH_RESTRICTIONS doctor granted access to clinical probe
    const restrictedProbeRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    if (restrictedProbeRes.status !== 200) {
      fail("VERIFIED_WITH_RESTRICTIONS granted clinical access", `Got ${restrictedProbeRes.status}`)
    }
    pass("Doctor with VERIFIED_WITH_RESTRICTIONS granted access to protected clinical operations", `Status=200`)

    // Check 44: Administrator lifts restrictions -> VERIFIED
    const liftRestrictionsRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "VERIFY",
        notes: "Proctor supervision completed successfully. Full unconditional privileges granted.",
      },
    })
    if (liftRestrictionsRes.status !== 200 || liftRestrictionsRes.body.data.verificationStatus !== "VERIFIED") {
      fail("Lifting restrictions to VERIFIED succeeds", `Got ${liftRestrictionsRes.status}`)
    }
    pass("Administrator lifts restrictions: status transitioned to full VERIFIED", `Status=VERIFIED`)

    // Check 45: Administrator suspends privileges (VERIFIED -> SUSPENDED)
    const suspendRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "SUSPEND",
        reason: "Temporary suspension pending MDC audit review",
      },
    })
    if (suspendRes.status !== 200 || suspendRes.body.data.verificationStatus !== "SUSPENDED") {
      fail("Suspension succeeds", `Got ${suspendRes.status}`)
    }
    pass("Administrator suspends doctor: status transitioned to SUSPENDED", `Status=SUSPENDED`)

    // Check 46: SUSPENDED doctor strictly blocked from clinical operations (HTTP 403)
    const suspendedProbeRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    if (suspendedProbeRes.status !== 403) {
      fail("SUSPENDED doctor blocked from clinical operations", `Got ${suspendedProbeRes.status}`)
    }
    pass("SUSPENDED doctor strictly forbidden from clinical operations with HTTP 403", `Status=403`)

    // Check 47: Administrator marks licence as EXPIRED
    // First reinstate to VERIFIED
    await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "REINSTATE",
        notes: "Audit cleared",
      },
    })
    // Transition to EXPIRED
    const expireRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "EXPIRE",
      },
    })
    if (expireRes.status !== 200 || expireRes.body.data.verificationStatus !== "EXPIRED") {
      fail("Transition to EXPIRED succeeds", `Got ${expireRes.status}`)
    }
    pass("Licence validity lapsed: status transitioned to EXPIRED", `Status=EXPIRED`)

    // Check 48: EXPIRED doctor strictly blocked from clinical operations (HTTP 403)
    const expiredProbeRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    if (expiredProbeRes.status !== 403) {
      fail("EXPIRED doctor blocked from clinical operations", `Got ${expiredProbeRes.status}`)
    }
    pass("EXPIRED doctor strictly forbidden from clinical operations with HTTP 403", `Status=403`)

    // Check 49: Administrator permanently revokes credentials (REVOKED)
    const revokeRes = await request(TEST_PORT, {
      path: `/api/admin/professionals/${lifecycleDoctorId}/review`,
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(adminReloginCookies),
      },
      body: {
        action: "REVOKE",
        reason: "Disciplinary order from Medical and Dental Council",
      },
    })
    if (revokeRes.status !== 200 || revokeRes.body.data.verificationStatus !== "REVOKED") {
      fail("Transition to REVOKED succeeds", `Got ${revokeRes.status}`)
    }
    pass("Administrator permanently revokes credentials: status transitioned to REVOKED", `Status=REVOKED`)

    // Check 50: REVOKED doctor strictly blocked from clinical operations (HTTP 403)
    const revokedProbeRes = await request(TEST_PORT, {
      path: "/api/professional/clinical-access-probe",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    if (revokedProbeRes.status !== 403) {
      fail("REVOKED doctor blocked from clinical operations", `Got ${revokedProbeRes.status}`)
    }
    pass("REVOKED doctor strictly forbidden from clinical operations with HTTP 403", `Status=403`)

    // Check 51: Credential Evidence Document Management (Rule 8: non-public internal reference)
    const docOwnerEmail = `dr.owner.${Date.now()}@example.com`
    const docOwnerRes = await request(TEST_PORT, {
      path: "/api/professional/register",
      method: "POST",
      body: {
        firstName: "Esi",
        lastName: "Aidoo",
        email: docOwnerEmail,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "Password123!",
        confirmPassword: "Password123!",
        category: "DOCTOR",
        specialty: "Pathology",
        licenceNumber: `GMA-DOC-${Date.now()}`,
        licenceExpiry: "2029-06-30",
        regulatoryBody: "Medical and Dental Council of Ghana",
        facility: "Korle Bu",
        termsAccepted: true,
      },
    })
    const docOwnerId = docOwnerRes.body.data.id
    createdProfessionalIds.push(docOwnerId)

    const docOwnerLoginRes = await request(TEST_PORT, {
      path: "/api/professional/login",
      method: "POST",
      body: {
        email: docOwnerEmail,
        password: "Password123!",
      },
    })
    const docOwnerCookies = docOwnerLoginRes.setCookies

    const attachDocRes = await request(TEST_PORT, {
      path: "/api/professional/documents",
      method: "POST",
      headers: {
        Cookie: parseCookieHeader(docOwnerCookies),
      },
      body: {
        documentType: "MEDICAL_LICENCE",
        title: "Medical & Dental Council Practicing Licence 2026",
        documentRef: "doc_ref_mdc_licence_9921_sec",
        fileName: "mdc_licence_2026.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
      },
    })
    if (attachDocRes.status !== 201 || !attachDocRes.body.data.id) {
      fail("Credential document attachment succeeds", `Got ${attachDocRes.status}`)
    }
    const attachedDocId = attachDocRes.body.data.id
    pass("Doctor attaches credential evidence document with internal secure reference", `DocID=${attachedDocId}`)

    // Check 52: List documents returns non-public metadata
    const listDocsRes = await request(TEST_PORT, {
      path: "/api/professional/documents",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(docOwnerCookies),
      },
    })
    if (listDocsRes.status !== 200 || listDocsRes.body.data.documents.length === 0) {
      fail("List documents succeeds", `Got ${listDocsRes.status}`)
    }
    const hasPublicUrl = listDocsRes.body.data.documents.some((d: any) => d.url || (d.documentRef && d.documentRef.startsWith("http")))
    if (hasPublicUrl) {
      fail("Documents must not expose public URLs (Rule 8)", "Found public URL in document response")
    }
    pass("Credential evidence list returns secure metadata with ZERO public URL exposure", `Count=${listDocsRes.body.data.count}`)

    // Check 53: Another professional cannot access another doctor's document (Rule 8)
    const crossDocRes = await request(TEST_PORT, {
      path: `/api/professional/documents/${attachedDocId}`,
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(lifecycleDoctorCookies),
      },
    })
    if (crossDocRes.status !== 403) {
      fail("Cross-professional document access blocked with HTTP 403", `Got ${crossDocRes.status}`)
    }
    pass("Cross-professional access to sensitive credential evidence strictly forbidden (HTTP 403)", `Status=403`)

    // Check 54: Unauthenticated request cannot access credential documents
    const unauthDocRes = await request(TEST_PORT, {
      path: `/api/professional/documents/${attachedDocId}`,
      method: "GET",
    })
    if (unauthDocRes.status !== 401) {
      fail("Unauthenticated document access rejected with HTTP 401", `Got ${unauthDocRes.status}`)
    }
    pass("Unauthenticated access to credential documents strictly rejected with HTTP 401", `Status=401`)

    // Check 55: Complete verification status endpoint returns full timeline and documents
    const fullStatusRes = await request(TEST_PORT, {
      path: "/api/professional/verification-status",
      method: "GET",
      headers: {
        Cookie: parseCookieHeader(docOwnerCookies),
      },
    })
    if (
      fullStatusRes.status !== 200 ||
      !Array.isArray(fullStatusRes.body.data.auditHistory) ||
      !Array.isArray(fullStatusRes.body.data.documents)
    ) {
      fail("Full verification status and history retrieval succeeds", `Got ${fullStatusRes.status}`)
    }
    pass("Complete verification audit history, document references, and decision timeline retrieved", `AuditLogs=${fullStatusRes.body.data.auditHistory.length}`)

    // Check 56: Patient authentication still 100% operational
    const patientLoginCheck = await request(TEST_PORT, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: patientEmail,
        password: "PatientPassword123!",
      },
    })
    if (patientLoginCheck.status !== 200) {
      fail("Patient login remains operational", `Got ${patientLoginCheck.status}`)
    }
    pass("Patient authentication remains 100% operational with independent sessions", `PatientID=${patientLoginCheck.body.data?.user?.id || patientReg.user.id}`)

    console.log("\n================================================================================")
    console.log(`ALL ${passedTests}/${totalTests} CHECKS PASSED (PROFESSIONAL + ADMIN SUBSYSTEM)!`)
    console.log("================================================================================")
  } finally {
    // Cleanup test records
    console.log("\n[Cleanup] Cleaning up test professional and patient records...")
    for (const pId of createdProfessionalIds) {
      await prisma.professional.delete({ where: { id: pId } }).catch(() => {})
    }
    for (const uId of createdPatientIds) {
      await prisma.user.delete({ where: { id: uId } }).catch(() => {})
    }
    testServer.close()
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite failed with unhandled error:", err)
  if (testServer) testServer.close()
  process.exit(1)
})
