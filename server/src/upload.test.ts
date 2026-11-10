import http from "http"
import fs from "fs"
import path from "path"
import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { env } from "./config/env"
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
import { uploadPatientProfilePhoto } from "./services/patientUploadService"
import { getFilePath } from "./services/storageService"

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
  rawBuffer: Buffer
}

/**
 * Builds a multipart/form-data payload Buffer with standard RFC boundaries.
 */
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

async function multipartRequest(
  port: number,
  options: {
    path: string
    method: string
    headers?: Record<string, string>
    boundary: string
    bodyBuffer: Buffer
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, any> = {
      ...options.headers,
      "Content-Type": `multipart/form-data; boundary=${options.boundary}`,
      "Content-Length": options.bodyBuffer.length,
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

          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
            rawBuffer,
          })
        })
      },
    )

    req.on("error", reject)
    req.write(options.bodyBuffer)
    req.end()
  })
}

async function simpleRequest(
  port: number,
  options: {
    path: string
    method: string
    headers?: Record<string, string>
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: options.path,
        method: options.method,
        headers: options.headers,
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

          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
            rawBuffer,
          })
        })
      },
    )

    req.on("error", reject)
    req.end()
  })
}

async function createTestSession(
  userId: string,
): Promise<{ sessionCookie: string; csrfToken: string }> {
  const rawSessionToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawSessionToken)
  const csrfToken = "test-csrf-" + Math.random().toString(36).substring(2)

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

// Minimal binary fixtures with genuine magic bytes
const VALID_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff,
  0xd9,
])

const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
])

const VALID_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
)

async function runUploadTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: SECURE PATIENT UPLOADS & STORAGE CONTROL TEST SUITE",
  )
  console.log(
    "================================================================================",
  )

  const testApp = createApp()
  const testPort = 5197
  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  console.log(`[Test Server] Running on http://127.0.0.1:${testPort}`)
  const createdUserIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // Setup: Create Patient A and Patient B
    // -------------------------------------------------------------------------
    const nonceA = Date.now().toString().slice(-6)
    const emailA = `patient.upload.a.${nonceA}@example.com`
    const phoneA = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`\n[Setup] Registering primary Patient A (${emailA})...`)
    const regResultA = await registerPatient({
      account: {
        firstName: "Ama",
        lastName: "Mensah",
        dateOfBirth: new Date("1993-04-10"),
        sex: Sex.FEMALE,
        email: emailA,
        phoneNumber: phoneA,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
      contact: {
        street: "14 Independence Ave",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kofi Mensah",
          relationship: Relationship.SPOUSE_PARTNER,
          phoneNumber: "+233201112233",
        },
      },
      healthProfile: {
        bloodGroup: BloodGroup.O_POSITIVE,
        genotype: Genotype.AA,
      },
      patientCategory: {
        category: PatientCategory.NHIS_USER,
        nhisId: "GH-NHIS-20240088341",
        nhisSchemeType: "NHIS",
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

    const nonceB = (Date.now() + 1).toString().slice(-6)
    const emailB = `patient.upload.b.${nonceB}@example.com`
    const phoneB = `024${(1000000 + Math.floor(Math.random() * 8999999)).toString()}`

    console.log(`[Setup] Registering secondary Patient B (${emailB})...`)
    const regResultB = await registerPatient({
      account: {
        firstName: "Kofi",
        lastName: "Antwi",
        dateOfBirth: new Date("1991-08-15"),
        sex: Sex.MALE,
        email: emailB,
        phoneNumber: phoneB,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
      contact: {
        street: "20 Castle St",
        city: "Cape Coast",
        state: "Central",
        emergencyContact: {
          fullName: "Esi Antwi",
          relationship: Relationship.PARENT,
          phoneNumber: "+233249998877",
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
    const sessionB = await createTestSession(patientBId)

    // -------------------------------------------------------------------------
    // CHECK 1: Valid JPG Profile Photo
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 1: Upload Valid JPG Profile Photo (Rule B, C, D, E, L)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const boundaryJPG = "---------------------------boundary" + Date.now()
    const bodyJPG = buildMultipartFormData(boundaryJPG, {}, [
      {
        fieldName: "photo",
        filename: "my_portrait.jpg",
        contentType: "image/jpeg",
        buffer: VALID_JPEG,
      },
    ])

    const resJPG = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryJPG,
      bodyBuffer: bodyJPG,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Status Code: ${resJPG.status}`)
    console.log("Response Body:", JSON.stringify(resJPG.body, null, 2))

    if (resJPG.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for valid JPG upload, got ${resJPG.status}`,
      )
    }
    if (!resJPG.body.data.storageKey.startsWith("avatars/avatar_")) {
      throw new Error(
        `Expected server-controlled storageKey in avatars/, got ${resJPG.body.data.storageKey}`,
      )
    }

    // Verify stored file on disk
    const storedJpgPath = await getFilePath(
      "avatars",
      resJPG.body.data.storageKey,
    )
    if (!storedJpgPath || !fs.existsSync(storedJpgPath)) {
      throw new Error("JPG file was not saved to disk")
    }

    // Verify user record in database
    const userAAfterJpg = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    if (userAAfterJpg?.profilePhoto !== resJPG.body.data.storageKey) {
      throw new Error(
        "User.profilePhoto was not updated with correct storageKey",
      )
    }

    console.log("Stored file path:", storedJpgPath)
    console.log(
      "✔ CHECK 1 PASSED: Valid JPG profile photo successfully uploaded, inspected, and saved with server-controlled key.",
    )

    // -------------------------------------------------------------------------
    // CHECK 2: Valid PNG Profile Photo
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 2: Upload Valid PNG Profile Photo (Rule B, D, E, L)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const boundaryPNG = "---------------------------boundary" + (Date.now() + 1)
    const bodyPNG = buildMultipartFormData(boundaryPNG, {}, [
      {
        fieldName: "photo",
        filename: "my_avatar.png",
        contentType: "image/png",
        buffer: VALID_PNG,
      },
    ])

    const resPNG = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryPNG,
      bodyBuffer: bodyPNG,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Status Code: ${resPNG.status}`)
    console.log("Response Body:", JSON.stringify(resPNG.body, null, 2))

    if (resPNG.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for valid PNG upload, got ${resPNG.status}`,
      )
    }
    if (!resPNG.body.data.storageKey.endsWith(".png")) {
      throw new Error("Expected .png storageKey extension")
    }

    // Verify new file exists and previous JPG was cleaned up (Rule P)
    const storedPngPath = await getFilePath(
      "avatars",
      resPNG.body.data.storageKey,
    )
    if (!storedPngPath || !fs.existsSync(storedPngPath)) {
      throw new Error("PNG file was not saved to disk")
    }
    if (fs.existsSync(storedJpgPath)) {
      throw new Error("Previous JPG file was not cleaned up after replacement!")
    }

    console.log(
      "✔ CHECK 2 PASSED: Valid PNG profile photo successfully uploaded and prior avatar cleaned up.",
    )

    // -------------------------------------------------------------------------
    // CHECK 3: File Larger Than 2 MB
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 3: File Larger Than 2 MB Rejected (Rule C)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 2.2 MB buffer
    const largeBuffer = Buffer.alloc(2.2 * 1024 * 1024, 0xff)
    // Add JPEG header to simulate a huge image
    VALID_JPEG.copy(largeBuffer, 0)

    const boundaryLarge =
      "---------------------------boundary" + (Date.now() + 2)
    const bodyLarge = buildMultipartFormData(boundaryLarge, {}, [
      {
        fieldName: "photo",
        filename: "too_large.jpg",
        contentType: "image/jpeg",
        buffer: largeBuffer,
      },
    ])

    const resLarge = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryLarge,
      bodyBuffer: bodyLarge,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Large File Status Code: ${resLarge.status}`)
    console.log("Large File Response:", JSON.stringify(resLarge.body, null, 2))

    if (resLarge.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for file > 2 MB, got ${resLarge.status}`,
      )
    }
    if (resLarge.body.code !== ErrorCode.FILE_TOO_LARGE) {
      throw new Error(
        `Expected error code FILE_TOO_LARGE, got ${resLarge.body.code}`,
      )
    }

    console.log(
      "✔ CHECK 3 PASSED: File exceeding 2 MB strictly rejected with HTTP 400 FILE_TOO_LARGE.",
    )

    // -------------------------------------------------------------------------
    // CHECK 4: File With a Misleading Extension
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 4: File With Misleading Extension Rejected (Rule B, D)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Text content masquerading as a JPEG image
    const textAsJpg = Buffer.from(
      "echo 'malicious shell payload' > /dev/null\nexit 0",
    )
    const boundaryMisleading =
      "---------------------------boundary" + (Date.now() + 3)
    const bodyMisleading = buildMultipartFormData(boundaryMisleading, {}, [
      {
        fieldName: "photo",
        filename: "disguised_script.jpg",
        contentType: "image/jpeg",
        buffer: textAsJpg,
      },
    ])

    const resMisleading = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryMisleading,
      bodyBuffer: bodyMisleading,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Misleading Extension Status Code: ${resMisleading.status}`)
    console.log(
      "Misleading Extension Response:",
      JSON.stringify(resMisleading.body, null, 2),
    )

    if (resMisleading.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for misleading extension, got ${resMisleading.status}`,
      )
    }
    if (resMisleading.body.code !== ErrorCode.INVALID_FILE_CONTENT) {
      throw new Error(
        `Expected error code INVALID_FILE_CONTENT, got ${resMisleading.body.code}`,
      )
    }

    console.log(
      "✔ CHECK 4 PASSED: Disguised text payload masquerading as .jpg detected and rejected by magic bytes inspection.",
    )

    // -------------------------------------------------------------------------
    // CHECK 5: Unsupported File Type
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 5: Unsupported File Type (.svg / HTML / Executable) Rejected (Rule D, H)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const svgBuffer = Buffer.from(
      "<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>",
    )
    const boundarySvg = "---------------------------boundary" + (Date.now() + 4)
    const bodySvg = buildMultipartFormData(boundarySvg, {}, [
      {
        fieldName: "photo",
        filename: "vector_graphic.svg",
        contentType: "image/svg+xml",
        buffer: svgBuffer,
      },
    ])

    const resSvg = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundarySvg,
      bodyBuffer: bodySvg,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Unsupported Type Status Code: ${resSvg.status}`)
    console.log(
      "Unsupported Type Response:",
      JSON.stringify(resSvg.body, null, 2),
    )

    if (resSvg.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for unsupported file type, got ${resSvg.status}`,
      )
    }
    if (resSvg.body.code !== ErrorCode.UNSUPPORTED_FILE_TYPE) {
      throw new Error(
        `Expected error code UNSUPPORTED_FILE_TYPE, got ${resSvg.body.code}`,
      )
    }

    console.log(
      "✔ CHECK 5 PASSED: Unsupported SVG vector graphic properly rejected with HTTP 400 UNSUPPORTED_FILE_TYPE.",
    )

    // -------------------------------------------------------------------------
    // CHECK 6: Empty File (0 Bytes)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 6: Empty File (0 Bytes) Rejected (Rule B)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const emptyBuffer = Buffer.alloc(0)
    const boundaryEmpty =
      "---------------------------boundary" + (Date.now() + 5)
    const bodyEmpty = buildMultipartFormData(boundaryEmpty, {}, [
      {
        fieldName: "photo",
        filename: "zero_bytes.png",
        contentType: "image/png",
        buffer: emptyBuffer,
      },
    ])

    const resEmpty = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryEmpty,
      bodyBuffer: bodyEmpty,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Empty File Status Code: ${resEmpty.status}`)
    console.log("Empty File Response:", JSON.stringify(resEmpty.body, null, 2))

    if (resEmpty.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for 0-byte file, got ${resEmpty.status}`,
      )
    }
    if (resEmpty.body.code !== ErrorCode.EMPTY_FILE) {
      throw new Error(
        `Expected error code EMPTY_FILE, got ${resEmpty.body.code}`,
      )
    }

    console.log(
      "✔ CHECK 6 PASSED: 0-byte upload rejected with HTTP 400 EMPTY_FILE.",
    )

    // -------------------------------------------------------------------------
    // CHECK 7: Unauthenticated Upload
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 7: Unauthenticated Upload Blocked (Rule O)")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const boundaryUnauth =
      "---------------------------boundary" + (Date.now() + 6)
    const bodyUnauth = buildMultipartFormData(boundaryUnauth, {}, [
      {
        fieldName: "photo",
        filename: "test.jpg",
        contentType: "image/jpeg",
        buffer: VALID_JPEG,
      },
    ])

    const resUnauth = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryUnauth,
      bodyBuffer: bodyUnauth,
      // No cookie or auth headers
    })

    console.log(`Unauthenticated Status Code: ${resUnauth.status}`)
    console.log(
      "Unauthenticated Response:",
      JSON.stringify(resUnauth.body, null, 2),
    )

    if (resUnauth.status !== 401) {
      throw new Error(
        `Expected HTTP 401 for unauthenticated upload, got ${resUnauth.status}`,
      )
    }
    if (resUnauth.body.code !== ErrorCode.AUTHENTICATION_REQUIRED) {
      throw new Error(
        `Expected error code AUTHENTICATION_REQUIRED, got ${resUnauth.body.code}`,
      )
    }

    console.log(
      "✔ CHECK 7 PASSED: Unauthenticated upload attempt strictly blocked with HTTP 401.",
    )

    // -------------------------------------------------------------------------
    // CHECK 8: Unauthorized Document Access
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 8: Unauthorized Document Access Blocked (Rule J, K & Check 8)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 8.1 Patient A uploads category supporting document (PDF)
    const boundaryDoc = "---------------------------boundary" + (Date.now() + 7)
    const bodyDoc = buildMultipartFormData(boundaryDoc, {}, [
      {
        fieldName: "document",
        filename: "nhis_card_evidence.pdf",
        contentType: "application/pdf",
        buffer: VALID_PDF,
      },
    ])

    const resDocA = await multipartRequest(testPort, {
      path: "/api/patient/category-document",
      method: "POST",
      boundary: boundaryDoc,
      bodyBuffer: bodyDoc,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Patient A Document Upload Status: ${resDocA.status}`)
    console.log(
      "Patient A Document Upload Response:",
      JSON.stringify(resDocA.body, null, 2),
    )

    if (resDocA.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for document upload, got ${resDocA.status}`,
      )
    }
    if (
      resDocA.body.data.verificationStatus !==
      CategoryVerificationStatus.PENDING
    ) {
      throw new Error(
        `Rule Q violation: verificationStatus must remain PENDING, got ${resDocA.body.data.verificationStatus}`,
      )
    }

    // 8.2 Patient B attempts to download Patient A's document by explicit ID
    const resIdorDoc = await simpleRequest(testPort, {
      path: `/api/patient/${patientAId}/category-document`,
      method: "GET",
      headers: {
        Cookie: sessionB.sessionCookie,
      },
    })

    console.log(
      `Patient B accessing Patient A Document Status: ${resIdorDoc.status}`,
    )
    console.log("Patient B Response:", JSON.stringify(resIdorDoc.body, null, 2))

    if (resIdorDoc.status !== 403) {
      throw new Error(
        `Expected HTTP 403 for unauthorized document access, got ${resIdorDoc.status}`,
      )
    }
    if (resIdorDoc.body.code !== ErrorCode.FORBIDDEN) {
      throw new Error(
        `Expected error code FORBIDDEN, got ${resIdorDoc.body.code}`,
      )
    }

    // 8.3 Patient A successfully downloads own document
    const resOwnDoc = await simpleRequest(testPort, {
      path: "/api/patient/category-document",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    if (resOwnDoc.status !== 200) {
      throw new Error(
        `Expected HTTP 200 for patient A accessing own document, got ${resOwnDoc.status}`,
      )
    }
    if (resOwnDoc.headers["content-type"] !== "application/pdf") {
      throw new Error(
        `Expected Content-Type application/pdf, got ${resOwnDoc.headers["content-type"]}`,
      )
    }
    if (resOwnDoc.headers["x-content-type-options"] !== "nosniff") {
      throw new Error(
        "Missing X-Content-Type-Options: nosniff header on document response",
      )
    }

    console.log(
      "✔ CHECK 8 PASSED: Cross-patient document access blocked with HTTP 403. Own document safely streamed with nosniff header.",
    )

    // -------------------------------------------------------------------------
    // CHECK 9: Filename Containing Traversal Characters
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 9: Filename Containing Traversal Characters Safely Neutralized (Rule E, F, G)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const boundaryTrav =
      "---------------------------boundary" + (Date.now() + 8)
    const bodyTrav = buildMultipartFormData(boundaryTrav, {}, [
      {
        fieldName: "photo",
        filename: "../../../../etc/passwd.png",
        contentType: "image/png",
        buffer: VALID_PNG,
      },
    ])

    const resTrav = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryTrav,
      bodyBuffer: bodyTrav,
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Traversal Upload Status Code: ${resTrav.status}`)
    console.log("Storage Key Assigned:", resTrav.body.data?.storageKey)

    if (resTrav.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${resTrav.status}`)
    }

    const assignedKey = resTrav.body.data.storageKey
    if (assignedKey.includes("..") || assignedKey.includes("passwd")) {
      throw new Error(
        "SECURITY FAILURE: original traversal filename leaked into storageKey!",
      )
    }

    // Verify canonical path is inside uploads/avatars
    const travPath = await getFilePath("avatars", assignedKey)
    const avatarsDir = path.resolve(env.UPLOAD_DIR, "avatars")
    if (!travPath || !travPath.startsWith(avatarsDir)) {
      throw new Error(
        "File was stored outside the designated avatars directory!",
      )
    }

    console.log("Canonical Disk Path:", travPath)
    console.log(
      "✔ CHECK 9 PASSED: Traversal characters neutralized. File saved under isolated UUID within avatars directory.",
    )

    // -------------------------------------------------------------------------
    // CHECK 10: Attempt to Overwrite Another User's File
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 10: Attempt to Overwrite Another User's File Blocked (Rule E, G, K)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // Patient A's current photo file path
    const userAState = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    const patientAOriginalKey = userAState!.profilePhoto!
    const patientAOriginalPath = (await getFilePath(
      "avatars",
      patientAOriginalKey,
    ))!
    const originalContent = fs.readFileSync(patientAOriginalPath)

    // Patient B attempts to upload with a filename attempting to collide with Patient A's file
    const boundaryCollide =
      "---------------------------boundary" + (Date.now() + 9)
    const bodyCollide = buildMultipartFormData(boundaryCollide, {}, [
      {
        fieldName: "photo",
        filename: path.basename(patientAOriginalPath),
        contentType: "image/png",
        buffer: VALID_PNG,
      },
    ])

    const resCollide = await multipartRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "POST",
      boundary: boundaryCollide,
      bodyBuffer: bodyCollide,
      headers: {
        Cookie: sessionB.sessionCookie,
        "x-csrf-token": sessionB.csrfToken,
      },
    })

    console.log(`Patient B Upload Status: ${resCollide.status}`)
    console.log("Patient B Assigned Key:", resCollide.body.data?.storageKey)

    // Verify Patient A's file was NOT overwritten
    const currentAContent = fs.readFileSync(patientAOriginalPath)
    if (!currentAContent.equals(originalContent)) {
      throw new Error(
        "CRITICAL SECURITY VIOLATION: Patient A's file was overwritten by Patient B!",
      )
    }
    if (resCollide.body.data.storageKey === patientAOriginalKey) {
      throw new Error("Patient B was assigned Patient A's storageKey!")
    }

    console.log("Patient A file remains intact and unmodified.")
    console.log(
      "✔ CHECK 10 PASSED: Server-generated UUID and user isolation prevent file overwrites.",
    )

    // -------------------------------------------------------------------------
    // CHECK 11: Database Failure After File Storage
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 11: Rollback & File Cleanup Upon Database Failure (Rule P & Check 11)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    let simulatedErrorCaught = false
    let leakedFilePath: string | null = null

    try {
      await uploadPatientProfilePhoto(
        patientAId,
        VALID_JPEG,
        "test_simulated_failure.jpg",
        { simulateDbFailure: true },
      )
    } catch (err: any) {
      simulatedErrorCaught = true
      console.log("Caught expected simulated failure:", err.message)
    }

    if (!simulatedErrorCaught) {
      throw new Error("Expected simulated database failure was not thrown")
    }

    // Count files in avatars directory to verify zero orphaned files were left
    const filesInAvatars = fs.readdirSync(avatarsDir)
    console.log(`Current avatar files count: ${filesInAvatars.length}`)

    // Verify User.profilePhoto in DB was not corrupted
    const userAAfterSim = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    if (!userAAfterSim?.profilePhoto) {
      throw new Error(
        "User profile photo was unexpectedly wiped during simulated failure",
      )
    }

    console.log(
      "✔ CHECK 11 PASSED: Database failure triggered immediate cleanup of the newly created file.",
    )

    // -------------------------------------------------------------------------
    // CHECK 12: Cleanup of Abandoned or Rejected Uploads
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 12: Zero Orphan Files Left From Rejected Uploads (Rule P & Check 12)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const documentsDir = path.resolve(env.UPLOAD_DIR, "documents")
    const avatarFiles = fs.readdirSync(avatarsDir)
    const documentFiles = fs.readdirSync(documentsDir)

    console.log(`Total valid avatars on disk: ${avatarFiles.length}`)
    console.log(`Total valid documents on disk: ${documentFiles.length}`)

    // Verify all files on disk correspond to active database records
    const allUsers = await prisma.user.findMany({
      select: { profilePhoto: true },
    })
    const allCategoryRecords = await prisma.patientCategoryRecord.findMany({
      select: { supportingDocument: true },
    })

    const activeAvatarKeys = new Set(
      allUsers.map((u) => u.profilePhoto).filter(Boolean),
    )
    const activeDocKeys = new Set(
      allCategoryRecords.map((c) => c.supportingDocument).filter(Boolean),
    )

    for (const f of avatarFiles) {
      const key = `avatars/${f}`
      if (!activeAvatarKeys.has(key)) {
        throw new Error(`Orphaned avatar file detected on disk: ${f}`)
      }
    }

    for (const f of documentFiles) {
      const key = `documents/${f}`
      if (!activeDocKeys.has(key)) {
        throw new Error(`Orphaned document file detected on disk: ${f}`)
      }
    }

    console.log(
      "All files on disk correspond exactly to active database references. Zero orphaned or abandoned files found.",
    )
    console.log(
      "✔ CHECK 12 PASSED: Storage directory integrity verified. All rejected uploads left 0 orphan files.",
    )

    // -------------------------------------------------------------------------
    // CHECK 13: Controlled Profile Photo Deletion (DELETE /api/patient/profile-photo)
    // -------------------------------------------------------------------------
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CHECK 13: Controlled Profile Photo Deletion & Storage Cleanup")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 13.1 Check user A currently has an avatar
    const userABeforeDelete = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    const currentAvatarKey = userABeforeDelete?.profilePhoto
    if (!currentAvatarKey) {
      throw new Error(
        "Check 13 setup failed: Patient A should have an active avatar before deletion",
      )
    }
    const currentAvatarPath = await getFilePath("avatars", currentAvatarKey)
    if (!currentAvatarPath || !fs.existsSync(currentAvatarPath)) {
      throw new Error(
        "Check 13 setup failed: Avatar file should exist on disk before deletion",
      )
    }

    // 13.2 Send DELETE request with valid session and CSRF token
    const resDelete = await simpleRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "DELETE",
      headers: {
        Cookie: sessionA.sessionCookie,
        "x-csrf-token": sessionA.csrfToken,
      },
    })

    console.log(`Delete Avatar Status Code (Expected 200): ${resDelete.status}`)
    console.log(
      "Delete Avatar Response:",
      JSON.stringify(resDelete.body, null, 2),
    )

    if (resDelete.status !== 200 || resDelete.body.status !== "success") {
      throw new Error(
        `Expected HTTP 200 for photo deletion, got ${resDelete.status}`,
      )
    }

    // 13.3 Verify database record updated to null
    const userAAfterDelete = await prisma.user.findUnique({
      where: { id: patientAId },
    })
    if (userAAfterDelete?.profilePhoto !== null) {
      throw new Error(
        `Expected user.profilePhoto in DB to be null, got: ${userAAfterDelete?.profilePhoto}`,
      )
    }

    // 13.4 Verify file unlinked from disk
    if (fs.existsSync(currentAvatarPath)) {
      throw new Error(
        `Avatar file still exists on disk after deletion: ${currentAvatarPath}`,
      )
    }

    // 13.5 Verify GET /api/patient/profile-photo returns 404 NOT_FOUND
    const resGetAfterDelete = await simpleRequest(testPort, {
      path: "/api/patient/profile-photo",
      method: "GET",
      headers: {
        Cookie: sessionA.sessionCookie,
      },
    })

    if (
      resGetAfterDelete.status !== 404 ||
      resGetAfterDelete.body.code !== ErrorCode.NOT_FOUND
    ) {
      throw new Error(
        `Expected HTTP 404 NOT_FOUND after deletion, got ${resGetAfterDelete.status}`,
      )
    }

    console.log(
      "✔ CHECK 13 PASSED: Profile photo successfully deleted from DB, disk unlinked, and GET returns 404.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 13 PATIENT UPLOAD & STORAGE SECURITY CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    // Teardown test server
    server.close()

    // Clean up created test users and files
    console.log("\n[Cleanup] Cleaning up test users and files...")
    for (const uId of createdUserIds) {
      try {
        const u = await prisma.user.findUnique({ where: { id: uId } })
        if (u?.profilePhoto) {
          const p = await getFilePath("avatars", u.profilePhoto)
          if (p && fs.existsSync(p)) fs.unlinkSync(p)
        }
        const c = await prisma.patientCategoryRecord.findUnique({
          where: { userId: uId },
        })
        if (c?.supportingDocument) {
          const p = await getFilePath("documents", c.supportingDocument)
          if (p && fs.existsSync(p)) fs.unlinkSync(p)
        }
        await prisma.user.delete({ where: { id: uId } })
      } catch (err) {
        // Ignore deletion errors on teardown
      }
    }
    console.log(
      `[Cleanup] Completed cleanup of ${createdUserIds.length} test users.`,
    )
  }
}

runUploadTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:", err)
  process.exit(1)
})
