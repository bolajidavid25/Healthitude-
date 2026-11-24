import http from "http"
import { createApp } from "./app"
import { isFirebaseConfigured } from "./config/firebase"

async function postJson(port: number, path: string, body: any) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload).toString(),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) })
          } catch {
            resolve({ status: res.statusCode || 500, body: data })
          }
        })
      },
    )
    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

async function runFirebaseGoogleAuthTests() {
  console.log("================================================================================")
  console.log("HEALTHITUDE: FIREBASE GOOGLE AUTHENTICATION VERIFICATION TESTS")
  console.log("================================================================================")

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase Admin environment variables are not configured in server/.env")
  }
  console.log("✓ Check 1 Passed: Firebase Admin SDK credentials detected in server/.env.")

  const app = createApp()
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port

  try {
    // Check 2: Patient Google Auth rejects missing token with 401
    const r1 = await postJson(port, "/api/auth/google", {})
    if (r1.status !== 401) {
      throw new Error(`Expected 401 for missing token on /api/auth/google, got ${r1.status}`)
    }
    console.log("✓ Check 2 Passed: POST /api/auth/google rejects missing token (401).")

    // Check 3: Patient Google Auth cryptographically rejects forged/invalid JWT with 401
    const r2 = await postJson(port, "/api/auth/google", {
      idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZha2VAZXhhbXBsZS5jb20ifQ.invalid_sig_1234567890",
    })
    if (r2.status !== 401) {
      throw new Error(`Expected 401 for forged token on /api/auth/google, got ${r2.status}: ${JSON.stringify(r2.body)}`)
    }
    console.log("✓ Check 3 Passed: POST /api/auth/google cryptographically rejects forged JWT via Firebase Admin (401).")

    // Check 4: Patient Google Register rejects invalid token with 401
    const r3 = await postJson(port, "/api/auth/google/register", {
      idToken: "invalid-token-value-12345678901234567890",
    })
    if (r3.status !== 401) {
      throw new Error(`Expected 401 on /api/auth/google/register, got ${r3.status}`)
    }
    console.log("✓ Check 4 Passed: POST /api/auth/google/register rejects invalid token (401).")

    // Check 5: Professional Google Auth rejects invalid token with 401
    const r4 = await postJson(port, "/api/professional/google", {
      idToken: "invalid-token-value-12345678901234567890",
    })
    if (r4.status !== 401) {
      throw new Error(`Expected 401 on /api/professional/google, got ${r4.status}`)
    }
    console.log("✓ Check 5 Passed: POST /api/professional/google rejects invalid token (401).")

    // Check 6: Professional Google Register rejects invalid token with 401
    const r5 = await postJson(port, "/api/professional/google/register", {
      idToken: "invalid-token-value-12345678901234567890",
    })
    if (r5.status !== 401) {
      throw new Error(`Expected 401 on /api/professional/google/register, got ${r5.status}`)
    }
    console.log("✓ Check 6 Passed: POST /api/professional/google/register rejects invalid token (401).")

    console.log("\n================================================================================")
    console.log("ALL 6 FIREBASE GOOGLE AUTH CHECKS PASSED SUCCESSFULLY (100%)")
    console.log("================================================================================")
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

runFirebaseGoogleAuthTests().catch((err) => {
  console.error("FATAL: Firebase Google Auth tests failed:", err)
  process.exit(1)
})
