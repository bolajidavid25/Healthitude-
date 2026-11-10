import http from "http"
import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import { createApp } from "./app"
import { createHealthRouter } from "./routes/health"
import { prisma } from "./config/prisma"
import { env } from "./config/env"
import { ErrorCode } from "./errors/AppError"
import { registerPatient } from "./services/patientRegistrationService"
import { patientRegistrationSchema } from "./validation/onboarding"
import { resetAllRateLimits } from "./middleware/rateLimiter"

async function registerTestPatient(payload: any, options?: any) {
  const parsed = patientRegistrationSchema.parse(payload)
  return registerPatient(parsed, options)
}
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
  CategoryVerificationStatus,
} from "./generated/prisma/enums"

// -----------------------------------------------------------------------------
// HTTP Client Helper
// -----------------------------------------------------------------------------
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
    rawBuffer?: Buffer
    rawContentType?: string
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    let payloadBuffer: Buffer | undefined

    if (options.rawBuffer) {
      payloadBuffer = options.rawBuffer
    } else if (options.body !== undefined) {
      payloadBuffer = Buffer.from(
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
      )
    }

    const headers: Record<string, any> = { ...options.headers }

    if (payloadBuffer) {
      if (options.rawContentType) {
        headers["Content-Type"] = options.rawContentType
      } else if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json"
      }
      headers["Content-Length"] = payloadBuffer.length
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
    if (payloadBuffer) req.write(payloadBuffer)
    req.end()
  })
}

function buildMultipartFormData(
  boundary: string,
  fieldName: string,
  fileName: string,
  mimeType: string,
  content: Buffer,
): Buffer {
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return Buffer.concat([head, content, tail])
}

// -----------------------------------------------------------------------------
// Fixture Generator
// -----------------------------------------------------------------------------
function generateFixture(tag = "sec") {
  const nonce =
    Date.now().toString().slice(-6) + Math.floor(Math.random() * 10000)
  const email = `test.${tag}.${nonce}@example.com`
  const phoneSuffix = (1000000 + Math.floor(Math.random() * 8999999)).toString()
  const phoneNumber = `024${phoneSuffix}`
  const password = "SecPassword2026!#"

  const allConsents = [
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
    { consentType: ConsentType.AI_LIMITATIONS, accepted: true, version: "1.0" },
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
  ]

  const payload = {
    account: {
      firstName: "Kwabena",
      middleName: "Akwasi",
      lastName: "Osei",
      dateOfBirth: "1992-05-15",
      sex: Sex.MALE,
      email,
      phoneNumber,
      password,
      confirmPassword: password,
    },
    contact: {
      street: "45 Ring Road Central",
      city: "Accra",
      state: "Greater Accra",
      district: "Accra Metropolitan",
      emergencyContact: {
        fullName: "Akosua Osei",
        relationship: Relationship.SPOUSE_PARTNER,
        phoneNumber: "0209998877",
      },
    },
    healthProfile: {
      bloodGroup: BloodGroup.A_POSITIVE,
      genotype: Genotype.AS,
      knownAllergies: "Aspirin",
      medicalConditions: "None",
      currentMedications: "Multivitamins",
      previousSurgeries: "None",
      medicalHistory: "Healthy adult",
    },
    patientCategory: {
      category: PatientCategory.NHIS_USER,
      nhisId: `GH-NHIS-${nonce}`,
      nhisSchemeType: "Standard NHIS",
    },
    consents: allConsents,
  }

  return { email, phoneNumber, password, payload, allConsents }
}

// -----------------------------------------------------------------------------
// Test Suite Execution
// -----------------------------------------------------------------------------
async function runStructuredSecurityRegressionTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: STRUCTURED BACKEND TEST, SECURITY REVIEW & REGRESSION PASS",
  )
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5195
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 200))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)

  const trackedUserEmails: string[] = []
  const trackedFilesToClean: string[] = []

  let passedCount = 0
  let failedCount = 0
  const totalChecks = 16

  try {
    // -------------------------------------------------------------------------
    // CHECK 1: Successful Registration
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 1: Successful Registration (Atomic 5-Stage Onboarding & Multi-Record Creation)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix1 = generateFixture("reg")
      trackedUserEmails.push(fix1.email)

      const res1 = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: fix1.payload,
      })

      if (res1.status !== 201 || res1.body.status !== "success") {
        throw new Error(
          `Expected HTTP 201 success, got ${res1.status}: ${JSON.stringify(res1.body)}`,
        )
      }

      // Verify response envelope and no passwordHash exposure
      if (
        !res1.body.data?.user?.id ||
        res1.body.data.user.email !== fix1.email
      ) {
        throw new Error(
          "Missing or invalid user object in registration response",
        )
      }
      if (JSON.stringify(res1.body).includes("passwordHash")) {
        throw new Error(
          "SECURITY VIOLATION: passwordHash exposed in registration response!",
        )
      }
      if (JSON.stringify(res1.body).includes(fix1.password)) {
        throw new Error(
          "SECURITY VIOLATION: Plaintext password leaked in registration response!",
        )
      }

      // Verify all 6 models created in PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { id: res1.body.data.user.id },
        include: {
          address: true,
          emergencyContact: true,
          healthProfile: true,
          patientCategory: true,
          consents: true,
        },
      })

      if (!dbUser) throw new Error("User record not found in PostgreSQL")
      if (!dbUser.address || dbUser.address.city !== "Accra")
        throw new Error("Address record missing")
      if (!dbUser.emergencyContact)
        throw new Error("EmergencyContact record missing")
      if (!dbUser.healthProfile) throw new Error("HealthProfile record missing")
      if (!dbUser.patientCategory)
        throw new Error("PatientCategory record missing")
      if (dbUser.consents.length !== 7)
        throw new Error(`Expected 7 consents, got ${dbUser.consents.length}`)

      console.log(
        "✔ CHECK 1 PASSED: Complete 5-stage patient registration created all 6 database models atomically.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 1 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 2: Duplicate Account Prevention
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 2: Duplicate Account Prevention (Email Normalization, Phone & Replay Defense)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix2 = generateFixture("dup")
      trackedUserEmails.push(fix2.email)

      // Register initial patient
      const res2_init = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: fix2.payload,
      })
      if (res2_init.status !== 201)
        throw new Error("Initial setup registration failed")

      // Attempt duplicate email with uppercase and spaces
      const dupEmailPayload = {
        ...fix2.payload,
        account: {
          ...fix2.payload.account,
          email: `   ${fix2.email.toUpperCase()}   `,
          phoneNumber: "0240001122",
        },
      }
      const res2_dupEmail = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: dupEmailPayload,
      })

      if (
        res2_dupEmail.status !== 409 ||
        res2_dupEmail.body.code !== ErrorCode.RESOURCE_CONFLICT
      ) {
        throw new Error(
          `Expected 409 RESOURCE_CONFLICT on duplicate normalized email, got ${res2_dupEmail.status}`,
        )
      }

      // Attempt duplicate phone number with new email
      const dupPhonePayload = {
        ...fix2.payload,
        account: {
          ...fix2.payload.account,
          email: `other.${Date.now()}@example.com`,
          phoneNumber: fix2.phoneNumber,
        },
      }
      const res2_dupPhone = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: dupPhonePayload,
      })

      if (
        res2_dupPhone.status !== 409 ||
        res2_dupPhone.body.code !== ErrorCode.RESOURCE_CONFLICT
      ) {
        throw new Error(
          `Expected 409 RESOURCE_CONFLICT on duplicate phone number, got ${res2_dupPhone.status}`,
        )
      }

      // Confirm only 1 user exists in DB
      const userCount = await prisma.user.count({
        where: { email: fix2.email },
      })
      if (userCount !== 1)
        throw new Error(`Expected 1 user in DB, found ${userCount}`)

      console.log(
        "✔ CHECK 2 PASSED: Duplicate email and phone conflicts rejected with HTTP 409 without creating extra records.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 2 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 3: Validation Failures
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 3: Validation Failures (Malformed JSON, Missing Fields, Calendar Dates, Enums)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      // 3.1 Malformed JSON
      const res3_malformed = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: '{"broken": json unquoted',
        headers: { "Content-Type": "application/json" },
      })
      if (
        res3_malformed.status !== 400 ||
        res3_malformed.body.code !== ErrorCode.MALFORMED_JSON
      ) {
        throw new Error(
          `Expected 400 MALFORMED_JSON, got ${res3_malformed.status}`,
        )
      }

      // 3.2 Missing required field (account.lastName missing)
      const fix3 = generateFixture("val")
      const missingLastNamePayload = {
        ...fix3.payload,
        account: { ...fix3.payload.account, lastName: "" },
      }
      delete (missingLastNamePayload.account as any).lastName

      const res3_missing = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: missingLastNamePayload,
      })
      if (
        res3_missing.status !== 400 ||
        res3_missing.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR for missing field, got ${res3_missing.status}`,
        )
      }

      // 3.3 Invalid calendar date (e.g. 2023-02-31)
      const invalidDobPayload = {
        ...fix3.payload,
        account: { ...fix3.payload.account, dateOfBirth: "2023-02-31" },
      }
      const res3_dob = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: invalidDobPayload,
      })
      if (
        res3_dob.status !== 400 ||
        res3_dob.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR for impossible calendar date, got ${res3_dob.status}`,
        )
      }

      // 3.4 Unsupported enum values (e.g. invalid sex)
      const invalidSexPayload = {
        ...fix3.payload,
        account: { ...fix3.payload.account, sex: "INVALID_SEX" },
      }
      const res3_sex = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: invalidSexPayload,
      })
      if (
        res3_sex.status !== 400 ||
        res3_sex.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR for invalid enum, got ${res3_sex.status}`,
        )
      }

      // 3.5 Injected server-controlled property
      const injectedPropPayload = {
        ...fix3.payload,
        account: {
          ...fix3.payload.account,
          role: "ADMIN",
          passwordHash: "hacked",
        },
      }
      const res3_injected = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: injectedPropPayload,
      })
      if (
        res3_injected.status !== 400 ||
        res3_injected.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 for injected server-controlled property, got ${res3_injected.status}`,
        )
      }

      console.log(
        "✔ CHECK 3 PASSED: Malformed JSON, missing fields, invalid calendar dates, invalid enums, and injected properties rejected with HTTP 400.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 3 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 4: Transaction Rollback
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 4: Transaction Rollback (Multi-Record Registration Atomicity On Failure)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix4 = generateFixture("roll")
      const countsBefore = {
        users: await prisma.user.count(),
        addresses: await prisma.address.count(),
        emergencyContacts: await prisma.emergencyContact.count(),
        healthProfiles: await prisma.healthProfile.count(),
        patientCategoryRecords: await prisma.patientCategoryRecord.count(),
        consentRecords: await prisma.consentRecord.count(),
      }

      let errorThrown = false
      try {
        await registerTestPatient(fix4.payload, {
          injectSimulatedErrorAfterStep: "address",
        })
      } catch (err: any) {
        errorThrown = true
      }

      if (!errorThrown) throw new Error("Simulated failure was not thrown")

      const countsAfter = {
        users: await prisma.user.count(),
        addresses: await prisma.address.count(),
        emergencyContacts: await prisma.emergencyContact.count(),
        healthProfiles: await prisma.healthProfile.count(),
        patientCategoryRecords: await prisma.patientCategoryRecord.count(),
        consentRecords: await prisma.consentRecord.count(),
      }

      if (
        countsBefore.users !== countsAfter.users ||
        countsBefore.addresses !== countsAfter.addresses ||
        countsBefore.emergencyContacts !== countsAfter.emergencyContacts ||
        countsBefore.healthProfiles !== countsAfter.healthProfiles ||
        countsBefore.patientCategoryRecords !==
          countsAfter.patientCategoryRecords ||
        countsBefore.consentRecords !== countsAfter.consentRecords
      ) {
        throw new Error(
          "DATABASE CORRUPTION: Transaction failed to rollback partial records!",
        )
      }

      const orphan = await prisma.user.findUnique({
        where: { email: fix4.email },
      })
      if (orphan)
        throw new Error("Orphan user record found in DB after rollback!")

      console.log(
        "✔ CHECK 4 PASSED: Database transaction rolled back completely upon failure with zero partial records.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 4 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 5: Password-Hash Storage
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 5: Password-Hash Storage (bcrypt Work Factor 12, Never Plaintext, Never Exposed)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix5 = generateFixture("hash")
      trackedUserEmails.push(fix5.email)

      const regRes = await registerTestPatient(fix5.payload)
      const dbUser5 = await prisma.user.findUnique({
        where: { id: regRes.user.id },
      })

      if (!dbUser5 || !dbUser5.passwordHash) {
        throw new Error("User or passwordHash missing in PostgreSQL")
      }

      // Verify bcrypt hash structure: starts with $2b$ or $2a$, salt rounds = 12
      if (
        !dbUser5.passwordHash.startsWith("$2b$12$") &&
        !dbUser5.passwordHash.startsWith("$2a$12$")
      ) {
        throw new Error(
          `Password hash does not meet bcrypt work factor 12 standard: ${dbUser5.passwordHash.substring(0, 7)}`,
        )
      }

      // Verify plaintext password is not stored anywhere in DB
      if (dbUser5.passwordHash === fix5.password) {
        throw new Error(
          "SECURITY VIOLATION: Plaintext password stored in database!",
        )
      }

      // Verify bcrypt comparison succeeds with correct password and fails with wrong
      const match = await bcrypt.compare(fix5.password, dbUser5.passwordHash)
      if (!match)
        throw new Error("bcrypt.compare failed on stored password hash")

      const wrongMatch = await bcrypt.compare(
        "WrongPassword123!",
        dbUser5.passwordHash,
      )
      if (wrongMatch)
        throw new Error("bcrypt.compare succeeded on incorrect password!")

      console.log(
        "✔ CHECK 5 PASSED: Password hashed with bcrypt (work factor 12), securely verified, plaintext never stored.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 5 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 6: Successful Login
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 6: Successful Login (Issue HTTP-Only Session & CSRF Cookies, DB Session Record)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    let activeSessionCookie = ""
    let activeCsrfToken = ""
    let loggedInPatientId = ""

    try {
      const fix6 = generateFixture("login")
      trackedUserEmails.push(fix6.email)

      const regRes = await registerTestPatient(fix6.payload)
      loggedInPatientId = regRes.user.id

      const loginRes = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: {
          email: fix6.email,
          password: fix6.password,
        },
      })

      if (loginRes.status !== 200 || loginRes.body.status !== "success") {
        throw new Error(
          `Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`,
        )
      }

      // Verify HTTP-only session cookie and CSRF cookie
      const sessionCookie = loginRes.setCookies[SESSION_COOKIE_NAME]
      const csrfCookie = loginRes.setCookies[CSRF_COOKIE_NAME]

      if (!sessionCookie || !sessionCookie.value) {
        throw new Error("Missing session cookie in login response")
      }
      if (!sessionCookie.flags.includes("HttpOnly")) {
        throw new Error(
          "SECURITY VIOLATION: Session cookie missing HttpOnly flag!",
        )
      }
      if (
        !sessionCookie.flags.some(
          (f) =>
            f.toLowerCase().includes("samesite=strict") ||
            f.toLowerCase().includes("samesite=lax"),
        )
      ) {
        throw new Error(
          "SECURITY VIOLATION: Session cookie missing SameSite attribute!",
        )
      }
      if (!csrfCookie || !csrfCookie.value) {
        throw new Error("Missing CSRF cookie in login response")
      }

      // Verify session stored in PostgreSQL with hashed token
      const rawToken = sessionCookie.value
      const expectedTokenHash = hashSessionToken(rawToken)
      const dbSession = await prisma.session.findUnique({
        where: { tokenHash: expectedTokenHash },
      })

      if (!dbSession)
        throw new Error("Active session not found in PostgreSQL by tokenHash")
      if (dbSession.userId !== loggedInPatientId)
        throw new Error("Session does not belong to logged in patient")
      if (dbSession.revokedAt !== null)
        throw new Error("Newly created session is already revoked")

      activeSessionCookie = `${SESSION_COOKIE_NAME}=${rawToken}`
      activeCsrfToken = csrfCookie.value

      console.log(
        "✔ CHECK 6 PASSED: Login authenticated. Secure HTTP-only session cookie issued and recorded in DB.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 6 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 7: Failed Login & Anti-Enumeration & Rate Limiting
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 7: Failed Login & Rate Limiting (Anti-Enumeration 401 & 429 Protection)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      resetAllRateLimits()
      const fix7 = generateFixture("fail_auth")
      trackedUserEmails.push(fix7.email)
      await registerTestPatient(fix7.payload)

      // 7.1 Wrong password
      const res7_wrongPass = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix7.email, password: "CompletelyWrongPassword123!" },
      })
      if (
        res7_wrongPass.status !== 401 ||
        res7_wrongPass.body.code !== ErrorCode.INVALID_CREDENTIALS
      ) {
        throw new Error(
          `Expected 401 INVALID_CREDENTIALS on wrong password, got ${res7_wrongPass.status}`,
        )
      }

      // 7.2 Unknown email - anti-enumeration check
      const res7_unknownEmail = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: {
          email: `nonexistent.${Date.now()}@example.com`,
          password: "SomePassword123!",
        },
      })
      if (
        res7_unknownEmail.status !== 401 ||
        res7_unknownEmail.body.code !== ErrorCode.INVALID_CREDENTIALS
      ) {
        throw new Error(
          `Expected 401 INVALID_CREDENTIALS on unknown email, got ${res7_unknownEmail.status}`,
        )
      }
      if (res7_wrongPass.body.message !== res7_unknownEmail.body.message) {
        throw new Error(
          "SECURITY VIOLATION: Login failure messages differ between wrong password and unknown email (account enumeration vulnerability)!",
        )
      }

      // 7.3 Rate limiting (5 failed attempts trigger 429)
      let rateLimitTriggered = false
      for (let i = 0; i < 6; i++) {
        const attempt = await request(testPort, {
          path: "/api/auth/login",
          method: "POST",
          body: { email: fix7.email, password: "BadPassword!" },
        })
        if (attempt.status === 429) {
          rateLimitTriggered = true
          if (attempt.body.code !== ErrorCode.RATE_LIMIT_EXCEEDED) {
            throw new Error(
              `Expected code RATE_LIMIT_EXCEEDED, got ${attempt.body.code}`,
            )
          }
          if (!attempt.headers["retry-after"]) {
            throw new Error("Missing Retry-After header on 429 response")
          }
          break
        }
      }

      if (!rateLimitTriggered) {
        throw new Error(
          "Rate limiter failed to trigger after consecutive failed login attempts",
        )
      }

      resetAllRateLimits()
      console.log(
        "✔ CHECK 7 PASSED: Uniform 401 prevents account enumeration; repeated failures trigger HTTP 429 rate limit.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 7 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 8: Session Revocation (Logout & Replay Prevention)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 8: Session Revocation (Logout, DB Invalidation & Replay Defense)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix8 = generateFixture("logout")
      trackedUserEmails.push(fix8.email)
      await registerTestPatient(fix8.payload)

      // Login to get session
      const loginRes = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix8.email, password: fix8.password },
      })

      const sessionToken = loginRes.setCookies[SESSION_COOKIE_NAME]?.value
      const csrfToken = loginRes.setCookies[CSRF_COOKIE_NAME]?.value
      const cookieHeader = `${SESSION_COOKIE_NAME}=${sessionToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`

      // Logout request
      const logoutRes = await request(testPort, {
        path: "/api/auth/logout",
        method: "POST",
        headers: {
          Cookie: cookieHeader,
          "x-csrf-token": csrfToken,
        },
      })

      if (logoutRes.status !== 200) {
        throw new Error(`Logout failed with status ${logoutRes.status}`)
      }

      // Confirm DB session is revoked
      const tokenHash = hashSessionToken(sessionToken)
      const dbSession = await prisma.session.findUnique({
        where: { tokenHash },
      })

      if (!dbSession || !dbSession.revokedAt) {
        throw new Error("Session in DB was not marked as revoked!")
      }

      // Replay attempt using the revoked session token
      const replayRes = await request(testPort, {
        path: "/api/auth/me",
        method: "GET",
        headers: { Cookie: cookieHeader },
      })

      if (
        replayRes.status !== 401 ||
        replayRes.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
      ) {
        throw new Error(
          `Expected 401 on replaying revoked session, got ${replayRes.status}`,
        )
      }

      console.log(
        "✔ CHECK 8 PASSED: Logout revokes DB session token; subsequent replay attempts strictly rejected with HTTP 401.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 8 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 9: Protected-Route Enforcement
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 9: Protected-Route Enforcement (Missing, Forged, and Expired Sessions)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      // 9.1 Missing session
      const res9_missing = await request(testPort, {
        path: "/api/patient/profile",
        method: "GET",
      })
      if (
        res9_missing.status !== 401 ||
        res9_missing.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
      ) {
        throw new Error(
          `Expected 401 on missing session, got ${res9_missing.status}`,
        )
      }

      // 9.2 Forged / non-existent session
      const res9_forged = await request(testPort, {
        path: "/api/patient/profile",
        method: "GET",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=forged_session_token_12345`,
        },
      })
      if (
        res9_forged.status !== 401 ||
        res9_forged.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
      ) {
        throw new Error(
          `Expected 401 on forged session, got ${res9_forged.status}`,
        )
      }

      // 9.3 Expired session
      const expiredRawToken = generateSessionToken()
      const expiredTokenHash = hashSessionToken(expiredRawToken)
      await prisma.session.create({
        data: {
          tokenHash: expiredTokenHash,
          userId: loggedInPatientId,
          expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past
        },
      })

      const res9_expired = await request(testPort, {
        path: "/api/patient/profile",
        method: "GET",
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${expiredRawToken}` },
      })
      if (
        res9_expired.status !== 401 ||
        res9_expired.body.code !== ErrorCode.AUTHENTICATION_REQUIRED
      ) {
        throw new Error(
          `Expected 401 on expired session, got ${res9_expired.status}`,
        )
      }

      console.log(
        "✔ CHECK 9 PASSED: Protected routes strictly reject missing, forged, and expired sessions with HTTP 401.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 9 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 10: Cross-Patient Access Denial (IDOR Defense)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 10: Cross-Patient Access Denial (IDOR Defense on Profile and Documents)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix10_A = generateFixture("idorA")
      const fix10_B = generateFixture("idorB")
      trackedUserEmails.push(fix10_A.email, fix10_B.email)

      const regA = await registerTestPatient(fix10_A.payload)
      const regB = await registerTestPatient(fix10_B.payload)

      // Login as Patient B
      const loginB = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix10_B.email, password: fix10_B.password },
      })
      const sessionB = loginB.setCookies[SESSION_COOKIE_NAME]?.value
      const cookieB = `${SESSION_COOKIE_NAME}=${sessionB}`

      // Patient B attempts to access Patient A's profile via parameterized path
      const idorProfileRes = await request(testPort, {
        path: `/api/patient/${regA.user.id}/profile`,
        method: "GET",
        headers: { Cookie: cookieB },
      })

      if (
        idorProfileRes.status !== 403 ||
        idorProfileRes.body.code !== ErrorCode.FORBIDDEN
      ) {
        throw new Error(
          `Expected HTTP 403 FORBIDDEN on cross-patient profile access, got ${idorProfileRes.status}`,
        )
      }

      // Patient B attempts to access Patient A's category document via parameterized path
      const idorDocRes = await request(testPort, {
        path: `/api/patient/${regA.user.id}/category-document`,
        method: "GET",
        headers: { Cookie: cookieB },
      })

      if (
        idorDocRes.status !== 403 ||
        idorDocRes.body.code !== ErrorCode.FORBIDDEN
      ) {
        throw new Error(
          `Expected HTTP 403 FORBIDDEN on cross-patient document access, got ${idorDocRes.status}`,
        )
      }

      // Patient B accessing `/api/patient/profile` returns Patient B's OWN data, not Patient A
      const ownProfileRes = await request(testPort, {
        path: "/api/patient/profile",
        method: "GET",
        headers: { Cookie: cookieB },
      })
      if (ownProfileRes.body.data.user.id !== regB.user.id) {
        throw new Error(
          "Patient profile did not resolve to authenticated user!",
        )
      }

      console.log(
        "✔ CHECK 10 PASSED: IDOR defense strictly prevents cross-patient access (HTTP 403) and isolates session context.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 10 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 11: Consent Recording & Agreement-Version Audit Trail
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 11: Consent Recording (Completeness, New Versions & Immutable Audit Trail)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix11 = generateFixture("consent")
      trackedUserEmails.push(fix11.email)

      // 11.1 Missing mandatory consent during onboarding
      const missingConsentPayload = {
        ...fix11.payload,
        consents: fix11.allConsents.filter(
          (c) => c.consentType !== ConsentType.AI_LIMITATIONS,
        ),
      }
      const res11_missing = await request(testPort, {
        path: "/api/patients/register",
        method: "POST",
        body: missingConsentPayload,
      })
      if (
        res11_missing.status !== 400 ||
        res11_missing.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR on missing mandatory consent, got ${res11_missing.status}`,
        )
      }

      // Register valid patient
      const reg11 = await registerTestPatient(fix11.payload)

      // Login to record new consent version
      const login11 = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix11.email, password: fix11.password },
      })
      const session11 = login11.setCookies[SESSION_COOKIE_NAME]?.value
      const csrf11 = login11.setCookies[CSRF_COOKIE_NAME]?.value
      const cookie11 = `${SESSION_COOKIE_NAME}=${session11}; ${CSRF_COOKIE_NAME}=${csrf11}`

      // Record TERMS_AND_PRIVACY version 2.0
      const res11_record = await request(testPort, {
        path: "/api/patient/consents",
        method: "POST",
        headers: {
          Cookie: cookie11,
          "x-csrf-token": csrf11,
        },
        body: {
          consentType: ConsentType.TERMS_AND_PRIVACY,
          accepted: true,
          version: "2.0",
        },
      })

      if (
        res11_record.status !== 201 ||
        res11_record.body.status !== "success"
      ) {
        throw new Error(
          `Failed to record new consent version: ${JSON.stringify(res11_record.body)}`,
        )
      }

      // Verify DB contains both v1.0 and v2.0 (audit trail preserved)
      const termsConsents = await prisma.consentRecord.findMany({
        where: {
          userId: reg11.user.id,
          consentType: ConsentType.TERMS_AND_PRIVACY,
        },
        orderBy: { version: "asc" },
      })

      if (termsConsents.length !== 2) {
        throw new Error(
          `Expected 2 TERMS_AND_PRIVACY records (v1.0 and v2.0), got ${termsConsents.length}`,
        )
      }
      if (
        termsConsents[0].version !== "1.0" ||
        termsConsents[1].version !== "2.0"
      ) {
        throw new Error("Consent versioning audit trail corrupted!")
      }

      console.log(
        "✔ CHECK 11 PASSED: Consent completeness enforced; new consent versions recorded without deleting historical records.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 11 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 12: Patient-Category Verification Restrictions
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 12: Patient-Category Verification Restrictions (verificationStatus Stays PENDING)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix12 = generateFixture("cat_sec")
      trackedUserEmails.push(fix12.email)
      const reg12 = await registerTestPatient(fix12.payload)

      const login12 = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix12.email, password: fix12.password },
      })
      const session12 = login12.setCookies[SESSION_COOKIE_NAME]?.value
      const csrf12 = login12.setCookies[CSRF_COOKIE_NAME]?.value
      const cookie12 = `${SESSION_COOKIE_NAME}=${session12}; ${CSRF_COOKIE_NAME}=${csrf12}`

      // Patient attempts to escalate category verificationStatus to APPROVED or VERIFIED
      const res12_escalate = await request(testPort, {
        path: "/api/patient/profile",
        method: "PATCH",
        headers: {
          Cookie: cookie12,
          "x-csrf-token": csrf12,
        },
        body: {
          patientCategory: {
            verificationStatus: "VERIFIED",
            isVerified: true,
          },
        },
      })

      // Zod strict schema must reject unrecognized / forbidden keys
      if (
        res12_escalate.status !== 400 ||
        res12_escalate.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR on trying to modify verificationStatus, got ${res12_escalate.status}`,
        )
      }

      // Valid update to NHIS ID must still preserve PENDING status
      const res12_validUpdate = await request(testPort, {
        path: "/api/patient/profile",
        method: "PATCH",
        headers: {
          Cookie: cookie12,
          "x-csrf-token": csrf12,
        },
        body: {
          patientCategory: {
            nhisId: "GH-NHIS-NEW-UPDATED-ID",
          },
        },
      })

      if (res12_validUpdate.status !== 200) {
        throw new Error(
          `Valid category update failed: ${JSON.stringify(res12_validUpdate.body)}`,
        )
      }

      const dbCategory = await prisma.patientCategoryRecord.findUnique({
        where: { userId: reg12.user.id },
      })

      if (
        !dbCategory ||
        dbCategory.verificationStatus !== CategoryVerificationStatus.PENDING
      ) {
        throw new Error(
          `verificationStatus must remain PENDING, got: ${dbCategory?.verificationStatus}`,
        )
      }

      console.log(
        "✔ CHECK 12 PASSED: Category verification status cannot be client-modified and remains PENDING upon profile updates.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 12 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 13: Health-Profile Verification Restrictions
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 13: Health-Profile Verification Restrictions (clinicallyVerified Stays False)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix13 = generateFixture("hp_sec")
      trackedUserEmails.push(fix13.email)
      const reg13 = await registerTestPatient(fix13.payload)

      const login13 = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix13.email, password: fix13.password },
      })
      const session13 = login13.setCookies[SESSION_COOKIE_NAME]?.value
      const csrf13 = login13.setCookies[CSRF_COOKIE_NAME]?.value
      const cookie13 = `${SESSION_COOKIE_NAME}=${session13}; ${CSRF_COOKIE_NAME}=${csrf13}`

      // Patient attempts to submit clinicallyVerified = true or verifiedAt
      const res13_escalate = await request(testPort, {
        path: "/api/patient/profile",
        method: "PATCH",
        headers: {
          Cookie: cookie13,
          "x-csrf-token": csrf13,
        },
        body: {
          healthProfile: {
            clinicallyVerified: true,
            verifiedAt: new Date().toISOString(),
          },
        },
      })

      if (
        res13_escalate.status !== 400 ||
        res13_escalate.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Expected 400 VALIDATION_ERROR on trying to modify clinicallyVerified, got ${res13_escalate.status}`,
        )
      }

      // Valid update to health fields maintains clinicallyVerified: false
      const res13_valid = await request(testPort, {
        path: "/api/patient/profile",
        method: "PATCH",
        headers: {
          Cookie: cookie13,
          "x-csrf-token": csrf13,
        },
        body: {
          healthProfile: {
            knownAllergies: "Penicillin and cephalosporins",
          },
        },
      })

      if (res13_valid.status !== 200) {
        throw new Error(
          `Valid health profile update failed: ${JSON.stringify(res13_valid.body)}`,
        )
      }

      const dbHp = await prisma.healthProfile.findUnique({
        where: { userId: reg13.user.id },
      })

      if (
        !dbHp ||
        dbHp.clinicallyVerified !== false ||
        dbHp.patientReported !== true
      ) {
        throw new Error(
          "Health profile clinicallyVerified must be false and patientReported must be true",
        )
      }

      console.log(
        "✔ CHECK 13 PASSED: Patient updates to health profile strictly maintain clinicallyVerified = false and patientReported = true.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 13 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 14: Upload Size and Type Restrictions
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 14: Upload Restrictions (Size Limit, Magic-Bytes, Unsupported Types, Traversal)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const fix14 = generateFixture("upload_sec")
      trackedUserEmails.push(fix14.email)
      const reg14 = await registerTestPatient(fix14.payload)

      const login14 = await request(testPort, {
        path: "/api/auth/login",
        method: "POST",
        body: { email: fix14.email, password: fix14.password },
      })
      const session14 = login14.setCookies[SESSION_COOKIE_NAME]?.value
      const csrf14 = login14.setCookies[CSRF_COOKIE_NAME]?.value
      const cookie14 = `${SESSION_COOKIE_NAME}=${session14}; ${CSRF_COOKIE_NAME}=${csrf14}`

      const boundary = "----TestBoundary" + Date.now()

      // 14.1 File larger than 2 MB (> 2 * 1024 * 1024 bytes)
      const oversizedBuffer = Buffer.alloc(2.2 * 1024 * 1024, 0x41)
      const oversizedPayload = buildMultipartFormData(
        boundary,
        "file",
        "giant.jpg",
        "image/jpeg",
        oversizedBuffer,
      )
      const res14_oversized = await request(testPort, {
        path: "/api/patient/profile-photo",
        method: "POST",
        headers: {
          Cookie: cookie14,
          "x-csrf-token": csrf14,
        },
        rawBuffer: oversizedPayload,
        rawContentType: `multipart/form-data; boundary=${boundary}`,
      })
      if (
        res14_oversized.status !== 400 ||
        res14_oversized.body.code !== ErrorCode.FILE_TOO_LARGE
      ) {
        throw new Error(
          `Expected 400 FILE_TOO_LARGE for >2MB file, got ${res14_oversized.status}`,
        )
      }

      // 14.2 Disguised extension (text file disguised as .jpg)
      const fakeJpgBuffer = Buffer.from(
        "Hello world, this is a plain text file disguised as a jpeg.",
      )
      const fakeJpgPayload = buildMultipartFormData(
        boundary,
        "file",
        "avatar.jpg",
        "image/jpeg",
        fakeJpgBuffer,
      )
      const res14_fakeJpg = await request(testPort, {
        path: "/api/patient/profile-photo",
        method: "POST",
        headers: {
          Cookie: cookie14,
          "x-csrf-token": csrf14,
        },
        rawBuffer: fakeJpgPayload,
        rawContentType: `multipart/form-data; boundary=${boundary}`,
      })
      if (
        res14_fakeJpg.status !== 400 ||
        res14_fakeJpg.body.code !== ErrorCode.INVALID_FILE_CONTENT
      ) {
        throw new Error(
          `Expected 400 INVALID_FILE_CONTENT for disguised extension, got ${res14_fakeJpg.status}`,
        )
      }

      // 14.3 Unsupported file type (.svg / executable)
      const svgBuffer = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      )
      const svgPayload = buildMultipartFormData(
        boundary,
        "file",
        "malicious.svg",
        "image/svg+xml",
        svgBuffer,
      )
      const res14_svg = await request(testPort, {
        path: "/api/patient/profile-photo",
        method: "POST",
        headers: {
          Cookie: cookie14,
          "x-csrf-token": csrf14,
        },
        rawBuffer: svgPayload,
        rawContentType: `multipart/form-data; boundary=${boundary}`,
      })
      if (
        res14_svg.status !== 400 ||
        (res14_svg.body.code !== ErrorCode.UNSUPPORTED_FILE_TYPE &&
          res14_svg.body.code !== ErrorCode.INVALID_FILE_CONTENT)
      ) {
        throw new Error(`Expected 400 for SVG upload, got ${res14_svg.status}`)
      }

      // 14.4 Traversal filename safely neutralized
      const validPngMagic = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ])
      const traversalPayload = buildMultipartFormData(
        boundary,
        "file",
        "../../../etc/evil.png",
        "image/png",
        validPngMagic,
      )
      const res14_traversal = await request(testPort, {
        path: "/api/patient/profile-photo",
        method: "POST",
        headers: {
          Cookie: cookie14,
          "x-csrf-token": csrf14,
        },
        rawBuffer: traversalPayload,
        rawContentType: `multipart/form-data; boundary=${boundary}`,
      })

      if (res14_traversal.status !== 200) {
        throw new Error(
          `Valid PNG with traversal filename should succeed under sanitized server name, got ${res14_traversal.status}`,
        )
      }

      // Verify the storageKey is safely in avatars/ and does not contain traversal paths
      const assignedKey = res14_traversal.body.data.storageKey
      if (
        !assignedKey.startsWith("avatars/avatar_") ||
        assignedKey.includes("..")
      ) {
        throw new Error(
          `SECURITY VIOLATION: Path traversal filename not neutralized: ${assignedKey}`,
        )
      }

      trackedFilesToClean.push(path.join(env.UPLOAD_DIR, assignedKey))

      console.log(
        "✔ CHECK 14 PASSED: Upload size limits, magic bytes inspection, SVG rejection, and path traversal defenses verified.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 14 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 15: Consistent Error Responses
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 15: Consistent Error Responses (Machine-Readable Envelope Structure)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      const errorCases = [
        {
          name: "400 Bad Request",
          path: "/api/patient/register",
          method: "POST",
          body: {},
          expectedStatus: 400,
        },
        {
          name: "401 Unauthorized",
          path: "/api/patient/profile",
          method: "GET",
          expectedStatus: 401,
        },
        {
          name: "404 Not Found",
          path: "/api/nonexistent-route-xyz",
          method: "GET",
          expectedStatus: 404,
        },
      ]

      for (const ec of errorCases) {
        const res = await request(testPort, {
          path: ec.path,
          method: ec.method,
          body: ec.body,
        })

        if (res.status !== ec.expectedStatus) {
          throw new Error(
            `Case ${ec.name}: Expected status ${ec.expectedStatus}, got ${res.status}`,
          )
        }
        if (res.body.status !== "error") {
          throw new Error(
            `Case ${ec.name}: Envelope status must be 'error', got '${res.body.status}'`,
          )
        }
        if (!res.body.code || typeof res.body.code !== "string") {
          throw new Error(
            `Case ${ec.name}: Missing or non-string envelope code`,
          )
        }
        if (!res.body.message || typeof res.body.message !== "string") {
          throw new Error(
            `Case ${ec.name}: Missing or non-string envelope message`,
          )
        }
      }

      console.log(
        "✔ CHECK 15 PASSED: Error responses across all failure modes adhere strictly to { status: 'error', code, message } envelope.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 15 FAILED:", err.message)
      failedCount++
      throw err
    }

    // -------------------------------------------------------------------------
    // CHECK 16: Missing Database or Dependency Behavior
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 16: Missing Database or Dependency Behavior (Readiness 503 & Safe Sanitized Envelope)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    try {
      // 16.1 Test readiness probe when database is down / disconnected
      // We create a controlled test app with a failing database health checker
      const failingDbChecker = async () => {
        throw new Error(
          "connection to server at 'localhost:5432' failed: Connection refused",
        )
      }

      const failingHealthRouter = createHealthRouter(failingDbChecker)
      const failingApp = createApp({ healthRouter: failingHealthRouter })
      const failingPort = 5196
      const failingServer = failingApp.listen(failingPort)
      await new Promise((r) => setTimeout(r, 100))

      try {
        const readyRes = await request(failingPort, {
          path: "/api/health/ready",
          method: "GET",
        })

        if (readyRes.status !== 503) {
          throw new Error(
            `Expected HTTP 503 when database is unreachable, got ${readyRes.status}`,
          )
        }
        if (
          readyRes.body.status !== "error" ||
          readyRes.body.database?.status !== "disconnected"
        ) {
          throw new Error(
            "Readiness probe did not report database disconnected",
          )
        }
        if (
          JSON.stringify(readyRes.body).includes("password") ||
          JSON.stringify(readyRes.body).includes("postgresql://")
        ) {
          throw new Error(
            "SECURITY VIOLATION: Database connection string leaked in readiness probe failure response!",
          )
        }

        // 16.2 Combined health probe when database is down
        const healthRes = await request(failingPort, {
          path: "/api/health",
          method: "GET",
        })

        if (healthRes.status !== 503 || healthRes.body.status !== "degraded") {
          throw new Error(
            `Expected HTTP 503 degraded on combined health when database is down, got ${healthRes.status}`,
          )
        }
      } finally {
        await new Promise<void>((resolve) =>
          failingServer.close(() => resolve()),
        )
      }

      console.log(
        "✔ CHECK 16 PASSED: Database failure handled gracefully with HTTP 503 without leaking connection strings or crashing the process.",
      )
      passedCount++
    } catch (err: any) {
      console.error("❌ CHECK 16 FAILED:", err.message)
      failedCount++
      throw err
    }

    console.log(
      "\n================================================================================",
    )
    console.log(
      `STRUCTURED SECURITY REGRESSION SUITE: ALL ${passedCount} / ${totalChecks} CHECKS PASSED WITH 100% SUCCESS!`,
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Teardown: Clean up test users and files
    console.log(
      "\n[Teardown] Cleaning up isolated test users and uploaded files...",
    )
    if (trackedUserEmails.length > 0) {
      const deleted = await prisma.user.deleteMany({
        where: { email: { in: trackedUserEmails } },
      })
      console.log(
        `[Teardown] Removed ${deleted.count} test users (cascade deleted all relations).`,
      )
    }

    for (const file of trackedFilesToClean) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
          console.log(`[Teardown] Cleaned up test file: ${path.basename(file)}`)
        }
      } catch (err: any) {
        console.warn(`[Teardown] Failed to unlink ${file}:`, err.message)
      }
    }

    await new Promise<void>((resolve) => {
      server.close(async () => {
        await prisma.$disconnect()
        resolve()
      })
    })
  }
}

runStructuredSecurityRegressionTests().catch((err) => {
  console.error("\nStructured Security Regression Suite Failed:", err)
  process.exit(1)
})
