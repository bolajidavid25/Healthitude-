import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { createHealthRouter } from "./routes/health"
import { env } from "./config/env"
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
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers,
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
    req.end()
  })
}

async function runStep2Verification() {
  console.log(
    "================================================================================",
  )
  console.log(
    "STEP 2: BACKEND CONFIGURATION & FRONTEND CONNECTIVITY VERIFICATION",
  )
  console.log(
    "================================================================================",
  )

  const testPort = 5058
  const app = createApp()
  const server = app.listen(testPort)
  await new Promise((resolve) => setTimeout(resolve, 150))

  let passed = 0
  let total = 0

  function assert(condition: boolean, name: string, detail?: string) {
    total++
    if (condition) {
      passed++
      console.log(`[PASS] Check ${total}: ${name}`)
      if (detail) console.log(`       Details: ${detail}`)
    } else {
      console.error(`[FAIL] Check ${total}: ${name}`)
      if (detail) console.error(`       Details: ${detail}`)
      throw new Error(`Assertion failed: ${name}`)
    }
  }

  try {
    // Check 1: Port and CORS Origin Configuration
    assert(
      env.PORT === 5000 && env.CORS_ORIGIN === "http://localhost:5173",
      "Environment default ports and CORS origins configured correctly",
      `PORT=${env.PORT}, CORS_ORIGIN=${env.CORS_ORIGIN}, NODE_ENV=${env.NODE_ENV}`,
    )

    // Check 2: Liveness Probe
    const liveRes = await request(testPort, "/api/health/live")
    assert(
      liveRes.status === 200 &&
        liveRes.body.status === "ok" &&
        liveRes.body.check === "liveness",
      "Liveness probe (GET /api/health/live) reports process operational",
      `Status=${liveRes.status}, uptime=${liveRes.body.uptimeSeconds}s`,
    )

    // Check 3: Database Readiness Probe
    const readyRes = await request(testPort, "/api/health/ready")
    assert(
      readyRes.status === 200 &&
        readyRes.body.status === "ok" &&
        readyRes.body.database?.status === "connected" &&
        typeof readyRes.body.database?.latencyMs === "number",
      "Database readiness probe (GET /api/health/ready) verifies PostgreSQL connectivity via Prisma",
      `Status=${readyRes.status}, DB=${readyRes.body.database?.status}, latency=${readyRes.body.database?.latencyMs}ms`,
    )

    // Check 4: Combined Health Endpoint
    const healthRes = await request(testPort, "/api/health")
    assert(
      healthRes.status === 200 &&
        healthRes.body.status === "ok" &&
        healthRes.body.database?.status === "connected",
      "Combined health summary (GET /api/health) returns unified service and DB status",
      `Status=${healthRes.status}, uptime=${healthRes.body.uptimeSeconds}s`,
    )

    // Check 5: Credentialed CORS Headers for Approved Frontend
    const corsRes = await request(testPort, "/api/auth/csrf", "OPTIONS", {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "GET",
    })
    assert(
      corsRes.headers["access-control-allow-origin"] ===
        "http://localhost:5173" &&
        corsRes.headers["access-control-allow-credentials"] === "true",
      "CORS headers permit frontend origin (http://localhost:5173) with credentials enabled",
      `Allow-Origin=${corsRes.headers["access-control-allow-origin"]}, Allow-Credentials=${corsRes.headers["access-control-allow-credentials"]}`,
    )

    // Check 6: CORS Block on Unauthorized Origin
    const unauthCorsRes = await request(testPort, "/api/auth/csrf", "OPTIONS", {
      Origin: "http://untrusted-attacker-site.com",
      "Access-Control-Request-Method": "POST",
    })
    assert(
      unauthCorsRes.headers["access-control-allow-origin"] !==
        "http://untrusted-attacker-site.com" &&
        unauthCorsRes.headers["access-control-allow-origin"] !== "*",
      "CORS strictly rejects unauthorized origin: never reflects rogue origin and never uses wildcard",
      `Allow-Origin header is '${unauthCorsRes.headers["access-control-allow-origin"]}' (strictly restricted to approved origin)`,
    )

    // Check 7: CSRF Token Endpoint & Cookie Attributes
    const csrfRes = await request(testPort, "/api/auth/csrf")
    const setCookieHeaders = csrfRes.headers["set-cookie"] || []
    const csrfCookie = setCookieHeaders.find((c: string) =>
      c.startsWith("healthitude_csrf="),
    )
    assert(
      csrfRes.status === 200 &&
        csrfRes.body.status === "success" &&
        typeof csrfRes.body.csrfToken === "string" &&
        typeof csrfRes.body.data?.csrfToken === "string" &&
        csrfRes.body.csrfToken === csrfRes.body.data?.csrfToken &&
        csrfCookie !== undefined &&
        csrfCookie.includes("SameSite=Lax") &&
        !csrfCookie.includes("HttpOnly"),
      "CSRF issuance (GET /api/auth/csrf) provides dual-envelope token and readable Lax cookie",
      `TokenLength=${csrfRes.body.csrfToken?.length}, Cookie=${csrfCookie?.substring(0, 45)}...`,
    )

    // Check 8: Error Sanitization on Database Disconnection
    const degradedApp = createApp({
      healthRouter: createHealthRouter(async () => {
        throw new Error(
          "Simulated PostgreSQL connection drop: postgresql://postgres:password123@localhost:5432/healthitude_db",
        )
      }),
    })
    const degradedPort = 5059
    const degradedServer = degradedApp.listen(degradedPort)
    await new Promise((resolve) => setTimeout(resolve, 150))

    const degradedRes = await request(degradedPort, "/api/health/ready")
    degradedServer.close()

    const responseStr = JSON.stringify(degradedRes.body)
    assert(
      degradedRes.status === 503 &&
        degradedRes.body.status === "error" &&
        degradedRes.body.database?.status === "disconnected" &&
        !responseStr.includes("password123") &&
        !responseStr.includes("postgresql://") &&
        !responseStr.includes("stack"),
      "Controlled database failure returns sanitized 503 without leaking credentials or internals",
      `Status=${degradedRes.status}, Body=${responseStr}`,
    )

    console.log(
      "================================================================================",
    )
    console.log(
      `ALL ${passed}/${total} STEP 2 CONNECTIVITY & CONFIGURATION CHECKS PASSED!`,
    )
    console.log(
      "================================================================================",
    )
  } finally {
    server.close()
    await prisma.$disconnect()
  }
}

runStep2Verification().catch((err) => {
  console.error("Step 2 verification failed:", err)
  process.exit(1)
})
