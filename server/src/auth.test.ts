import http from "http"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { ErrorCode } from "./errors/AppError"
import { registerPatient } from "./services/patientRegistrationService"
import { resetAllRateLimits } from "./middleware/rateLimiter"
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  generateSessionToken,
  hashSessionToken,
} from "./utils/session"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
} from "./generated/prisma/enums"

// Helper for making HTTP requests with full headers and cookie support
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
    const postData =
      options.body !== undefined ? JSON.stringify(options.body) : undefined
    const headers: Record<string, any> = {
      ...options.headers,
    }

    if (postData !== undefined) {
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
        let rawData = ""
        res.on("data", (chunk) => (rawData += chunk))
        res.on("end", () => {
          let parsedBody
          try {
            parsedBody = JSON.parse(rawData)
          } catch {
            parsedBody = rawData
          }

          // Parse Set-Cookie headers
          const rawCookies = res.headers["set-cookie"] || []
          const setCookies: Record<string, { value: string; flags: string[] }> =
            {}
          for (const cStr of rawCookies) {
            const parts = cStr.split(";").map((p) => p.trim())
            const [cName, cVal] = parts[0].split("=")
            setCookies[cName] = {
              value: cVal,
              flags: parts.slice(1),
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

async function runAuthTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: AUTHENTICATION, SESSION MANAGEMENT & LOGOUT TEST SUITE",
  )
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5199
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)

  // Test patient credentials
  const testNonce = Date.now().toString().slice(-6)
  const testEmail = `patient.auth.${testNonce}@example.com`
  const testPassword = "PatientStrongPassword2026!"
  const testPhone = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

  let registeredUserId = ""

  try {
    // 0. Setup: Register test patient via registration service
    console.log("\n[Setup] Registering initial test patient...")
    const regResult = await registerPatient({
      account: {
        firstName: "Kwame",
        middleName: "Kofi",
        lastName: "Appiah",
        dateOfBirth: new Date("1994-06-12"),
        sex: Sex.MALE,
        email: testEmail,
        phoneNumber: testPhone,
        password: testPassword,
        confirmPassword: testPassword,
        profilePhoto: undefined,
      },
      contact: {
        street: "45 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        district: undefined,
        emergencyContact: {
          fullName: "Akosua Appiah",
          relationship: Relationship.SIBLING,
          phoneNumber: "+233201112233",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.A_POSITIVE,
        genotype: Genotype.AA,
        knownAllergies: undefined,
        medicalConditions: undefined,
        currentMedications: undefined,
        previousSurgeries: undefined,
        medicalHistory: undefined,
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
        nhisId: undefined,
        nhisSchemeType: undefined,
        supportingDocument: undefined,
      },
      consents: {
        consents: [
          {
            consentType: ConsentType.TERMS_AND_PRIVACY,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.HEALTH_DATA_PROCESSING,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.PROFESSIONAL_ACCESS,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.AI_LIMITATIONS,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.BREAK_GLASS_DISCLOSURE,
            accepted: true,
            version: "1.0",
          },
          {
            consentType: ConsentType.INFORMATION_ACCURACY,
            accepted: true,
            version: "1.0",
          },
        ],
      },
    })

    registeredUserId = regResult.user.id
    console.log(`[Setup] Patient registered with ID: ${registeredUserId}`)

    // =========================================================================
    // CHECK 1: LOGIN WITH VALID CREDENTIALS
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 1: Login with Valid Credentials")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res1 = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: testEmail,
        password: testPassword,
      },
    })

    console.log("Status Code:", res1.status)
    console.log(
      "Response Body (Sanitized):",
      JSON.stringify(
        {
          status: res1.body.status,
          message: res1.body.message,
          user: res1.body.data?.user,
          hasCsrfToken: !!res1.body.data?.csrfToken,
          sessionExpiresAt: res1.body.data?.session?.expiresAt,
        },
        null,
        2,
      ),
    )

    if (res1.status !== 200 || res1.body.status !== "success") {
      throw new Error(`Check 1 Failed: Expected HTTP 200, got ${res1.status}`)
    }

    // Verify cookies set
    const sessionCookie1 = res1.setCookies[SESSION_COOKIE_NAME]
    const csrfCookie1 = res1.setCookies[CSRF_COOKIE_NAME]

    if (!sessionCookie1 || !sessionCookie1.value) {
      throw new Error("Check 1 Failed: healthitude_session cookie was not set!")
    }
    if (!csrfCookie1 || !csrfCookie1.value) {
      throw new Error("Check 1 Failed: healthitude_csrf cookie was not set!")
    }

    // Verify session in database (Rule F: tokenHash stored, not raw token)
    const tokenHash1 = hashSessionToken(sessionCookie1.value)
    const dbSession1 = await prisma.session.findUnique({
      where: { tokenHash: tokenHash1 },
    })

    if (!dbSession1 || dbSession1.userId !== registeredUserId) {
      throw new Error(
        "Check 1 Failed: Session not found in database with matching tokenHash!",
      )
    }
    if (dbSession1.revokedAt !== null) {
      throw new Error("Check 1 Failed: New session should not be revoked!")
    }

    // Rule D: passwordHash must NOT be in response
    if (JSON.stringify(res1.body).includes("passwordHash")) {
      throw new Error(
        "SECURITY VIOLATION: passwordHash leaked in login response!",
      )
    }

    console.log(
      "✔ CHECK 1 PASSED: Valid credentials authenticated. HTTP-only session and CSRF cookies issued. Session recorded in DB.",
    )

    // Store tokens for subsequent checks
    const activeSessionCookie = sessionCookie1.value
    const activeCsrfToken = csrfCookie1.value

    // =========================================================================
    // CHECK 2: LOGIN WITH AN INCORRECT PASSWORD
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 2: Login with an Incorrect Password")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res2 = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: testEmail,
        password: "CompletelyWrongPassword123!",
      },
    })

    console.log("Status Code:", res2.status)
    console.log("Response Body:", JSON.stringify(res2.body, null, 2))

    if (
      res2.status !== 401 ||
      res2.body.code !== ErrorCode.INVALID_CREDENTIALS
    ) {
      throw new Error(
        `Check 2 Failed: Expected HTTP 401 INVALID_CREDENTIALS, got ${res2.status}`,
      )
    }
    if (res2.setCookies[SESSION_COOKIE_NAME]) {
      throw new Error(
        "Check 2 Failed: Session cookie must not be set on failed login!",
      )
    }

    console.log(
      "✔ CHECK 2 PASSED: Incorrect password rejected with HTTP 401 INVALID_CREDENTIALS. No session set.",
    )

    // =========================================================================
    // CHECK 3: LOGIN WITH AN UNKNOWN EMAIL
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 3: Login with an Unknown Email (Rule R: Anti-Enumeration)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res3 = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: "nonexistent.patient.404@example.com",
        password: testPassword,
      },
    })

    console.log("Status Code:", res3.status)
    console.log("Response Body:", JSON.stringify(res3.body, null, 2))

    if (
      res3.status !== 401 ||
      res3.body.code !== ErrorCode.INVALID_CREDENTIALS
    ) {
      throw new Error(
        `Check 3 Failed: Expected HTTP 401 INVALID_CREDENTIALS, got ${res3.status}`,
      )
    }
    // Rule R: Message must match check 2 exactly ("Invalid email or password")
    if (res3.body.message !== "Invalid email or password") {
      throw new Error(
        "Check 3 Failed: Error message must be generic 'Invalid email or password' to prevent email enumeration.",
      )
    }

    console.log(
      "✔ CHECK 3 PASSED: Unknown email rejected with identical 401 message. Email enumeration prevented.",
    )

    // =========================================================================
    // CHECK 4: LOGIN RATE LIMITING
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 4: Login Rate Limiting (Rule Q: Rate Limit After 5 Failures)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    resetAllRateLimits() // Clean slate for rate limit test

    const bruteForceEmail = `brute.force.${Date.now()}@example.com`
    // Trigger 5 failed login attempts
    for (let i = 1; i <= 5; i++) {
      const failRes = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: bruteForceEmail, password: "wrong_password" },
      })
      if (failRes.status !== 401) {
        throw new Error(
          `Check 4 Failed: Attempt ${i} should be 401, got ${failRes.status}`,
        )
      }
    }

    // 6th attempt must trigger rate limit (HTTP 429)
    const rateLimitedRes = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: { email: bruteForceEmail, password: "wrong_password" },
    })

    console.log("6th Attempt Status Code:", rateLimitedRes.status)
    console.log(
      "6th Attempt Response Body:",
      JSON.stringify(rateLimitedRes.body, null, 2),
    )

    if (
      rateLimitedRes.status !== 429 ||
      rateLimitedRes.body.code !== ErrorCode.RATE_LIMIT_EXCEEDED
    ) {
      throw new Error(
        `Check 4 Failed: Expected HTTP 429 RATE_LIMIT_EXCEEDED, got ${rateLimitedRes.status}`,
      )
    }
    if (!rateLimitedRes.headers["retry-after"]) {
      throw new Error(
        "Check 4 Failed: Retry-After header expected on 429 rate limit response.",
      )
    }

    resetAllRateLimits() // Reset for remainder of test suite
    console.log(
      "✔ CHECK 4 PASSED: 6th consecutive failed attempt blocked with HTTP 429 RATE_LIMIT_EXCEEDED and Retry-After header.",
    )

    // =========================================================================
    // CHECK 5: SUCCESSFUL AUTHENTICATED REQUEST
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 5: Successful Authenticated Request (/api/auth/me)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res5 = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${activeSessionCookie}`,
      },
    })

    console.log("Status Code:", res5.status)
    console.log("Response Body:", JSON.stringify(res5.body, null, 2))

    if (res5.status !== 200 || res5.body.status !== "success") {
      throw new Error(`Check 5 Failed: Expected HTTP 200, got ${res5.status}`)
    }
    if (
      res5.body.data?.user?.email !== testEmail ||
      res5.body.data?.user?.id !== registeredUserId
    ) {
      throw new Error(
        "Check 5 Failed: Authenticated user does not match logged-in user.",
      )
    }
    if (res5.body.data?.user?.passwordHash) {
      throw new Error(
        "SECURITY VIOLATION: passwordHash present in /me response!",
      )
    }

    console.log(
      "✔ CHECK 5 PASSED: Session cookie successfully verified by authenticate middleware. User identity returned safely.",
    )

    // =========================================================================
    // CHECK 6: REQUEST WITHOUT A SESSION
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 6: Request Without a Session (Missing Authentication)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res6 = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
    })

    console.log("Status Code:", res6.status)
    console.log("Response Body:", JSON.stringify(res6.body, null, 2))

    if (
      res6.status !== 401 ||
      res6.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
    ) {
      throw new Error(
        `Check 6 Failed: Expected HTTP 401 AUTHENTICATION_REQUIRED, got ${res6.status}`,
      )
    }

    console.log(
      "✔ CHECK 6 PASSED: Unauthenticated request rejected with HTTP 401 AUTHENTICATION_REQUIRED.",
    )

    // =========================================================================
    // CHECK 7: REQUEST WITH AN INVALID SESSION
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 7: Request with an Invalid Session")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res7 = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=completely_invalid_random_token_99999`,
      },
    })

    console.log("Status Code:", res7.status)
    console.log("Response Body:", JSON.stringify(res7.body, null, 2))

    if (
      res7.status !== 401 ||
      res7.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
    ) {
      throw new Error(
        `Check 7 Failed: Expected HTTP 401 AUTHENTICATION_REQUIRED, got ${res7.status}`,
      )
    }

    console.log(
      "✔ CHECK 7 PASSED: Forged/invalid session token rejected with HTTP 401 AUTHENTICATION_REQUIRED.",
    )

    // =========================================================================
    // CHECK 8: EXPIRED SESSION
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 8: Expired Session (Rule N, P: Reject Expired Sessions)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Create a pre-expired session directly in database
    const expiredRawToken = generateSessionToken()
    const expiredTokenHash = hashSessionToken(expiredRawToken)
    await prisma.session.create({
      data: {
        userId: registeredUserId,
        tokenHash: expiredTokenHash,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
      },
    })

    const res8 = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${expiredRawToken}`,
      },
    })

    console.log("Status Code:", res8.status)
    console.log("Response Body:", JSON.stringify(res8.body, null, 2))

    if (
      res8.status !== 401 ||
      res8.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
    ) {
      throw new Error(
        `Check 8 Failed: Expected HTTP 401 AUTHENTICATION_REQUIRED on expired session, got ${res8.status}`,
      )
    }
    if (!res8.body.message.includes("expired")) {
      throw new Error(
        `Check 8 Failed: Expected 'expired' message, got ${res8.body.message}`,
      )
    }

    console.log(
      "✔ CHECK 8 PASSED: Expired session strictly rejected with HTTP 401.",
    )

    // =========================================================================
    // CHECK 9: LOGOUT (SERVER-SIDE REVOCATION)
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 9: Logout & Server-Side Session Revocation (Rule O)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res9 = await request(testPort, {
      path: "/api/auth/logout",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${activeSessionCookie}; ${CSRF_COOKIE_NAME}=${activeCsrfToken}`,
        "x-csrf-token": activeCsrfToken,
      },
    })

    console.log("Status Code:", res9.status)
    console.log("Response Body:", JSON.stringify(res9.body, null, 2))

    if (res9.status !== 200 || res9.body.status !== "success") {
      throw new Error(
        `Check 9 Failed: Expected HTTP 200 on logout, got ${res9.status}`,
      )
    }

    // Verify session in database has been marked revoked
    const dbSessionAfterLogout = await prisma.session.findUnique({
      where: { tokenHash: tokenHash1 },
    })

    if (!dbSessionAfterLogout || dbSessionAfterLogout.revokedAt === null) {
      throw new Error(
        "Check 9 Failed: Session was not marked revoked in PostgreSQL database!",
      )
    }

    console.log(
      "✔ CHECK 9 PASSED: Logout successful. Database session record marked revokedAt = " +
        dbSessionAfterLogout.revokedAt.toISOString(),
    )

    // =========================================================================
    // CHECK 10: REQUEST USING A SESSION AFTER LOGOUT
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 10: Request Using a Session After Logout (Replay Prevention)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res10 = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${activeSessionCookie}`,
      },
    })

    console.log("Status Code:", res10.status)
    console.log("Response Body:", JSON.stringify(res10.body, null, 2))

    if (
      res10.status !== 401 ||
      res10.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
    ) {
      throw new Error(
        `Check 10 Failed: Expected HTTP 401 on revoked session, got ${res10.status}`,
      )
    }
    if (!res10.body.message.includes("revoked")) {
      throw new Error(
        `Check 10 Failed: Expected 'revoked' message, got ${res10.body.message}`,
      )
    }

    console.log(
      "✔ CHECK 10 PASSED: Session reused after logout strictly rejected with HTTP 401. Server-side revocation confirmed.",
    )

    // =========================================================================
    // CHECK 11: COOKIE SECURITY ATTRIBUTES
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 11: Cookie Security Attributes (Rule G, H, I)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Perform fresh login to inspect Set-Cookie headers
    const res11 = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: { email: testEmail, password: testPassword },
    })

    const sessionCookieHeader = res11.setCookies[SESSION_COOKIE_NAME]
    const csrfCookieHeader = res11.setCookies[CSRF_COOKIE_NAME]

    console.log("Session Cookie Flags:", sessionCookieHeader.flags)
    console.log("CSRF Cookie Flags:", csrfCookieHeader.flags)

    // Rule G: HttpOnly on session cookie
    const hasHttpOnly = sessionCookieHeader.flags.some(
      (f) => f.toLowerCase() === "httponly",
    )
    if (!hasHttpOnly) {
      throw new Error(
        "Check 11 Failed: healthitude_session cookie MUST have HttpOnly flag!",
      )
    }

    // Rule I: SameSite=Lax
    const hasSameSiteLax = sessionCookieHeader.flags.some(
      (f) => f.toLowerCase() === "samesite=lax",
    )
    if (!hasSameSiteLax) {
      throw new Error(
        "Check 11 Failed: healthitude_session cookie MUST have SameSite=Lax!",
      )
    }

    // CSRF cookie must be readable by JavaScript (HttpOnly=false)
    const csrfHasHttpOnly = csrfCookieHeader.flags.some(
      (f) => f.toLowerCase() === "httponly",
    )
    if (csrfHasHttpOnly) {
      throw new Error(
        "Check 11 Failed: healthitude_csrf cookie must NOT have HttpOnly (client JS must read it)!",
      )
    }

    console.log(
      "✔ CHECK 11 PASSED: healthitude_session has HttpOnly, SameSite=Lax, Path=/. CSRF cookie is readable by frontend.",
    )

    const freshSessionToken = sessionCookieHeader.value
    const freshCsrfToken = csrfCookieHeader.value

    // =========================================================================
    // CHECK 12: CREDENTIALED CORS BEHAVIOR
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 12: Credentialed CORS Behavior (Rule J, K: No Wildcard Credentials)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Preflight OPTIONS from approved origin (http://localhost:5173)
    const corsPreflightRes = await request(testPort, {
      path: "/api/auth/me",
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
    })

    console.log("CORS Preflight Status:", corsPreflightRes.status)
    console.log(
      "Allow-Origin Header:",
      corsPreflightRes.headers["access-control-allow-origin"],
    )
    console.log(
      "Allow-Credentials Header:",
      corsPreflightRes.headers["access-control-allow-credentials"],
    )

    if (
      corsPreflightRes.headers["access-control-allow-origin"] !==
      "http://localhost:5173"
    ) {
      throw new Error(
        `Check 12 Failed: Expected Allow-Origin 'http://localhost:5173', got ${corsPreflightRes.headers["access-control-allow-origin"]}`,
      )
    }
    if (
      corsPreflightRes.headers["access-control-allow-credentials"] !== "true"
    ) {
      throw new Error("Check 12 Failed: Expected Allow-Credentials 'true'")
    }

    // Unauthorized origin preflight
    const rogueCorsRes = await request(testPort, {
      path: "/api/auth/me",
      method: "OPTIONS",
      headers: {
        Origin: "http://evil-attacker.example.com",
        "Access-Control-Request-Method": "GET",
      },
    })

    if (rogueCorsRes.headers["access-control-allow-origin"] === "*") {
      throw new Error(
        "SECURITY VIOLATION: Wildcard CORS allowed with credentials!",
      )
    }

    console.log(
      "✔ CHECK 12 PASSED: Credentialed CORS explicitly restricted to approved frontend origin. No wildcard credentials.",
    )

    // =========================================================================
    // CHECK 13: CSRF PROTECTION FOR STATE-CHANGING REQUESTS
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 13: CSRF Protection for State-Changing Requests (Rule L Double-Submit)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 13.1 Missing x-csrf-token header -> 403 Forbidden
    const res13_missing = await request(testPort, {
      path: "/api/auth/logout",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${freshSessionToken}; ${CSRF_COOKIE_NAME}=${freshCsrfToken}`,
        // Missing x-csrf-token
      },
    })

    console.log(
      "13.1 Missing CSRF Token Status (Expected 403):",
      res13_missing.status,
    )
    console.log(
      "13.1 Response Body:",
      JSON.stringify(res13_missing.body, null, 2),
    )

    if (
      res13_missing.status !== 403 ||
      res13_missing.body.code !== ErrorCode.FORBIDDEN
    ) {
      throw new Error(
        `Check 13.1 Failed: Expected HTTP 403 FORBIDDEN when CSRF header is missing, got ${res13_missing.status}`,
      )
    }

    // 13.2 Mismatched x-csrf-token header -> 403 Forbidden
    const res13_mismatch = await request(testPort, {
      path: "/api/auth/logout",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${freshSessionToken}; ${CSRF_COOKIE_NAME}=${freshCsrfToken}`,
        "x-csrf-token": "attacker_forged_csrf_token_99999",
      },
    })

    console.log(
      "13.2 Mismatched CSRF Token Status (Expected 403):",
      res13_mismatch.status,
    )
    console.log(
      "13.2 Response Body:",
      JSON.stringify(res13_mismatch.body, null, 2),
    )

    if (
      res13_mismatch.status !== 403 ||
      res13_mismatch.body.code !== ErrorCode.FORBIDDEN
    ) {
      throw new Error(
        `Check 13.2 Failed: Expected HTTP 403 FORBIDDEN on CSRF token mismatch, got ${res13_mismatch.status}`,
      )
    }

    // 13.3 Matching x-csrf-token header -> 200 OK
    const res13_valid = await request(testPort, {
      path: "/api/auth/logout",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${freshSessionToken}; ${CSRF_COOKIE_NAME}=${freshCsrfToken}`,
        "x-csrf-token": freshCsrfToken,
      },
    })

    console.log(
      "13.3 Valid CSRF Token Status (Expected 200):",
      res13_valid.status,
    )

    if (res13_valid.status !== 200 || res13_valid.body.status !== "success") {
      throw new Error(
        `Check 13.3 Failed: Expected HTTP 200 with valid CSRF token, got ${res13_valid.status}`,
      )
    }

    console.log(
      "✔ CHECK 13 PASSED: State-changing POST requires matching x-csrf-token header. CSRF strictly protected.",
    )

    // =========================================================================
    // CHECK 14: PATIENT PASSWORD CHANGE (POST /api/patient/change-password)
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 14: Patient Password Change & Validation")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 14.0 Re-login test patient after logout in Check 13
    resetAllRateLimits()
    const loginForPwRes = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: { email: testEmail, password: testPassword },
    })
    if (loginForPwRes.status !== 200) {
      throw new Error(
        `Check 14 setup failed: Re-login failed with status ${loginForPwRes.status}`,
      )
    }
    const pwSessionCookie = loginForPwRes.setCookies[SESSION_COOKIE_NAME]?.value
    const pwCsrfCookie = loginForPwRes.setCookies[CSRF_COOKIE_NAME]?.value

    // 14.1 Missing CSRF token -> 403 Forbidden
    const res14_noCsrf = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${pwSessionCookie}; ${CSRF_COOKIE_NAME}=${pwCsrfCookie}`,
      },
      body: {
        currentPassword: testPassword,
        newPassword: "NewPatientPassword2026!",
        confirmNewPassword: "NewPatientPassword2026!",
      },
    })
    console.log("14.1 Missing CSRF Status (Expected 403):", res14_noCsrf.status)
    if (res14_noCsrf.status !== 403) {
      throw new Error(
        `Check 14.1 Failed: Expected 403 on missing CSRF header, got ${res14_noCsrf.status}`,
      )
    }

    // 14.2 Incorrect current password -> 400 Validation Error
    const res14_wrongCurrent = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${pwSessionCookie}; ${CSRF_COOKIE_NAME}=${pwCsrfCookie}`,
        "x-csrf-token": pwCsrfCookie,
      },
      body: {
        currentPassword: "CompletelyWrongCurrentPassword!",
        newPassword: "NewPatientPassword2026!",
        confirmNewPassword: "NewPatientPassword2026!",
      },
    })
    console.log(
      "14.2 Wrong Current Password Status (Expected 400):",
      res14_wrongCurrent.status,
    )
    if (res14_wrongCurrent.status !== 400) {
      throw new Error(
        `Check 14.2 Failed: Expected 400 for incorrect current password, got ${res14_wrongCurrent.status}`,
      )
    }

    // 14.3 New password same as current password -> 400 Validation Error
    const res14_samePassword = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${pwSessionCookie}; ${CSRF_COOKIE_NAME}=${pwCsrfCookie}`,
        "x-csrf-token": pwCsrfCookie,
      },
      body: {
        currentPassword: testPassword,
        newPassword: testPassword,
        confirmNewPassword: testPassword,
      },
    })
    console.log(
      "14.3 Same Password Status (Expected 400):",
      res14_samePassword.status,
    )
    if (res14_samePassword.status !== 400) {
      throw new Error(
        `Check 14.3 Failed: Expected 400 when new password equals current, got ${res14_samePassword.status}`,
      )
    }

    // 14.4 Password confirmation mismatch -> 400 Validation Error
    const res14_mismatch = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${pwSessionCookie}; ${CSRF_COOKIE_NAME}=${pwCsrfCookie}`,
        "x-csrf-token": pwCsrfCookie,
      },
      body: {
        currentPassword: testPassword,
        newPassword: "NewPatientPassword2026!",
        confirmNewPassword: "MismatchedConfirmation2026!",
      },
    })
    console.log(
      "14.4 Password Mismatch Status (Expected 400):",
      res14_mismatch.status,
    )
    if (res14_mismatch.status !== 400) {
      throw new Error(
        `Check 14.4 Failed: Expected 400 for mismatched passwords, got ${res14_mismatch.status}`,
      )
    }

    // 14.5 Successful password change -> 200 OK
    const newPassword = "BrandNewSecurePassword2026!"
    const res14_success = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${pwSessionCookie}; ${CSRF_COOKIE_NAME}=${pwCsrfCookie}`,
        "x-csrf-token": pwCsrfCookie,
      },
      body: {
        currentPassword: testPassword,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      },
    })
    console.log("14.5 Success Status (Expected 200):", res14_success.status)
    if (res14_success.status !== 200) {
      throw new Error(
        `Check 14.5 Failed: Expected 200 on successful password change, got ${res14_success.status}`,
      )
    }

    // 14.6 Old password rejected on login -> 401 INVALID_CREDENTIALS
    resetAllRateLimits()
    const res14_oldLogin = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: { email: testEmail, password: testPassword },
    })
    console.log(
      "14.6 Old Password Login Status (Expected 401):",
      res14_oldLogin.status,
    )
    if (res14_oldLogin.status !== 401) {
      throw new Error(
        `Check 14.6 Failed: Old password should be rejected with 401, got ${res14_oldLogin.status}`,
      )
    }

    // 14.7 New password accepted on login -> 200 OK
    resetAllRateLimits()
    const res14_newLogin = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: { email: testEmail, password: newPassword },
    })
    console.log(
      "14.7 New Password Login Status (Expected 200):",
      res14_newLogin.status,
    )
    if (res14_newLogin.status !== 200) {
      throw new Error(
        `Check 14.7 Failed: New password should be accepted with 200, got ${res14_newLogin.status}`,
      )
    }

    console.log(
      "✔ CHECK 14 PASSED: Password change validated, old password rejected, and new password operational.",
    )

    // =========================================================================
    // CHECK 15: SESSION ROTATION ON RE-LOGIN
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 15: Session Rotation & Invalidation on Re-Login")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 15.1 Current active session token from res14_newLogin
    const session1RawToken =
      res14_newLogin.setCookies[SESSION_COOKIE_NAME]?.value
    const session1Hash = hashSessionToken(session1RawToken)

    // Verify session 1 exists and is unrevoked in DB
    const session1Before = await prisma.session.findUnique({
      where: { tokenHash: session1Hash },
    })
    if (!session1Before || session1Before.revokedAt !== null) {
      throw new Error(
        "Check 15 setup failed: Session 1 must be active and unrevoked",
      )
    }

    // 15.2 Re-login while sending existing session 1 cookie
    resetAllRateLimits()
    const res15_relogin = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${session1RawToken}`,
      },
      body: { email: testEmail, password: newPassword },
    })
    console.log("15.2 Re-login Status (Expected 200):", res15_relogin.status)
    if (res15_relogin.status !== 200) {
      throw new Error(
        `Check 15.2 Failed: Re-login failed with status ${res15_relogin.status}`,
      )
    }

    const session2RawToken =
      res15_relogin.setCookies[SESSION_COOKIE_NAME]?.value
    const session2Hash = hashSessionToken(session2RawToken)

    // 15.3 Check database: Session 1 must now be revoked, Session 2 must be active
    const session1After = await prisma.session.findUnique({
      where: { tokenHash: session1Hash },
    })
    const session2Record = await prisma.session.findUnique({
      where: { tokenHash: session2Hash },
    })

    if (!session1After?.revokedAt) {
      throw new Error(
        "Check 15.3 Failed: Prior session 1 was not revoked upon re-login",
      )
    }
    if (!session2Record || session2Record.revokedAt !== null) {
      throw new Error(
        "Check 15.3 Failed: New session 2 was not properly created",
      )
    }

    // 15.4 Session 1 cannot access /api/auth/me -> 401 Unauthorized
    const res15_oldSessionAccess = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${session1RawToken}`,
      },
    })
    console.log(
      "15.4 Revoked Session Access Status (Expected 401):",
      res15_oldSessionAccess.status,
    )
    if (res15_oldSessionAccess.status !== 401) {
      throw new Error(
        `Check 15.4 Failed: Revoked session 1 accessed /me with ${res15_oldSessionAccess.status}`,
      )
    }

    // 15.5 Session 2 successfully accesses /api/auth/me -> 200 OK
    const res15_newSessionAccess = await request(testPort, {
      path: "/api/auth/me",
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${session2RawToken}`,
      },
    })
    console.log(
      "15.5 Active Session Access Status (Expected 200):",
      res15_newSessionAccess.status,
    )
    if (res15_newSessionAccess.status !== 200) {
      throw new Error(
        `Check 15.5 Failed: Active session 2 failed to access /me with ${res15_newSessionAccess.status}`,
      )
    }

    console.log(
      "✔ CHECK 15 PASSED: Session rotation on re-login verified. Prior session revoked in DB and rejected.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 15 AUTHENTICATION & SESSION MANAGEMENT CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    console.log("\n[Cleanup] Cleaning up test user and sessions...")
    if (registeredUserId) {
      await prisma.user.deleteMany({
        where: { id: registeredUserId },
      })
      console.log(
        `[Cleanup] Deleted test user ${registeredUserId} and associated sessions.`,
      )
    }

    await new Promise<void>((resolve) => {
      server.close(async () => {
        await prisma.$disconnect()
        resolve()
      })
    })
  }
}

runAuthTests().catch((err) => {
  console.error("Auth Test Suite Failed:", err)
  process.exit(1)
})
