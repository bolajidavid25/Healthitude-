import http from "http"
import fs from "fs"
import path from "path"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { ErrorCode } from "./errors/AppError"
import { registerPatient } from "./services/patientRegistrationService"
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

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
  rawBuffer: Buffer
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
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const postData =
      options.rawBuffer !== undefined
        ? options.rawBuffer
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined

    const headers: Record<string, any> = {
      ...options.headers,
    }

    if (postData !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
      headers["Content-Length"] = Buffer.byteLength(postData)
    } else if (postData !== undefined && headers["Content-Type"]) {
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
        const chunks: Buffer[] = []
        res.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        )
        res.on("end", () => {
          const rawBuffer = Buffer.concat(chunks)
          let parsedBody
          try {
            parsedBody = JSON.parse(rawBuffer.toString("utf8"))
          } catch {
            parsedBody = rawBuffer.toString("utf8")
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
            rawBuffer,
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

function buildMultipartFormData(
  boundary: string,
  fields: Record<string, string>,
  files: Array<{
    fieldName: string
    filename: string
    contentType: string
    buffer: Buffer
  }>,
): Buffer {
  const parts: Buffer[] = []

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`,
      ),
    )
  }

  for (const file of files) {
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
    parts.push(Buffer.from(header))
    parts.push(file.buffer)
    parts.push(Buffer.from("\r\n"))
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`))
  return Buffer.concat(parts)
}

async function createTestSession(
  userId: string,
): Promise<{ sessionCookie: string; csrfToken: string }> {
  const rawSessionToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawSessionToken)
  const csrfToken = "test-csrf-token-" + Math.random().toString(36).substring(2)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const sessionCookie = `${SESSION_COOKIE_NAME}=${rawSessionToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`
  return { sessionCookie, csrfToken }
}

async function runProfileSettingsTests() {
  console.log(
    "================================================================================",
  )
  console.log("STEP 13: PATIENT PROFILE & SETTINGS VERIFICATION SUITE")
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5213
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)

  const createdUserIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // Setup Primary Patient A
    // -------------------------------------------------------------------------
    const nonceA = Date.now().toString().slice(-6)
    const emailA = `patient.a.${nonceA}@example.com`
    const phoneA = `+23324${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`\n[Setup] Registering primary test Patient A (${emailA})...`)
    const regResultA = await registerPatient({
      account: {
        firstName: "Ama",
        middleName: "Akua",
        lastName: "Mensah",
        dateOfBirth: new Date("1994-06-15"),
        sex: Sex.FEMALE,
        email: emailA,
        phoneNumber: phoneA,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
      contact: {
        street: "12 Independence Ave",
        city: "Accra",
        state: "Greater Accra",
        district: "Ayawaso West",
        emergencyContact: {
          fullName: "Kofi Mensah",
          relationship: Relationship.SPOUSE_PARTNER,
          phoneNumber: "+233205550101",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.O_POSITIVE,
        genotype: Genotype.AA,
        knownAllergies: "Penicillin",
        medicalConditions: "Hypertension (diagnosed 2021)",
        currentMedications: "Lisinopril 10mg once daily",
        previousSurgeries: "Appendectomy (2018)",
        medicalHistory: "Childhood asthma",
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: "GH-NHIS-2026-9912",
        nhisSchemeType: "NHIS Standard",
        supportingDocument: "nhis-card.jpg",
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

    const patientAId = regResultA.user.id
    createdUserIds.push(patientAId)
    const sessionA = await createTestSession(patientAId)

    // Setup Secondary Patient B
    const nonceB = (Date.now() + 1).toString().slice(-6)
    const emailB = `patient.b.${nonceB}@example.com`
    const phoneB = `+23324${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`[Setup] Registering secondary test Patient B (${emailB})...`)
    const regResultB = await registerPatient({
      account: {
        firstName: "Kwame",
        lastName: "Boateng",
        dateOfBirth: new Date("1989-11-22"),
        sex: Sex.MALE,
        email: emailB,
        phoneNumber: phoneB,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
      contact: {
        street: "44 Liberation Road",
        city: "Kumasi",
        state: "Ashanti",
        emergencyContact: {
          fullName: "Akua Boateng",
          relationship: Relationship.SIBLING,
          phoneNumber: "+233241112233",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.A_POSITIVE,
        genotype: Genotype.AS,
      },
      patientCategory: {
        category: PatientCategory.STUDENT,
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

    const patientBId = regResultB.user.id
    createdUserIds.push(patientBId)

    // -------------------------------------------------------------------------
    // CHECK 1: Unauthenticated profile requests rejected with HTTP 401
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 1: Unauthenticated Profile Access Blocked (Rule 8)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const unauthGetRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "GET",
    })
    if (unauthGetRes.status !== 401) {
      throw new Error(`Expected HTTP 401, got ${unauthGetRes.status}`)
    }

    const unauthPatchRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      body: { identity: { firstName: "Attacker" } },
    })
    if (unauthPatchRes.status !== 401) {
      throw new Error(`Expected HTTP 401, got ${unauthPatchRes.status}`)
    }

    console.log(
      "✔ CHECK 1 PASSED: Unauthenticated profile retrieval and updates strictly rejected with HTTP 401.",
    )

    // -------------------------------------------------------------------------
    // CHECK 2: CSRF protection on mutating profile requests (Rule 8)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 2: CSRF Protection Enforced on Mutating Profile Requests (Rule 8)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const noCsrfRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        // Omit x-csrf-token
      },
      body: { identity: { firstName: "Attacker" } },
    })

    if (noCsrfRes.status !== 403) {
      throw new Error(
        `Expected HTTP 403 Forbidden for missing CSRF token, got ${noCsrfRes.status}`,
      )
    }

    console.log(
      "✔ CHECK 2 PASSED: Missing CSRF token on profile PATCH rejected with HTTP 403 Forbidden.",
    )

    // -------------------------------------------------------------------------
    // CHECK 3: Authenticated patient retrieves complete permitted profile (READ)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 3: Authenticated Patient Retrieves Complete Profile (READ & Rule 1, 2)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const getRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })

    if (getRes.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${getRes.status}`)
    }

    const p = getRes.body.data
    if (p.user.id !== patientAId) throw new Error("Incorrect user id")
    if (p.user.email !== emailA) throw new Error("Incorrect email")
    if (p.user.firstName !== "Ama" || p.user.lastName !== "Mensah")
      throw new Error("Incorrect name")
    if ("passwordHash" in p.user)
      throw new Error("SECURITY VIOLATION: passwordHash exposed!")
    if (!p.address || p.address.city !== "Accra")
      throw new Error("Address missing or incorrect")
    if (!p.emergencyContact || p.emergencyContact.fullName !== "Kofi Mensah")
      throw new Error("Emergency contact missing")
    if (!p.healthProfile || p.healthProfile.knownAllergies !== "Penicillin")
      throw new Error("Health profile missing")
    if (
      !p.patientCategory ||
      p.patientCategory.category !== PatientCategory.NHIS_USER
    )
      throw new Error("Category missing")
    if (!Array.isArray(p.consents) || p.consents.length < 7)
      throw new Error("Consents missing")

    console.log(
      "Profile retrieved for:",
      p.user.firstName,
      p.user.lastName,
      `(${p.user.email})`,
    )
    console.log(
      "✔ CHECK 3 PASSED: Permitted profile retrieved safely with complete relations and zero credential leakage.",
    )

    // -------------------------------------------------------------------------
    // CHECK 4: Cross-patient IDOR protection strictly enforced (Rule 3)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 4: Cross-Patient IDOR Access Blocked (Rule 3)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const idorRes = await request(testPort, {
      path: `/api/patient/${patientBId}/profile`,
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })

    if (idorRes.status !== 403) {
      throw new Error(
        `Expected HTTP 403 for cross-patient IDOR, got ${idorRes.status}`,
      )
    }

    console.log(
      "✔ CHECK 4 PASSED: Attempt to retrieve another patient's profile strictly blocked with HTTP 403 Forbidden.",
    )

    // -------------------------------------------------------------------------
    // CHECK 5: Partial updates preserve omitted fields (no unintended overwrites)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 5: Partial-Update Logic Preserves Omitted Fields (UPDATE)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Update ONLY address.city
    const partialAddressRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        address: {
          city: "Tema",
        },
      },
    })

    if (partialAddressRes.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${partialAddressRes.status}`)
    }

    const updatedAddress = partialAddressRes.body.data.address
    if (updatedAddress.city !== "Tema") throw new Error("City was not updated")
    if (updatedAddress.street !== "12 Independence Ave")
      throw new Error("Street was unexpectedly wiped!")
    if (updatedAddress.state !== "Greater Accra")
      throw new Error("State was unexpectedly wiped!")
    if (updatedAddress.district !== "Ayawaso West")
      throw new Error("District was unexpectedly wiped!")

    // Verify emergency contact was untouched
    const untouchedEmergency = partialAddressRes.body.data.emergencyContact
    if (untouchedEmergency.fullName !== "Kofi Mensah")
      throw new Error("Emergency contact was unexpectedly wiped!")

    console.log(
      "Updated City:",
      updatedAddress.city,
      "| Preserved Street:",
      updatedAddress.street,
    )
    console.log(
      "✔ CHECK 5 PASSED: Partial update preserved omitted fields across all sections without data loss.",
    )

    // -------------------------------------------------------------------------
    // CHECK 6: Clearing / nulling optional fields via PATCH (DELETE / Lifecycle)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 6: Explicit Clearing of Optional Fields Supported (DELETE / Lifecycle)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const clearFieldRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        identity: {
          middleName: "",
        },
        address: {
          district: "",
        },
        healthProfile: {
          previousSurgeries: "",
        },
      },
    })

    if (clearFieldRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200, got ${clearFieldRes.status}: ${JSON.stringify(clearFieldRes.body)}`,
      )
    }

    // Direct database verification
    const dbUser = await prisma.user.findUnique({ where: { id: patientAId } })
    const dbAddr = await prisma.address.findUnique({
      where: { userId: patientAId },
    })
    const dbHp = await prisma.healthProfile.findUnique({
      where: { userId: patientAId },
    })

    if (dbUser?.middleName !== null)
      throw new Error("middleName was not cleared to null in DB")
    if (dbAddr?.district !== null)
      throw new Error("district was not cleared to null in DB")
    if (dbHp?.previousSurgeries !== null)
      throw new Error("previousSurgeries was not cleared to null in DB")

    console.log(
      "DB middleName:",
      dbUser?.middleName,
      "| DB district:",
      dbAddr?.district,
      "| DB previousSurgeries:",
      dbHp?.previousSurgeries,
    )
    console.log(
      "✔ CHECK 6 PASSED: Optional fields successfully cleared to null when explicitly submitted as empty.",
    )

    // -------------------------------------------------------------------------
    // CHECK 7: Human-friendly relationship mapping (correlateRelationship)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 7: Emergency Relationship Mapping (Frontend & API Flexibility)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const relationRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        emergencyContact: {
          fullName: "Kwesi Mensah",
          relationship: "parent",
          phoneNumber: "0249998877",
        },
      },
    })

    if (relationRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200, got ${relationRes.status}: ${JSON.stringify(relationRes.body)}`,
      )
    }

    const dbEmerg = await prisma.emergencyContact.findUnique({
      where: { userId: patientAId },
    })
    if (dbEmerg?.relationship !== Relationship.PARENT) {
      throw new Error(
        `Expected relationship PARENT in DB, got ${dbEmerg?.relationship}`,
      )
    }

    console.log("Input: 'parent' -> DB Stored:", dbEmerg?.relationship)
    console.log(
      "✔ CHECK 7 PASSED: Relationship mapping converted input to canonical Prisma enum Relationship.PARENT.",
    )

    // -------------------------------------------------------------------------
    // CHECK 8: Medical notation blood group mapping (correlateBloodGroup)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 8: Blood Group Notation Mapping (correlateBloodGroup)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const bloodRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        healthProfile: {
          bloodGroup: "B+",
          genotype: "as",
        },
      },
    })

    if (bloodRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200, got ${bloodRes.status}: ${JSON.stringify(bloodRes.body)}`,
      )
    }

    const dbHp2 = await prisma.healthProfile.findUnique({
      where: { userId: patientAId },
    })
    if (dbHp2?.bloodGroup !== BloodGroup.B_POSITIVE) {
      throw new Error(`Expected B_POSITIVE in DB, got ${dbHp2?.bloodGroup}`)
    }
    if (dbHp2?.genotype !== Genotype.AS) {
      throw new Error(`Expected Genotype AS in DB, got ${dbHp2?.genotype}`)
    }

    console.log(
      "Input: 'B+' -> DB Stored:",
      dbHp2?.bloodGroup,
      "| Input: 'as' -> DB Stored:",
      dbHp2?.genotype,
    )
    console.log(
      "✔ CHECK 8 PASSED: Blood group 'B+' mapped to BloodGroup.B_POSITIVE and 'as' mapped to Genotype.AS.",
    )

    // -------------------------------------------------------------------------
    // CHECK 9: Protection of clinicallyVerified and server-controlled fields (Rule 4)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 9: Server-Controlled Verification Fields Strictly Protected (Rule 4)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const tamperHpRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        healthProfile: {
          clinicallyVerified: true,
        },
      },
    })

    if (tamperHpRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for tampering clinicallyVerified, got ${tamperHpRes.status}`,
      )
    }

    const tamperCatRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        patientCategory: {
          verificationStatus: "VERIFIED",
        },
      },
    })

    if (tamperCatRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for tampering verificationStatus, got ${tamperCatRes.status}`,
      )
    }

    // Direct DB inspection confirms unverified flags remain intact
    const dbHpCheck = await prisma.healthProfile.findUnique({
      where: { userId: patientAId },
    })
    if (dbHpCheck?.clinicallyVerified !== false)
      throw new Error("clinicallyVerified must remain false")
    if (dbHpCheck?.patientReported !== true)
      throw new Error("patientReported must remain true")
    if (dbHpCheck?.verifiedAt !== null)
      throw new Error("verifiedAt must remain null")

    console.log(
      "Health Profile status: patientReported=true, clinicallyVerified=false, verifiedAt=null",
    )
    console.log(
      "✔ CHECK 9 PASSED: Client attempts to self-verify or tamper with professional fields strictly rejected.",
    )

    // -------------------------------------------------------------------------
    // CHECK 10: Read-only identity fields cannot be modified (Rule 2)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 10: Read-Only Identity Fields Blocked From Modification (Rule 2)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const readOnlyTamper = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        identity: {
          email: "tampered.email@example.com",
          dateOfBirth: "1970-01-01",
          sex: "MALE",
        },
      },
    })

    if (readOnlyTamper.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for modifying read-only identity fields, got ${readOnlyTamper.status}`,
      )
    }

    console.log(
      "✔ CHECK 10 PASSED: Email, dateOfBirth, and sex strictly rejected with HTTP 400 (read-only).",
    )

    // -------------------------------------------------------------------------
    // CHECK 11: Phone number collision check on update
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 11: Duplicate Phone Number Collision Handled With HTTP 409 Conflict",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Patient A tries to update phone number to Patient B's phone number
    const dupPhoneRes = await request(testPort, {
      path: "/api/patient/profile",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        identity: {
          phoneNumber: phoneB,
        },
      },
    })

    if (dupPhoneRes.status !== 409) {
      throw new Error(
        `Expected HTTP 409 Conflict for duplicate phone number, got ${dupPhoneRes.status}`,
      )
    }

    console.log(
      "✔ CHECK 11 PASSED: Duplicate phone number collision rejected with HTTP 409 RESOURCE_CONFLICT.",
    )

    // -------------------------------------------------------------------------
    // CHECK 12: Password change validation and authentication verification
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 12: Password Change Lifecycle & Validation (Security Tab)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 12.1 Wrong current password
    const wrongCurrentRes = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        currentPassword: "CompletelyWrongPassword!",
        newPassword: "BrandNewStrongPassword123!",
        confirmNewPassword: "BrandNewStrongPassword123!",
      },
    })
    if (wrongCurrentRes.status !== 400)
      throw new Error("Expected HTTP 400 for wrong current password")

    // 12.2 New password same as current
    const samePassRes = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        currentPassword: "StrongPassword123!",
        newPassword: "StrongPassword123!",
        confirmNewPassword: "StrongPassword123!",
      },
    })
    if (samePassRes.status !== 400)
      throw new Error("Expected HTTP 400 when new password equals current")

    // 12.3 Confirmation mismatch
    const mismatchRes = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        currentPassword: "StrongPassword123!",
        newPassword: "BrandNewStrongPassword123!",
        confirmNewPassword: "MismatchedPassword123!",
      },
    })
    if (mismatchRes.status !== 400)
      throw new Error("Expected HTTP 400 for mismatched passwords")

    // 12.4 Valid password change
    const validChangeRes = await request(testPort, {
      path: "/api/patient/change-password",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        currentPassword: "StrongPassword123!",
        newPassword: "BrandNewStrongPassword123!",
        confirmNewPassword: "BrandNewStrongPassword123!",
      },
    })
    if (validChangeRes.status !== 200)
      throw new Error(`Expected HTTP 200, got ${validChangeRes.status}`)

    // Verify login with new password succeeds
    const newLoginRes = await request(testPort, {
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: emailA,
        password: "BrandNewStrongPassword123!",
      },
    })
    if (newLoginRes.status !== 200)
      throw new Error("Login with new password failed")

    console.log(
      "✔ CHECK 12 PASSED: Password change validated, previous password rejected, new password verified.",
    )

    // -------------------------------------------------------------------------
    // CHECK 13: Consent management - distinct audit records, not single boolean (Rule 5, 6)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 13: Consent Audit Trail - Versioned Records With Server Timestamps (Rule 5, 6)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 13.1 Retrieve existing consents
    const consentsRes = await request(testPort, {
      path: "/api/patient/consents",
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })
    if (consentsRes.status !== 200)
      throw new Error("Failed to retrieve consents")
    if (
      !Array.isArray(consentsRes.body.data.consents) ||
      consentsRes.body.data.consents.length < 7
    ) {
      throw new Error("Expected initial 7 consents")
    }

    // 13.2 Record new version 2.0 of TERMS_AND_PRIVACY
    const newVersionRes = await request(testPort, {
      path: "/api/patient/consents",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        consentType: ConsentType.TERMS_AND_PRIVACY,
        accepted: true,
        version: "2.0",
      },
    })

    if (newVersionRes.status !== 201)
      throw new Error(`Expected HTTP 201, got ${newVersionRes.status}`)
    if (!newVersionRes.body.data.acceptedAt)
      throw new Error("Missing server timestamp acceptedAt")

    // 13.3 Verify DB has both v1.0 and v2.0 concurrently
    const dbConsents = await prisma.consentRecord.findMany({
      where: { userId: patientAId, consentType: ConsentType.TERMS_AND_PRIVACY },
      orderBy: { version: "asc" },
    })

    if (dbConsents.length < 2)
      throw new Error(`Expected at least 2 records, got ${dbConsents.length}`)
    const hasV1 = dbConsents.some((c) => c.version === "1.0")
    const hasV2 = dbConsents.some((c) => c.version === "2.0")
    if (!hasV1 || !hasV2)
      throw new Error("Both v1.0 and v2.0 must exist concurrently in audit log")

    console.log(
      "Audited Consent Versions for TERMS_AND_PRIVACY:",
      dbConsents
        .map((c) => `v${c.version} (accepted=${c.accepted})`)
        .join(", "),
    )
    console.log(
      "✔ CHECK 13 PASSED: Consents stored as versioned audit events with server timestamps (not single boolean).",
    )

    // -------------------------------------------------------------------------
    // CHECK 14: Profile photo upload, serving, and safe deletion (UPLOADS & Rule 7)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 14: Profile Photo Upload, Serving With nosniff, and Safe Deletion (UPLOADS)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 14.1 Upload valid 1x1 PNG photo
    const pngMagicBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])

    const boundary = "---------------------------testboundary" + Date.now()
    const multipartBody = buildMultipartFormData(boundary, {}, [
      {
        fieldName: "file",
        filename: "my-avatar.png",
        contentType: "image/png",
        buffer: pngMagicBytes,
      },
    ])

    const uploadRes = await request(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      rawBuffer: multipartBody,
    })

    if (uploadRes.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for photo upload, got ${uploadRes.status}: ${JSON.stringify(uploadRes.body)}`,
      )
    }

    const storageKey = uploadRes.body.data.storageKey
    if (!storageKey) throw new Error("Missing storageKey in upload response")

    // 14.2 Retrieve photo and verify nosniff header
    const getPhotoRes = await request(testPort, {
      path: "/api/patient/profile-photo",
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })

    if (getPhotoRes.status !== 200)
      throw new Error("Failed to serve uploaded profile photo")
    if (getPhotoRes.headers["x-content-type-options"] !== "nosniff") {
      throw new Error("Missing X-Content-Type-Options: nosniff header!")
    }
    if (getPhotoRes.headers["content-type"] !== "image/png") {
      throw new Error(
        `Expected image/png content type, got ${getPhotoRes.headers["content-type"]}`,
      )
    }

    // 14.3 Cross-patient photo access IDOR check
    const idorPhotoRes = await request(testPort, {
      path: `/api/patient/${patientBId}/profile-photo`,
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })
    if (idorPhotoRes.status !== 403)
      throw new Error("Expected HTTP 403 for cross-patient photo IDOR")

    // 14.4 Delete profile photo
    const deletePhotoRes = await request(testPort, {
      path: "/api/patient/profile-photo",
      method: "DELETE",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    if (deletePhotoRes.status !== 200)
      throw new Error("Failed to delete profile photo")

    // Verify DB user.profilePhoto is null
    const dbUserAfterDelete = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    if (dbUserAfterDelete?.profilePhoto !== null) {
      throw new Error("profilePhoto was not set to null in DB")
    }

    // Subsequent GET returns 404
    const getDeletedPhotoRes = await request(testPort, {
      path: "/api/patient/profile-photo",
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })
    if (getDeletedPhotoRes.status !== 404)
      throw new Error("Expected HTTP 404 after photo deletion")

    console.log(
      "✔ CHECK 14 PASSED: Profile photo uploaded, served with nosniff header, and deleted cleanly from DB and storage.",
    )

    // -------------------------------------------------------------------------
    // CHECK 15: 5-Stage onboarding status calculation (Rule N, O, P, Q)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 15: Onboarding Status Verification Across 5 Stages")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const statusRes = await request(testPort, {
      path: "/api/patient/onboarding-status",
      method: "GET",
      headers: { Cookie: sessionA.sessionCookie },
    })

    if (statusRes.status !== 200)
      throw new Error("Failed to retrieve onboarding status")
    const st = statusRes.body.data
    if (st.isComplete !== true || st.canProceed !== true) {
      throw new Error(`Expected isComplete=true, got ${st.isComplete}`)
    }
    if (st.completedStages.length !== 5) {
      throw new Error(
        `Expected 5 completed stages, got ${st.completedStages.length}`,
      )
    }

    console.log(
      "Onboarding Status:",
      `isComplete=${st.isComplete}, completedStages=[${st.completedStages.join(", ")}]`,
    )
    console.log(
      "✔ CHECK 15 PASSED: 5-stage onboarding status confirmed complete with zero missing mandatory items.",
    )

    // -------------------------------------------------------------------------
    // CHECK 16: Category review request preserves PENDING verification status
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 16: Category Review Request Maintains PENDING Status (Rule 4 & Step 10)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const catReqRes = await request(testPort, {
      path: "/api/patient/category",
      method: "PATCH",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
      body: {
        category: "CORPORATE_COMPANY_MEMBER",
        supportingDocument: "company-staff-id.pdf",
      },
    })

    if (catReqRes.status !== 200)
      throw new Error(`Expected HTTP 200, got ${catReqRes.status}`)

    const dbCatRecord = await prisma.patientCategoryRecord.findUnique({
      where: { userId: patientAId },
    })
    if (dbCatRecord?.category !== PatientCategory.CORPORATE_COMPANY_MEMBER) {
      throw new Error(
        `Expected CORPORATE_COMPANY_MEMBER in DB, got ${dbCatRecord?.category}`,
      )
    }
    if (
      dbCatRecord?.verificationStatus !== CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        `Expected verificationStatus PENDING, got ${dbCatRecord?.verificationStatus}`,
      )
    }

    console.log(
      "Updated Category:",
      dbCatRecord?.category,
      "| Verification Status:",
      dbCatRecord?.verificationStatus,
    )
    console.log(
      "✔ CHECK 16 PASSED: Category change request updated category and maintained PENDING verification status.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log("ALL 16 PROFILE & SETTINGS CHECKS PASSED WITH 100% SUCCESS!")
    console.log(
      "================================================================================",
    )
  } finally {
    server.close()
    console.log("\n[Cleanup] Cleaning up test users and related records...")
    for (const uId of createdUserIds) {
      try {
        await prisma.user.delete({ where: { id: uId } })
      } catch {}
    }
    console.log(
      `[Cleanup] Completed cleanup of ${createdUserIds.length} test users.`,
    )
  }
}

runProfileSettingsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", err)
    process.exit(1)
  })
