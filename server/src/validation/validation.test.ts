import express from "express"
import http from "http"
import {
  stage1AccountSchema,
  stage2ContactSchema,
  stage3HealthProfileSchema,
  stage4CategorySchema,
  stage5ConsentSchema,
  fullPatientOnboardingSchema,
} from "./onboarding"
import {
  normalizeEmail,
  normalizePhoneNumber,
  validateDateOfBirth,
  findServerControlledFields,
} from "./common"
import { validateBody } from "../middleware/validate"
import { errorHandler, notFoundHandler } from "../middleware/errorHandler"
import {
  AppError,
  ErrorCode,
  ValidationError,
  ConflictError,
} from "../errors/AppError"
import { sanitizeForLog } from "../utils/sanitizeLog"
import { prisma } from "../config/prisma"
import {
  Sex,
  Relationship,
  BloodGroup,
  Genotype,
  PatientCategory,
  ConsentType,
} from "../generated/prisma/enums"

// Helper for sending structured JSON requests
async function sendJsonPost(
  port: number,
  path: string,
  payload: any,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload)
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsed
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode || 500, body: parsed })
        })
      },
    )
    req.on("error", reject)
    req.write(postData)
    req.end()
  })
}

// Helper for sending raw POST requests (used for malformed JSON testing)
async function sendRawPost(
  port: number,
  path: string,
  rawBody: string,
  contentType = "application/json",
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "Content-Length": Buffer.byteLength(rawBody),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsed
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode || 500, body: parsed })
        })
      },
    )
    req.on("error", reject)
    req.write(rawBody)
    req.end()
  })
}

// Helper for sending GET requests
async function sendGet(
  port: number,
  path: string,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsed
          try {
            parsed = JSON.parse(data)
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode || 500, body: parsed })
        })
      },
    )
    req.on("error", reject)
    req.end()
  })
}

async function runAllAutomatedValidationChecks() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: COMPREHENSIVE BACKEND REQUEST VALIDATION & ERROR HANDLING SUITE",
  )
  console.log(
    "================================================================================",
  )

  // Snapshot database record counts to verify no mutations occur from invalid requests
  console.log(
    "\n[Pre-Check] Querying database baseline table counts via Prisma...",
  )
  const initialCounts = {
    users: await prisma.user.count(),
    addresses: await prisma.address.count(),
    emergencyContacts: await prisma.emergencyContact.count(),
    healthProfiles: await prisma.healthProfile.count(),
    categoryRecords: await prisma.patientCategoryRecord.count(),
    consentRecords: await prisma.consentRecord.count(),
  }
  console.log("Baseline record counts:", initialCounts)

  // Set up Express test application
  const app = express()
  app.use(express.json())

  // Mount test routes
  app.post(
    "/api/test/stage1",
    validateBody(stage1AccountSchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  app.post(
    "/api/test/stage2",
    validateBody(stage2ContactSchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  app.post(
    "/api/test/stage3",
    validateBody(stage3HealthProfileSchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  app.post(
    "/api/test/stage4",
    validateBody(stage4CategorySchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  app.post(
    "/api/test/stage5",
    validateBody(stage5ConsentSchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  app.post(
    "/api/test/full-onboarding",
    validateBody(fullPatientOnboardingSchema),
    (req, res) => {
      res.status(200).json({ status: "success", data: req.body })
    },
  )

  // Simulated conflict route (Prisma P2002 error simulation)
  app.post("/api/test/simulate-conflict", (req, res, next) => {
    const error: any = new Error(
      "Unique constraint failed on the fields: (`email`)",
    )
    error.code = "P2002"
    error.meta = { target: ["email"] }
    next(error)
  })

  // Simulated auth error
  app.get("/api/test/simulate-unauthorized", (req, res, next) => {
    next(AppError.unauthorized("Authentication token is missing or expired"))
  })

  // Simulated forbidden error
  app.get("/api/test/simulate-forbidden", (req, res, next) => {
    next(AppError.forbidden("Access denied: insufficient permissions"))
  })

  // Simulated rate limit error
  app.get("/api/test/simulate-rate-limit", (req, res, next) => {
    next(
      AppError.rateLimit(
        "Too many registration attempts. Please wait 15 minutes.",
      ),
    )
  })

  // Simulated 500 server error
  app.get("/api/test/simulate-server-error", (req, res, next) => {
    next(
      new Error(
        "FATAL: connection to postgresql://postgres:secret@db:5432/healthitude_db lost",
      ),
    )
  })

  // 404 & Centralized Error Handler
  app.use(notFoundHandler)
  app.use(errorHandler)

  const testPort = 5123
  const server = app.listen(testPort)
  await new Promise((r) => setTimeout(r, 150))

  try {
    // =========================================================================
    // CHECK 1: A VALID REQUEST
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 1: A Valid Request (Input Normalization, Proper HTTP Status & Response)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const validPayload = {
      firstName: "Ama",
      middleName: "Akua",
      lastName: "Mensah",
      dateOfBirth: "1996-05-14",
      sex: Sex.FEMALE,
      email: "  AMA.MENSAH@EXAMPLE.COM  ", // Needs trimming + lowercase
      phoneNumber: " 024 123 4567 ", // Needs Ghana local normalization to +233241234567
      password: "StrongPassword2026!",
      confirmPassword: "StrongPassword2026!",
    }

    const res1 = await sendJsonPost(testPort, "/api/test/stage1", validPayload)
    console.log("Status Code:", res1.status)
    console.log("Response Body:", JSON.stringify(res1.body, null, 2))

    if (res1.status !== 200 || res1.body.status !== "success") {
      throw new Error(`Check 1 Failed: Expected HTTP 200, got ${res1.status}`)
    }

    // Verify email normalization
    if (res1.body.data.email !== "ama.mensah@example.com") {
      throw new Error(
        `Check 1 Failed: Email not normalized. Got: ${res1.body.data.email}`,
      )
    }

    // Verify phone normalization
    if (res1.body.data.phoneNumber !== "+233241234567") {
      throw new Error(
        `Check 1 Failed: Phone number not normalized. Got: ${res1.body.data.phoneNumber}`,
      )
    }

    // Verify date of birth parsed into Date
    const parsedDate = new Date(res1.body.data.dateOfBirth)
    if (isNaN(parsedDate.getTime()) || parsedDate.getUTCFullYear() !== 1996) {
      throw new Error(`Check 1 Failed: Date of birth not parsed properly.`)
    }

    console.log(
      "✔ CHECK 1 PASSED: Valid request accepted (200), email lowercased/trimmed, phone normalized to +233241234567, date parsed.",
    )

    // =========================================================================
    // CHECK 2: MISSING REQUIRED FIELDS
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 2: Missing Required Fields (Safe, Field-Specific Error Reporting)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const missingFieldsPayload = {
      firstName: "Ama",
      // missing lastName
      // missing dateOfBirth
      sex: Sex.FEMALE,
      // missing email
      // missing phoneNumber
      password: "StrongPassword2026!",
    }

    const res2 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      missingFieldsPayload,
    )
    console.log("Status Code:", res2.status)
    console.log("Response Body:", JSON.stringify(res2.body, null, 2))

    if (
      res2.status !== 400 ||
      res2.body.status !== "error" ||
      res2.body.code !== ErrorCode.VALIDATION_ERROR
    ) {
      throw new Error(
        `Check 2 Failed: Expected HTTP 400 VALIDATION_ERROR, got ${res2.status}`,
      )
    }

    if (!Array.isArray(res2.body.errors) || res2.body.errors.length === 0) {
      throw new Error(
        "Check 2 Failed: Expected structured errors array in response.",
      )
    }

    const missingFields = res2.body.errors.map((e: any) => e.field)
    if (
      !missingFields.includes("lastName") ||
      !missingFields.includes("email") ||
      !missingFields.includes("phoneNumber") ||
      !missingFields.includes("dateOfBirth")
    ) {
      throw new Error(
        `Check 2 Failed: Missing fields not properly identified. Found: ${missingFields.join(", ")}`,
      )
    }

    console.log(
      "✔ CHECK 2 PASSED: Missing fields rejected with HTTP 400, code VALIDATION_ERROR, and specific field errors.",
    )

    // =========================================================================
    // CHECK 3: INVALID EMAIL
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 3: Invalid Email (RFC 5322 Syntax Enforcement & Field-Specific Errors)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const invalidEmails = [
      "not-an-email",
      "user@",
      "@example.com",
      "user space@example.com",
      "user@domain..com",
    ]

    for (const badEmail of invalidEmails) {
      const badEmailPayload = {
        ...validPayload,
        email: badEmail,
      }

      const res3 = await sendJsonPost(
        testPort,
        "/api/test/stage1",
        badEmailPayload,
      )
      if (
        res3.status !== 400 ||
        res3.body.code !== ErrorCode.VALIDATION_ERROR
      ) {
        throw new Error(
          `Check 3 Failed: Bad email '${badEmail}' did not produce HTTP 400 VALIDATION_ERROR`,
        )
      }

      const emailErr = res3.body.errors?.find((e: any) => e.field === "email")
      if (!emailErr || !emailErr.message.includes("email")) {
        throw new Error(
          `Check 3 Failed: Error not attached to email field for '${badEmail}'`,
        )
      }
    }

    console.log(
      `✔ CHECK 3 PASSED: All ${invalidEmails.length} malformed email variants rejected with HTTP 400 and field-specific errors.`,
    )

    // =========================================================================
    // CHECK 4: INVALID DATE OF BIRTH
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 4: Invalid Date of Birth (Real Calendar Date & Plausibility Validation)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 4.1 Rollover / Non-existent calendar date (2023-02-31)
    const rolloverDatePayload = { ...validPayload, dateOfBirth: "2023-02-31" }
    const res4_1 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      rolloverDatePayload,
    )
    console.log("4.1 Rollover Date (2023-02-31) Status:", res4_1.status)
    console.log("4.1 Response Body:", JSON.stringify(res4_1.body, null, 2))

    if (res4_1.status !== 400) {
      throw new Error(
        `Check 4.1 Failed: Non-existent date 2023-02-31 was not rejected with HTTP 400!`,
      )
    }
    const dobError1 = res4_1.body.errors?.find(
      (e: any) => e.field === "dateOfBirth",
    )
    if (!dobError1 || !dobError1.message.includes("calendar date")) {
      throw new Error("Check 4.1 Failed: Expected calendar date error message.")
    }

    // 4.2 Non-leap year February 29th (2023-02-29)
    const nonLeapDayPayload = { ...validPayload, dateOfBirth: "2023-02-29" }
    const res4_2 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      nonLeapDayPayload,
    )
    if (res4_2.status !== 400) {
      throw new Error(
        "Check 4.2 Failed: Non-leap year 2023-02-29 was not rejected with HTTP 400!",
      )
    }

    // 4.3 Valid leap day (2024-02-29) must be accepted
    const validLeapDayPayload = { ...validPayload, dateOfBirth: "2024-02-29" }
    const res4_3 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      validLeapDayPayload,
    )
    if (res4_3.status !== 200) {
      throw new Error(
        "Check 4.3 Failed: Valid leap year 2024-02-29 should have been accepted!",
      )
    }

    // 4.4 Future Date
    const futureDatePayload = { ...validPayload, dateOfBirth: "2099-01-01" }
    const res4_4 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      futureDatePayload,
    )
    if (res4_4.status !== 400) {
      throw new Error(
        "Check 4.4 Failed: Future date 2099-01-01 was not rejected with HTTP 400!",
      )
    }
    const dobError4 = res4_4.body.errors?.find(
      (e: any) => e.field === "dateOfBirth",
    )
    if (!dobError4 || !dobError4.message.includes("past")) {
      throw new Error(
        "Check 4.4 Failed: Expected 'Date of birth must be in the past' error message.",
      )
    }

    // 4.5 Implausible Age (> 130 years)
    const ancientDatePayload = { ...validPayload, dateOfBirth: "1850-01-01" }
    const res4_5 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      ancientDatePayload,
    )
    if (res4_5.status !== 400) {
      throw new Error(
        "Check 4.5 Failed: Implausible age 1850-01-01 was not rejected with HTTP 400!",
      )
    }
    const dobError5 = res4_5.body.errors?.find(
      (e: any) => e.field === "dateOfBirth",
    )
    if (!dobError5 || !dobError5.message.includes("plausible age")) {
      throw new Error(
        "Check 4.5 Failed: Expected 'plausible age' error message.",
      )
    }

    console.log(
      "✔ CHECK 4 PASSED: Non-existent dates (2023-02-31, 2023-02-29), future dates, and implausible ages (>130y) strictly rejected with HTTP 400.",
    )

    // =========================================================================
    // CHECK 5: UNSUPPORTED ENUM VALUES
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 5: Unsupported Enum Values (Sex, Relationship, Blood Group, Category)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    // 5.1 Invalid Sex enum
    const invalidSexPayload = { ...validPayload, sex: "INVALID_SEX_VALUE" }
    const res5_1 = await sendJsonPost(
      testPort,
      "/api/test/stage1",
      invalidSexPayload,
    )
    console.log("5.1 Invalid Sex Status:", res5_1.status)
    console.log("5.1 Response Body:", JSON.stringify(res5_1.body, null, 2))

    if (
      res5_1.status !== 400 ||
      res5_1.body.code !== ErrorCode.VALIDATION_ERROR
    ) {
      throw new Error(
        "Check 5.1 Failed: Unsupported sex enum did not produce HTTP 400 VALIDATION_ERROR",
      )
    }
    const sexErr = res5_1.body.errors?.find((e: any) => e.field === "sex")
    if (
      !sexErr ||
      !sexErr.message.includes("FEMALE, MALE, PREFER_NOT_TO_SAY")
    ) {
      throw new Error(
        "Check 5.1 Failed: Expected valid sex options in error message.",
      )
    }

    // 5.2 Invalid Relationship enum (Stage 2)
    const invalidContactPayload = {
      street: "123 Liberation Road",
      city: "Accra",
      state: "Greater Accra",
      district: "Accra Metropolitan",
      emergencyContact: {
        fullName: "Kwame Mensah",
        relationship: "UNSUPPORTED_COWORKER_RELATION",
        phoneNumber: "0241112233",
      },
    }
    const res5_2 = await sendJsonPost(
      testPort,
      "/api/test/stage2",
      invalidContactPayload,
    )
    if (res5_2.status !== 400) {
      throw new Error(
        "Check 5.2 Failed: Unsupported relationship enum did not produce HTTP 400",
      )
    }

    // 5.3 Invalid Blood Group (Stage 3)
    const invalidBloodPayload = {
      bloodGroup: "INVALID_GROUP_XYZ",
    }
    const res5_3 = await sendJsonPost(
      testPort,
      "/api/test/stage3",
      invalidBloodPayload,
    )
    if (res5_3.status !== 400) {
      throw new Error(
        "Check 5.3 Failed: Unsupported bloodGroup did not produce HTTP 400",
      )
    }

    // 5.4 Invalid Patient Category (Stage 4)
    const invalidCategoryPayload = {
      category: "UNKNOWN_SPECIAL_CATEGORY",
    }
    const res5_4 = await sendJsonPost(
      testPort,
      "/api/test/stage4",
      invalidCategoryPayload,
    )
    if (res5_4.status !== 400) {
      throw new Error(
        "Check 5.4 Failed: Unsupported category did not produce HTTP 400",
      )
    }

    console.log(
      "✔ CHECK 5 PASSED: Unsupported enum values across all models strictly rejected with safe field messages.",
    )

    // =========================================================================
    // CHECK 6: UNEXPECTED SERVER-CONTROLLED FIELDS
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 6: Unexpected Server-Controlled Fields (Rule J Protection)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const hackedPayload = {
      ...validPayload,
      passwordHash: "$2b$12$eX4mpleH4shInjectedByAttacker99999999999",
      userId: "b3f07a78-29cb-4c55-827d-9486c4f0611c",
      role: "ADMIN",
      verificationStatus: "VERIFIED",
      isVerified: true,
      createdAt: "2020-01-01T00:00:00.000Z",
    }

    const res6 = await sendJsonPost(testPort, "/api/test/stage1", hackedPayload)
    console.log("Status Code:", res6.status)
    console.log("Response Body:", JSON.stringify(res6.body, null, 2))

    if (res6.status !== 400 || res6.body.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error(
        "Check 6 Failed: Injected server-controlled properties did not produce HTTP 400!",
      )
    }

    // Verify unrecognized keys were flagged
    const hasUnrecognized = res6.body.errors?.some(
      (e: any) =>
        e.code === "unrecognized_keys" ||
        e.message.includes("server-controlled"),
    )
    if (!hasUnrecognized) {
      throw new Error(
        "Check 6 Failed: Server-controlled properties not specifically flagged as unrecognized.",
      )
    }

    console.log(
      "✔ CHECK 6 PASSED: Injected server-controlled properties (passwordHash, userId, role, verificationStatus) strictly rejected.",
    )

    // =========================================================================
    // CHECK 7: DUPLICATE-VALUE CONFLICT HANDLING
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 7: Duplicate-Value Conflict Handling (Prisma P2002 & 409 Conflict)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const res7 = await sendJsonPost(testPort, "/api/test/simulate-conflict", {
      email: "ama.mensah@example.com",
    })
    console.log("Status Code:", res7.status)
    console.log("Response Body:", JSON.stringify(res7.body, null, 2))

    if (res7.status !== 409 || res7.body.code !== ErrorCode.RESOURCE_CONFLICT) {
      throw new Error(
        `Check 7 Failed: Expected HTTP 409 RESOURCE_CONFLICT, got ${res7.status}`,
      )
    }

    // Rule I: Ensure no Prisma or SQL query internals leaked
    const serializedRes7 = JSON.stringify(res7.body)
    if (
      serializedRes7.includes("P2002") ||
      serializedRes7.includes("SELECT") ||
      serializedRes7.includes("table")
    ) {
      throw new Error(
        "Check 7 Failed: Database internals leaked in conflict error response!",
      )
    }

    console.log(
      "✔ CHECK 7 PASSED: Prisma P2002 conflict mapped cleanly to HTTP 409 RESOURCE_CONFLICT without leaking database internals.",
    )

    // =========================================================================
    // CHECK 8: MALFORMED JSON REQUEST
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 8: Malformed JSON Request (Rule D: Reject Malformed Payloads)",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const malformedJsonString =
      '{"firstName": "Ama", "lastName": "Mensah", invalid_json_syntax: '
    const res8 = await sendRawPost(
      testPort,
      "/api/test/stage1",
      malformedJsonString,
    )
    console.log("Status Code:", res8.status)
    console.log("Response Body:", JSON.stringify(res8.body, null, 2))

    if (res8.status !== 400 || res8.body.code !== ErrorCode.MALFORMED_JSON) {
      throw new Error(
        `Check 8 Failed: Expected HTTP 400 MALFORMED_JSON, got ${res8.status} with code ${res8.body.code}`,
      )
    }

    if (res8.body.message !== "Malformed JSON payload in request body") {
      throw new Error(
        `Check 8 Failed: Expected 'Malformed JSON payload in request body' message`,
      )
    }

    console.log(
      "✔ CHECK 8 PASSED: Malformed JSON body rejected with HTTP 400, code MALFORMED_JSON, and clean message.",
    )

    // =========================================================================
    // CHECK 9: CONSISTENT ERROR-RESPONSE FORMATTING ACROSS DIFFERENT FAILURE TYPES
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log(
      "CHECK 9: Consistent Error-Response Formatting Across Different Failure Types",
    )
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const failureEndpoints = [
      {
        type: "400 Validation Error",
        fn: () => sendJsonPost(testPort, "/api/test/stage1", {}),
        expectedStatus: 400,
        expectedCode: ErrorCode.VALIDATION_ERROR,
      },
      {
        type: "400 Malformed JSON",
        fn: () =>
          sendRawPost(testPort, "/api/test/stage1", "{ malformed json:"),
        expectedStatus: 400,
        expectedCode: ErrorCode.MALFORMED_JSON,
      },
      {
        type: "401 Unauthorized",
        fn: () => sendGet(testPort, "/api/test/simulate-unauthorized"),
        expectedStatus: 401,
        expectedCode: ErrorCode.AUTHENTICATION_REQUIRED,
      },
      {
        type: "403 Forbidden",
        fn: () => sendGet(testPort, "/api/test/simulate-forbidden"),
        expectedStatus: 403,
        expectedCode: ErrorCode.FORBIDDEN,
      },
      {
        type: "404 Not Found",
        fn: () => sendGet(testPort, "/api/test/nonexistent-route"),
        expectedStatus: 404,
        expectedCode: ErrorCode.NOT_FOUND,
      },
      {
        type: "409 Resource Conflict",
        fn: () => sendJsonPost(testPort, "/api/test/simulate-conflict", {}),
        expectedStatus: 409,
        expectedCode: ErrorCode.RESOURCE_CONFLICT,
      },
      {
        type: "429 Rate Limit Exceeded",
        fn: () => sendGet(testPort, "/api/test/simulate-rate-limit"),
        expectedStatus: 429,
        expectedCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      },
      {
        type: "500 Internal Server Error",
        fn: () => sendGet(testPort, "/api/test/simulate-server-error"),
        expectedStatus: 500,
        expectedCode: ErrorCode.INTERNAL_SERVER_ERROR,
      },
    ]

    for (const testCase of failureEndpoints) {
      const res = await testCase.fn()
      console.log(
        `[Testing ${testCase.type}] -> Status: ${res.status}, Code: ${res.body.code}`,
      )

      // Verify status code
      if (res.status !== testCase.expectedStatus) {
        throw new Error(
          `Check 9 Failed for ${testCase.type}: Expected status ${testCase.expectedStatus}, got ${res.status}`,
        )
      }

      // Verify envelope shape: status, code, message
      if (res.body.status !== "error") {
        throw new Error(
          `Check 9 Failed for ${testCase.type}: status property must be 'error'`,
        )
      }
      if (res.body.code !== testCase.expectedCode) {
        throw new Error(
          `Check 9 Failed for ${testCase.type}: Expected code ${testCase.expectedCode}, got ${res.body.code}`,
        )
      }
      if (
        typeof res.body.message !== "string" ||
        res.body.message.length === 0
      ) {
        throw new Error(
          `Check 9 Failed for ${testCase.type}: Missing or empty message string`,
        )
      }

      // Rule I & N: Check that 500 server error does NOT leak database connection strings or stack traces
      if (res.status === 500) {
        const serialized500 = JSON.stringify(res.body)
        if (
          serialized500.includes("postgresql://") ||
          serialized500.includes("secret") ||
          serialized500.includes("FATAL")
        ) {
          throw new Error(
            "Check 9 Security Violation: 500 Internal Server Error leaked database connection details!",
          )
        }
      }
    }

    console.log(
      "✔ CHECK 9 PASSED: All 8 failure types adhere strictly to ErrorResponseEnvelope without leaking internals.",
    )

    // =========================================================================
    // POST-CHECK: DATABASE MUTATION & PARTIAL RECORD CONFIRMATION
    // =========================================================================
    console.log(
      "\n--------------------------------------------------------------------------------",
    )
    console.log("CONFIRMATION: Database Mutation & Partial Record Check")
    console.log(
      "--------------------------------------------------------------------------------",
    )

    const finalCounts = {
      users: await prisma.user.count(),
      addresses: await prisma.address.count(),
      emergencyContacts: await prisma.emergencyContact.count(),
      healthProfiles: await prisma.healthProfile.count(),
      categoryRecords: await prisma.patientCategoryRecord.count(),
      consentRecords: await prisma.consentRecord.count(),
    }
    console.log("Final record counts:", finalCounts)

    if (
      initialCounts.users !== finalCounts.users ||
      initialCounts.addresses !== finalCounts.addresses ||
      initialCounts.emergencyContacts !== finalCounts.emergencyContacts ||
      initialCounts.healthProfiles !== finalCounts.healthProfiles ||
      initialCounts.categoryRecords !== finalCounts.categoryRecords ||
      initialCounts.consentRecords !== finalCounts.consentRecords
    ) {
      throw new Error(
        "DATABASE INTEGRITY VIOLATION: Database tables were mutated by invalid requests!",
      )
    }

    console.log(
      "✔ CONFIRMED: Initial counts equal final counts. Zero database mutations and zero partial records created.",
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 9 VALIDATION & ERROR HANDLING CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================",
    )
  } finally {
    await new Promise<void>((resolve) => {
      server.close(async () => {
        await prisma.$disconnect()
        resolve()
      })
    })
  }
}

runAllAutomatedValidationChecks().catch((err) => {
  console.error("Test Suite Execution Failed:", err)
  process.exit(1)
})
