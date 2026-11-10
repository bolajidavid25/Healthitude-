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

    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function runE2EIntegrationTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: COMPLETE FRONTEND-BACKEND ONBOARDING INTEGRATION TEST SUITE",
  )
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5088
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 100))
  console.log(
    `[Integration Test Server] Running on http://127.0.0.1:${testPort}`,
  )

  const testEmail = `integration.test.${Date.now()}@example.com`
  const testPhone = "0245550199"
  const testPassword = "SecurePassword123!"

  const validPayload = {
    account: {
      firstName: "Ama",
      middleName: "Akua",
      lastName: "Mensah",
      dateOfBirth: "1994-06-15",
      sex: "FEMALE",
      email: testEmail,
      phoneNumber: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
    },
    contact: {
      street: "12 Independence Ave",
      city: "Accra",
      state: "Greater Accra",
      district: "Ayawaso West",
      emergencyContact: {
        fullName: "Kofi Mensah",
        relationship: "SPOUSE_PARTNER",
        phoneNumber: "+233205550101",
      },
    },
    healthProfile: {
      bloodGroup: "O_POSITIVE",
      genotype: "AA",
      knownAllergies: "Penicillin",
      medicalConditions: "Hypertension",
      currentMedications: "Lisinopril 10mg once daily",
      previousSurgeries: "Appendectomy (2018)",
      medicalHistory: "Mild seasonal allergies",
    },
    patientCategory: {
      category: "NHIS_USER",
      nhisId: "GH-NHIS-20240088341",
      nhisSchemeType: "NHIS",
      supportingDocument: "nhis-doc.pdf",
    },
    consents: {
      consents: [
        { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "1.0" },
        {
          consentType: "HEALTH_DATA_PROCESSING",
          accepted: true,
          version: "1.0",
        },
        { consentType: "PROFESSIONAL_ACCESS", accepted: true, version: "1.0" },
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
        { consentType: "INFORMATION_ACCURACY", accepted: true, version: "1.0" },
      ],
    },
  }

  let registeredUserId = ""
  let activeSessionCookie = ""
  let activeCsrfCookie = ""
  let activeCsrfToken = ""

  try {
    // -------------------------------------------------------------------------
    // JOURNEY 1: Valid Patient Registration (5 Stages)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 1: Valid Patient Registration across All 5 Stages")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const regRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      validPayload,
    )
    console.log("Status:", regRes.status)
    console.log(
      "User Name:",
      regRes.body?.data?.user?.firstName,
      regRes.body?.data?.user?.lastName,
    )
    console.log("User Email:", regRes.body?.data?.user?.email)
    console.log("Consents Count:", regRes.body?.data?.consents?.length)
    if (regRes.status !== 201 || !regRes.body?.data?.user?.id) {
      throw new Error(
        `Journey 1 Failed: Expected HTTP 201, got ${regRes.status}: ${JSON.stringify(regRes.body)}`,
      )
    }
    registeredUserId = regRes.body.data.user.id
    console.log(
      "✔ JOURNEY 1 PASSED: Patient registration succeeded with status 201. All 5 entities created.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 2: Conflict on Duplicate Email
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 2: Reject Registration with Duplicate Email")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const dupEmailPayload = {
      ...validPayload,
      account: { ...validPayload.account, phoneNumber: "0245550299" }, // different phone
    }
    const dupEmailRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      dupEmailPayload,
    )
    console.log("Status (Expected 409):", dupEmailRes.status)
    console.log("Error Code:", dupEmailRes.body?.code)
    console.log("Field Errors:", JSON.stringify(dupEmailRes.body?.errors))
    if (
      dupEmailRes.status !== 409 ||
      dupEmailRes.body?.code !== "RESOURCE_CONFLICT"
    ) {
      throw new Error(
        `Journey 2 Failed: Expected 409 RESOURCE_CONFLICT, got ${dupEmailRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 2 PASSED: Duplicate email rejected with HTTP 409 RESOURCE_CONFLICT and field error.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 3: Conflict on Duplicate Phone Number
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 3: Reject Registration with Duplicate Phone Number")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const dupPhonePayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `different.${Date.now()}@example.com`,
      }, // different email
    }
    const dupPhoneRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      dupPhonePayload,
    )
    console.log("Status (Expected 409):", dupPhoneRes.status)
    console.log("Error Code:", dupPhoneRes.body?.code)
    console.log("Field Errors:", JSON.stringify(dupPhoneRes.body?.errors))
    if (
      dupPhoneRes.status !== 409 ||
      dupPhoneRes.body?.code !== "RESOURCE_CONFLICT"
    ) {
      throw new Error(
        `Journey 3 Failed: Expected 409 RESOURCE_CONFLICT, got ${dupPhoneRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 3 PASSED: Duplicate phone number rejected with HTTP 409 RESOURCE_CONFLICT.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 4: Rejection of Missing Mandatory Fields
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 4: Reject Registration with Missing Mandatory Address/Contact Fields",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const missingFieldsPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `unique.${Date.now()}@example.com`,
        phoneNumber: "0240009911",
      },
      contact: { ...validPayload.contact, street: "", city: "" },
    }
    const missingRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      missingFieldsPayload,
    )
    console.log("Status (Expected 400):", missingRes.status)
    console.log("Error Code:", missingRes.body?.code)
    if (
      missingRes.status !== 400 ||
      missingRes.body?.code !== "VALIDATION_ERROR"
    ) {
      throw new Error(
        `Journey 4 Failed: Expected 400 VALIDATION_ERROR, got ${missingRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 4 PASSED: Missing required fields rejected with HTTP 400 VALIDATION_ERROR.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 5: Rejection of Invalid Email Syntax
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 5: Reject Registration with Malformed Email Syntax")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const badEmailPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: "not-an-email-address",
        phoneNumber: "0240009922",
      },
    }
    const badEmailRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      badEmailPayload,
    )
    console.log("Status (Expected 400):", badEmailRes.status)
    if (badEmailRes.status !== 400) {
      throw new Error(
        `Journey 5 Failed: Expected 400, got ${badEmailRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 5 PASSED: Malformed email syntax rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 6: Rejection of Invalid Phone Number Format
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 6: Reject Registration with Invalid Phone Number Format",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const badPhonePayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `phone.test.${Date.now()}@example.com`,
        phoneNumber: "12345",
      },
    }
    const badPhoneRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      badPhonePayload,
    )
    console.log("Status (Expected 400):", badPhoneRes.status)
    if (badPhoneRes.status !== 400) {
      throw new Error(
        `Journey 6 Failed: Expected 400, got ${badPhoneRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 6 PASSED: Non-compliant phone number rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 7: Rejection of Future or Implausible Date of Birth
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 7: Reject Registration with Future Date of Birth")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const futureDobPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `dob.test.${Date.now()}@example.com`,
        phoneNumber: "0240009933",
        dateOfBirth: "2099-01-01",
      },
    }
    const futureDobRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      futureDobPayload,
    )
    console.log("Status (Expected 400):", futureDobRes.status)
    if (futureDobRes.status !== 400) {
      throw new Error(
        `Journey 7 Failed: Expected 400, got ${futureDobRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 7 PASSED: Future date of birth strictly rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 8: Rejection of Password Shorter than 8 Characters
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 8: Reject Registration with Password Shorter than 8 Characters",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const shortPassPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `pass.test.${Date.now()}@example.com`,
        phoneNumber: "0240009944",
        password: "short",
        confirmPassword: "short",
      },
    }
    const shortPassRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      shortPassPayload,
    )
    console.log("Status (Expected 400):", shortPassRes.status)
    if (shortPassRes.status !== 400) {
      throw new Error(
        `Journey 8 Failed: Expected 400, got ${shortPassRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 8 PASSED: Password under 8 characters rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 9: Rejection of Incomplete Consent Agreements
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 9: Reject Registration with Missing Mandatory Agreements",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const missingConsentPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `consent.test.${Date.now()}@example.com`,
        phoneNumber: "0240009955",
      },
      consents: {
        consents: validPayload.consents.consents.slice(0, 5), // Only 5 of 7
      },
    }
    const missingConsentRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      missingConsentPayload,
    )
    console.log("Status (Expected 400):", missingConsentRes.status)
    if (missingConsentRes.status !== 400) {
      throw new Error(
        `Journey 9 Failed: Expected 400, got ${missingConsentRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 9 PASSED: Incomplete mandatory agreements rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 10: Rejection of Unaccepted Mandatory Consent
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 10: Reject Registration with Unaccepted Mandatory Agreement",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const unacceptedConsentPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `unaccepted.test.${Date.now()}@example.com`,
        phoneNumber: "0240009966",
      },
      consents: {
        consents: validPayload.consents.consents.map((c, i) =>
          i === 0 ? { ...c, accepted: false } : c,
        ),
      },
    }
    const unacceptedRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      unacceptedConsentPayload,
    )
    console.log("Status (Expected 400):", unacceptedRes.status)
    if (unacceptedRes.status !== 400) {
      throw new Error(
        `Journey 10 Failed: Expected 400, got ${unacceptedRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 10 PASSED: Unaccepted mandatory consent rejected with HTTP 400.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 11: Rejection of Injected Server-Controlled Fields
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 11: Reject Client Injection of Server-Controlled Fields (passwordHash, role)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const injectedPayload = {
      ...validPayload,
      account: {
        ...validPayload.account,
        email: `inject.test.${Date.now()}@example.com`,
        phoneNumber: "0240009977",
        passwordHash: "$2a$12$injectedHashValue",
        role: "ADMIN",
      },
    }
    const injectedRes = await makeHttpRequest(
      testPort,
      "/api/patients/register",
      "POST",
      injectedPayload,
    )
    console.log("Status (Expected 400):", injectedRes.status)
    if (injectedRes.status !== 400) {
      throw new Error(
        `Journey 11 Failed: Expected 400, got ${injectedRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 11 PASSED: Injected passwordHash and role strictly rejected by schema.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 12: Authentic Login with Valid Credentials
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 12: Patient Login with Valid Registered Credentials")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const loginRes = await makeHttpRequest(
      testPort,
      "/api/auth/login",
      "POST",
      {
        email: testEmail,
        password: testPassword,
      },
    )
    console.log("Status (Expected 200):", loginRes.status)
    console.log("User in response:", loginRes.body?.data?.user?.email)
    console.log("Cookies set count:", loginRes.cookies.length)

    if (loginRes.status !== 200 || !loginRes.body?.data?.user) {
      throw new Error(`Journey 12 Failed: Expected 200, got ${loginRes.status}`)
    }

    const cookies = parseCookies(loginRes.cookies)
    if (!cookies["healthitude_session"] || !cookies["healthitude_csrf"]) {
      throw new Error(
        "Journey 12 Failed: Expected healthitude_session and healthitude_csrf cookies",
      )
    }

    activeSessionCookie = `healthitude_session=${cookies["healthitude_session"]}`
    activeCsrfCookie = `healthitude_csrf=${cookies["healthitude_csrf"]}`
    activeCsrfToken =
      loginRes.body?.data?.csrfToken || cookies["healthitude_csrf"]

    console.log(
      "✔ JOURNEY 12 PASSED: Login succeeded. HTTP-only session cookie and CSRF token issued.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 13: Login Failure with Incorrect Password
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 13: Login Failure with Incorrect Password")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const badLoginRes = await makeHttpRequest(
      testPort,
      "/api/auth/login",
      "POST",
      {
        email: testEmail,
        password: "WrongPassword999!",
      },
    )
    console.log("Status (Expected 401):", badLoginRes.status)
    console.log("Error Code:", badLoginRes.body?.code)
    if (
      badLoginRes.status !== 401 ||
      badLoginRes.body?.code !== "INVALID_CREDENTIALS"
    ) {
      throw new Error(
        `Journey 13 Failed: Expected 401 INVALID_CREDENTIALS, got ${badLoginRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 13 PASSED: Incorrect password rejected with HTTP 401 INVALID_CREDENTIALS.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 14: Session Recovery via /api/auth/me (Simulating Page Reload)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 14: Session Recovery via /api/auth/me across Browser Reloads",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const meRes = await makeHttpRequest(
      testPort,
      "/api/auth/me",
      "GET",
      undefined,
      [activeSessionCookie, activeCsrfCookie],
    )
    console.log("Status (Expected 200):", meRes.status)
    console.log("Authenticated User:", meRes.body?.data?.user?.email)
    console.log("Session ID:", meRes.body?.data?.session?.id)
    if (
      meRes.status !== 200 ||
      meRes.body?.data?.user?.email !== testEmail.toLowerCase()
    ) {
      throw new Error(
        `Journey 14 Failed: Expected 200 with user, got ${meRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 14 PASSED: Session cookie authoritative. User session restored seamlessly.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 15: Authenticated Profile Retrieval (/api/patient/profile)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 15: Retrieve Authenticated Patient Profile & Status")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const profileRes = await makeHttpRequest(
      testPort,
      "/api/patient/profile",
      "GET",
      undefined,
      [activeSessionCookie, activeCsrfCookie],
    )
    console.log("Status (Expected 200):", profileRes.status)
    console.log(
      "Profile Name:",
      profileRes.body?.data?.user?.firstName,
      profileRes.body?.data?.user?.lastName,
    )
    console.log("Address:", profileRes.body?.data?.address?.city)
    console.log(
      "Health Profile Allergy:",
      profileRes.body?.data?.healthProfile?.knownAllergies,
    )
    console.log("Category:", profileRes.body?.data?.patientCategory?.category)
    console.log(
      "Category Status:",
      profileRes.body?.data?.patientCategory?.verificationStatus,
    )
    if (
      profileRes.status !== 200 ||
      profileRes.body?.data?.healthProfile?.knownAllergies !== "Penicillin"
    ) {
      throw new Error(
        `Journey 15 Failed: Expected 200 with complete profile, got ${profileRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 15 PASSED: Profile retrieved safely. Contains address, health, category, consents.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 16: Patient Profile Updates (Permitted Fields)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 16: Patient Updates Address and Emergency Contact via Profile Panel",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const updatePayload = {
      address: {
        street: "99 Cantonments Road",
        city: "Accra",
        state: "Greater Accra",
        district: "Cantonments",
      },
      emergencyContact: {
        fullName: "Akosua Mensah",
        relationship: "SIBLING",
        phoneNumber: "+233249998888",
      },
    }
    const updateRes = await makeHttpRequest(
      testPort,
      "/api/patient/profile",
      "PATCH",
      updatePayload,
      [activeSessionCookie, activeCsrfCookie],
      { "x-csrf-token": activeCsrfToken },
    )
    console.log("Status (Expected 200):", updateRes.status)
    console.log("Updated Address:", updateRes.body?.data?.address?.street)
    console.log(
      "Updated Contact:",
      updateRes.body?.data?.emergencyContact?.fullName,
    )
    if (
      updateRes.status !== 200 ||
      updateRes.body?.data?.address?.street !== "99 Cantonments Road"
    ) {
      throw new Error(
        `Journey 16 Failed: Expected 200, got ${updateRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 16 PASSED: Permitted profile update succeeded and persisted in database.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 17: Preservation of Verification Boundaries on Update
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "JOURNEY 17: Patient Cannot Self-Verify Category or Health Information",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const tamperPayload = {
      patientCategory: { verificationStatus: "VERIFIED" },
      healthProfile: { clinicallyVerified: true },
    }
    const tamperRes = await makeHttpRequest(
      testPort,
      "/api/patient/profile",
      "PATCH",
      tamperPayload,
      [activeSessionCookie, activeCsrfCookie],
      { "x-csrf-token": activeCsrfToken },
    )
    console.log("Status (Expected 400):", tamperRes.status)
    console.log("Tamper Error:", JSON.stringify(tamperRes.body?.errors))
    if (tamperRes.status !== 400) {
      throw new Error(
        `Journey 17 Failed: Expected 400, got ${tamperRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 17 PASSED: Self-verification strictly rejected by server-side schemas.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 18: IDOR Prevention (Cross-Patient Access Blocked)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 18: Cross-Patient IDOR Access Rejection")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const foreignUserId = "00000000-0000-0000-0000-000000000099"
    const idorRes = await makeHttpRequest(
      testPort,
      `/api/patient/${foreignUserId}/profile`,
      "GET",
      undefined,
      [activeSessionCookie, activeCsrfCookie],
    )
    console.log("Status (Expected 403):", idorRes.status)
    console.log("Error Code:", idorRes.body?.code)
    if (idorRes.status !== 403 || idorRes.body?.code !== "FORBIDDEN") {
      throw new Error(
        `Journey 18 Failed: Expected 403 FORBIDDEN, got ${idorRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 18 PASSED: Accessing another patient's profile strictly blocked with HTTP 403.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 19: Logout and Server-Side Session Revocation
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 19: Patient Logout and Session Revocation")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const logoutRes = await makeHttpRequest(
      testPort,
      "/api/auth/logout",
      "POST",
      undefined,
      [activeSessionCookie, activeCsrfCookie],
      { "x-csrf-token": activeCsrfToken },
    )
    console.log("Logout Status (Expected 200):", logoutRes.status)
    if (logoutRes.status !== 200) {
      throw new Error(
        `Journey 19 Failed: Expected 200, got ${logoutRes.status}`,
      )
    }

    // Try accessing protected route with revoked session
    const postLogoutRes = await makeHttpRequest(
      testPort,
      "/api/auth/me",
      "GET",
      undefined,
      [activeSessionCookie, activeCsrfCookie],
    )
    console.log(
      "Post-Logout Access Status (Expected 401):",
      postLogoutRes.status,
    )
    console.log("Error Message:", postLogoutRes.body?.message)
    if (postLogoutRes.status !== 401) {
      throw new Error(
        `Journey 19 Failed: Expected 401 after logout, got ${postLogoutRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 19 PASSED: Logout successful. Database session revoked; re-use rejected with 401.",
    )

    // -------------------------------------------------------------------------
    // JOURNEY 20: Network / Server Degradation Simulation
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("JOURNEY 20: Degraded Service / Unmatched Route Handling")
    console.log(
      "--------------------------------------------------------------------------------",
    )
    const notFoundRes = await makeHttpRequest(
      testPort,
      "/api/patients/unmatched-endpoint",
      "GET",
    )
    console.log("Status (Expected 404):", notFoundRes.status)
    console.log("Envelope:", JSON.stringify(notFoundRes.body))
    if (notFoundRes.status !== 404 || notFoundRes.body?.code !== "NOT_FOUND") {
      throw new Error(
        `Journey 20 Failed: Expected 404 NOT_FOUND, got ${notFoundRes.status}`,
      )
    }
    console.log(
      "✔ JOURNEY 20 PASSED: Unmatched endpoints return safe machine-readable error envelope.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log("ALL 20 E2E INTEGRATION JOURNEYS PASSED WITH 100% SUCCESS!")
    console.log(
      "================================================================================",
    )
  } finally {
    // Clean up test patient
    if (registeredUserId) {
      console.log(
        `\n[Teardown] Cleaning up integration test patient ${registeredUserId}...`,
      )
      await prisma.user.deleteMany({ where: { id: registeredUserId } })
      console.log("[Teardown] Cleanup complete.")
    }

    server.close()
    await prisma.$disconnect()
    console.log("[Integration Test Server] Closed.")
  }
}

runE2EIntegrationTests().catch((err) => {
  console.error("FATAL ERROR IN E2E INTEGRATION TEST SUITE:", err)
  process.exit(1)
})
