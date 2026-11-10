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
import { Sex, PatientCategory } from "./generated/prisma/enums"
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

async function runProviderTests() {
  console.log(
    "================================================================================",
  )
  console.log("HEALTHITUDE: PROVIDER DISCOVERY INTEGRATION & SECURITY TESTS")
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const testServer = http.createServer(app)
  await new Promise<void>((resolve) => testServer.listen(0, resolve))
  const testPort = (testServer.address() as any).port

  let patientId = ""

  try {
    // -------------------------------------------------------------------------
    // Setup: Register Test Patient
    // -------------------------------------------------------------------------
    const pEmail = `prov.test.${Date.now()}@example.com`
    const pPhone = `024${Math.floor(1000000 + Math.random() * 9000000)}`
    const regResult = await registerPatient({
      account: {
        firstName: "Kofi",
        lastName: "ProviderSeeker",
        dateOfBirth: new Date("1992-04-10"),
        sex: Sex.MALE,
        email: pEmail,
        phoneNumber: pPhone,
        password: "ValidSecurePassword123!",
        confirmPassword: "ValidSecurePassword123!",
      },
      contact: {
        street: "88 Ring Road Central",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Abena Seeker",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "0200003344",
        },
      },
      healthProfile: {
        bloodGroup: "B_POSITIVE",
        genotype: "AS",
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
        ],
      },
    })
    patientId = regResult.user.id

    // Create session token and CSRF token for patient
    const token = generateSessionToken()
    const tokenHash = hashSessionToken(token)
    const csrfToken = generateCsrfToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.session.create({
      data: {
        userId: patientId,
        tokenHash,
        expiresAt,
      },
    })

    const authHeaders = {
      Cookie: `${SESSION_COOKIE_NAME}=${token}; ${CSRF_COOKIE_NAME}=${csrfToken}`,
      "X-CSRF-Token": csrfToken,
    }

    console.log(
      `[Setup] Patient created (${patientId}) and authenticated successfully.`,
    )

    // -------------------------------------------------------------------------
    // Check 1: Unauthenticated request to /api/patient/providers is blocked (401)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 1] Verify unauthenticated request to /api/patient/providers returns 401...",
    )
    const unauthRes = await request(testPort, "/api/patient/providers")
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`)
    }
    console.log(
      "✓ Check 1 Passed: Unauthenticated provider query rejected with 401 Unauthorized.",
    )

    // -------------------------------------------------------------------------
    // Check 2: Unauthenticated request to /api/patient/providers/:id is blocked (401)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 2] Verify unauthenticated request to /api/patient/providers/:id returns 401...",
    )
    const unauthIdRes = await request(
      testPort,
      "/api/patient/providers/prov-001",
    )
    if (unauthIdRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unauthIdRes.status}`)
    }
    console.log(
      "✓ Check 2 Passed: Unauthenticated single provider lookup rejected with 401 Unauthorized.",
    )

    // -------------------------------------------------------------------------
    // Check 3: Direct patient provider creation is blocked (403 Forbidden)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 3] Verify direct patient provider creation returns 403 Forbidden...",
    )
    const createRes = await request(
      testPort,
      "/api/patient/providers",
      "POST",
      authHeaders,
      {
        name: "Dr. Fake Doctor",
        specialty: "General Practice",
      },
    )
    if (createRes.status !== 403) {
      throw new Error(
        `Expected 403 Forbidden for patient provider creation, got ${createRes.status}`,
      )
    }
    console.log(
      "✓ Check 3 Passed: Patient provider creation blocked with 403 Forbidden.",
    )

    // -------------------------------------------------------------------------
    // Check 4: Direct patient provider update is blocked (403 Forbidden)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 4] Verify direct patient provider update returns 403 Forbidden...",
    )
    const patchRes = await request(
      testPort,
      "/api/patient/providers/prov-001",
      "PATCH",
      authHeaders,
      {
        fee: "₦1,000",
      },
    )
    if (patchRes.status !== 403) {
      throw new Error(
        `Expected 403 Forbidden for patient provider edit, got ${patchRes.status}`,
      )
    }
    console.log(
      "✓ Check 4 Passed: Patient provider edit blocked with 403 Forbidden.",
    )

    // -------------------------------------------------------------------------
    // Check 5: Direct patient provider deletion is blocked (403 Forbidden)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 5] Verify direct patient provider deletion returns 403 Forbidden...",
    )
    const deleteRes = await request(
      testPort,
      "/api/patient/providers/prov-001",
      "DELETE",
      authHeaders,
    )
    if (deleteRes.status !== 403) {
      throw new Error(
        `Expected 403 Forbidden for patient provider deletion, got ${deleteRes.status}`,
      )
    }
    console.log(
      "✓ Check 5 Passed: Patient provider deletion blocked with 403 Forbidden.",
    )

    // -------------------------------------------------------------------------
    // Check 6: Authenticated retrieval of verified providers (200 OK)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 6] Verify authenticated retrieval of verified providers returns 200 OK...",
    )
    const listRes = await request(
      testPort,
      "/api/patient/providers",
      "GET",
      authHeaders,
    )
    if (listRes.status !== 200 || listRes.body.status !== "ok") {
      throw new Error(
        `Expected 200 OK for provider list, got ${listRes.status}`,
      )
    }
    const { providers, total, specialties } = listRes.body.data
    if (!Array.isArray(providers) || providers.length === 0) {
      throw new Error(
        `Expected non-empty providers array, got: ${JSON.stringify(providers)}`,
      )
    }
    if (total !== providers.length) {
      throw new Error(`Expected total ${providers.length}, got ${total}`)
    }
    if (
      !Array.isArray(specialties) ||
      !specialties.includes("General Practice") ||
      !specialties.includes("Cardiology")
    ) {
      throw new Error(
        `Expected specialties to include General Practice and Cardiology, got: ${JSON.stringify(specialties)}`,
      )
    }
    console.log(
      `✓ Check 6 Passed: Retrieved ${providers.length} verified providers with distinct specialties (${specialties.join(", ")}).`,
    )

    // -------------------------------------------------------------------------
    // Check 7: Search filter by doctor name (case-insensitive substring)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 7] Verify search filter by doctor name (search=boateng)...",
    )
    const searchNameRes = await request(
      testPort,
      "/api/patient/providers?search=boateng",
      "GET",
      authHeaders,
    )
    if (searchNameRes.status !== 200) {
      throw new Error(
        `Expected 200 OK for search=boateng, got ${searchNameRes.status}`,
      )
    }
    const filteredByName = searchNameRes.body.data.providers
    if (
      filteredByName.length === 0 ||
      !filteredByName.every((p: any) =>
        p.name.toLowerCase().includes("boateng"),
      )
    ) {
      throw new Error(
        `Expected all results to contain 'boateng', got: ${JSON.stringify(filteredByName.map((p: any) => p.name))}`,
      )
    }
    console.log(
      `✓ Check 7 Passed: Search for 'boateng' returned ${filteredByName.length} matching doctor(s).`,
    )

    // -------------------------------------------------------------------------
    // Check 8: Search filter by specialty (case-insensitive)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 8] Verify filter by specialty (specialty=Cardiology)...",
    )
    const cardioRes = await request(
      testPort,
      "/api/patient/providers?specialty=Cardiology",
      "GET",
      authHeaders,
    )
    if (cardioRes.status !== 200) {
      throw new Error(
        `Expected 200 OK for specialty=Cardiology, got ${cardioRes.status}`,
      )
    }
    const cardioProviders = cardioRes.body.data.providers
    if (
      cardioProviders.length === 0 ||
      !cardioProviders.every(
        (p: any) => p.specialty.toLowerCase() === "cardiology",
      )
    ) {
      throw new Error(
        `Expected only Cardiology providers, got: ${JSON.stringify(cardioProviders.map((p: any) => p.specialty))}`,
      )
    }
    console.log(
      `✓ Check 8 Passed: Specialty filter returned ${cardioProviders.length} Cardiology provider(s).`,
    )

    // -------------------------------------------------------------------------
    // Check 9: Filter by consultType (e.g. consultType=Video)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 9] Verify filter by consultation type (consultType=Video)...",
    )
    const videoRes = await request(
      testPort,
      "/api/patient/providers?consultType=Video",
      "GET",
      authHeaders,
    )
    if (videoRes.status !== 200) {
      throw new Error(
        `Expected 200 OK for consultType=Video, got ${videoRes.status}`,
      )
    }
    const videoProviders = videoRes.body.data.providers
    if (
      videoProviders.length === 0 ||
      !videoProviders.every((p: any) =>
        p.consultType.toLowerCase().includes("video"),
      )
    ) {
      throw new Error(
        `Expected all providers to offer video, got: ${JSON.stringify(videoProviders.map((p: any) => p.consultType))}`,
      )
    }
    console.log(
      `✓ Check 9 Passed: Consult type filter returned ${videoProviders.length} provider(s) supporting Video.`,
    )

    // -------------------------------------------------------------------------
    // Check 10: Empty search results handled gracefully (200 OK with empty array)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 10] Verify empty search results return 200 OK with []...",
    )
    const emptyRes = await request(
      testPort,
      "/api/patient/providers?search=NonExistentDoctorXyz123",
      "GET",
      authHeaders,
    )
    if (emptyRes.status !== 200 || emptyRes.body.status !== "ok") {
      throw new Error(`Expected 200 OK for empty query, got ${emptyRes.status}`)
    }
    if (
      !Array.isArray(emptyRes.body.data.providers) ||
      emptyRes.body.data.providers.length !== 0 ||
      emptyRes.body.data.total !== 0
    ) {
      throw new Error(
        `Expected empty providers array and total=0, got: ${JSON.stringify(emptyRes.body.data)}`,
      )
    }
    console.log(
      "✓ Check 10 Passed: Empty search results gracefully returned [] with total: 0.",
    )

    // -------------------------------------------------------------------------
    // Check 11: Single provider lookup by ID (200 OK with full profile)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 11] Verify single provider lookup by ID (/api/patient/providers/prov-001)...",
    )
    const singleRes = await request(
      testPort,
      "/api/patient/providers/prov-001",
      "GET",
      authHeaders,
    )
    if (singleRes.status !== 200 || singleRes.body.status !== "ok") {
      throw new Error(
        `Expected 200 OK for single provider lookup, got ${singleRes.status}`,
      )
    }
    const providerData = singleRes.body.data
    if (
      providerData.id !== "prov-001" ||
      providerData.name !== "Dr. Kofi Boateng" ||
      !providerData.qualifications ||
      !providerData.facility ||
      !providerData.availability ||
      !providerData.fee
    ) {
      throw new Error(
        `Provider data missing required attributes: ${JSON.stringify(providerData)}`,
      )
    }
    console.log(
      `✓ Check 11 Passed: Provider profile retrieved (${providerData.name}, ${providerData.qualifications}, ${providerData.facility}, ${providerData.fee}).`,
    )

    // -------------------------------------------------------------------------
    // Check 12: Single provider lookup with non-existent ID returns 404 NOT FOUND
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 12] Verify lookup of non-existent provider ID returns 404 NOT FOUND...",
    )
    const notFoundRes = await request(
      testPort,
      "/api/patient/providers/prov-does-not-exist",
      "GET",
      authHeaders,
    )
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 NOT FOUND, got ${notFoundRes.status}`)
    }
    console.log(
      "✓ Check 12 Passed: Non-existent provider correctly returned 404 NOT FOUND.",
    )

    // -------------------------------------------------------------------------
    // Check 13: Query validation rejects invalid limit or parameters (400 BAD REQUEST)
    // -------------------------------------------------------------------------
    console.log(
      "\n[Check 13] Verify invalid query parameters rejected with 400 BAD REQUEST...",
    )
    const invalidQueryRes = await request(
      testPort,
      "/api/patient/providers?limit=-10",
      "GET",
      authHeaders,
    )
    if (invalidQueryRes.status !== 400) {
      throw new Error(
        `Expected 400 Bad Request for limit=-10, got ${invalidQueryRes.status}`,
      )
    }
    console.log(
      "✓ Check 13 Passed: Invalid query parameter rejected with 400 BAD REQUEST.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 13 PROVIDER DISCOVERY INTEGRATION CHECKS PASSED SUCCESSFULLY (100%)",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Cleanup test patient and sessions
    if (patientId) {
      await prisma.session
        .deleteMany({ where: { userId: patientId } })
        .catch(() => {})
      await prisma.user.delete({ where: { id: patientId } }).catch(() => {})
    }
    await new Promise<void>((resolve) => testServer.close(() => resolve()))
  }
}

runProviderTests().catch((err) => {
  console.error("FATAL: Provider tests failed:", err)
  process.exit(1)
})
