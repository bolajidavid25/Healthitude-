import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { createHealthRouter } from "./routes/health"
import http from "http"

async function makeRequest(
  port: number,
  path: string,
  method = "GET",
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: { "Content-Type": "application/json" },
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
          resolve({ status: res.statusCode || 500, body: parsedBody })
        })
      },
    )
    req.on("error", reject)
    req.end()
  })
}

async function runFoundationChecks() {
  console.log("==================================================")
  console.log("RUNNING BACKEND FOUNDATION & HEALTH CHECKS")
  console.log("==================================================")

  const testApp = createApp()
  const testPort = 5055 // Dedicated port for automated check

  const server = testApp.listen(testPort)
  await new Promise((r) => setTimeout(r, 100))
  console.log(`[Test Server] Started on http://127.0.0.1:${testPort}`)

  try {
    // 1. Root Service Ping
    console.log("\n--- Check 1: Root Service Ping (GET /) ---")
    const rootRes = await makeRequest(testPort, "/")
    console.log("HTTP Status:", rootRes.status)
    console.log("Response Body:", JSON.stringify(rootRes.body, null, 2))
    if (rootRes.status !== 200 || rootRes.body.status !== "ok") {
      throw new Error("Root service ping failed")
    }

    // 2. Liveness Check (GET /api/health/live)
    console.log("\n--- Check 2: Liveness Probe (GET /api/health/live) ---")
    const liveRes = await makeRequest(testPort, "/api/health/live")
    console.log("HTTP Status:", liveRes.status)
    console.log("Response Body:", JSON.stringify(liveRes.body, null, 2))
    if (
      liveRes.status !== 200 ||
      liveRes.body.check !== "liveness" ||
      liveRes.body.status !== "ok"
    ) {
      throw new Error("Liveness check failed")
    }

    // 3. Database Readiness Check (GET /api/health/ready) - Database Connected
    console.log(
      "\n--- Check 3: Database Readiness Probe (GET /api/health/ready) ---",
    )
    const readyRes = await makeRequest(testPort, "/api/health/ready")
    console.log("HTTP Status:", readyRes.status)
    console.log("Response Body:", JSON.stringify(readyRes.body, null, 2))
    if (
      readyRes.status !== 200 ||
      readyRes.body.check !== "readiness" ||
      readyRes.body.database?.status !== "connected" ||
      typeof readyRes.body.database?.latencyMs !== "number"
    ) {
      throw new Error("Database readiness check failed")
    }

    // 4. Combined Health Check (GET /api/health)
    console.log("\n--- Check 4: Combined Health Summary (GET /api/health) ---")
    const healthRes = await makeRequest(testPort, "/api/health")
    console.log("HTTP Status:", healthRes.status)
    console.log("Response Body:", JSON.stringify(healthRes.body, null, 2))
    if (
      healthRes.status !== 200 ||
      healthRes.body.status !== "ok" ||
      healthRes.body.database?.status !== "connected"
    ) {
      throw new Error("Combined health check failed")
    }

    // 5. 404 Route Handling (GET /api/nonexistent)
    console.log(
      "\n--- Check 5: Unmatched Route 404 Handling (GET /api/nonexistent) ---",
    )
    const notFoundRes = await makeRequest(testPort, "/api/nonexistent")
    console.log("HTTP Status:", notFoundRes.status)
    console.log("Response Body:", JSON.stringify(notFoundRes.body, null, 2))
    if (notFoundRes.status !== 404 || notFoundRes.body.status !== "error") {
      throw new Error("404 handler failed")
    }

    // 6. Controlled Database Failure Simulation (Rule J, K, I)
    console.log("\n--- Check 6: Controlled Database Disconnection Probe ---")
    const failingPort = 5056
    const failingHealthRouter = createHealthRouter(async () => {
      throw new Error(
        "Simulated connection timeout to postgresql://postgres:secret@localhost:5432/healthitude_db",
      )
    })
    const failingApp = createApp({ healthRouter: failingHealthRouter })
    const failingServer = failingApp.listen(failingPort)
    await new Promise((r) => setTimeout(r, 100))

    try {
      const simulatedFailureRes = await makeRequest(
        failingPort,
        "/api/health/ready",
      )
      console.log("HTTP Status (Expected 503):", simulatedFailureRes.status)
      console.log(
        "Response Body (Sanitized):",
        JSON.stringify(simulatedFailureRes.body, null, 2),
      )

      if (simulatedFailureRes.status !== 503) {
        throw new Error(
          `Expected 503 on database failure, got ${simulatedFailureRes.status}`,
        )
      }
      if (simulatedFailureRes.body.database?.status !== "disconnected") {
        throw new Error("Database status should be disconnected")
      }

      // Rule I: Ensure no credentials or connection string leaked
      const serialized = JSON.stringify(simulatedFailureRes.body)
      if (
        serialized.includes("postgres:") ||
        serialized.includes("secret") ||
        serialized.includes("5432")
      ) {
        throw new Error(
          "SECURITY VIOLATION: Database connection details leaked in client error response!",
        )
      }
      console.log(
        "Confirmed: No credentials, connection strings, or stack traces exposed to client.",
      )
    } finally {
      await new Promise<void>((resolve) => {
        failingServer.close(() => resolve())
      })
    }

    console.log("\nAll foundation checks passed successfully!")
  } finally {
    // 7. Clean Shutdown Verification
    console.log("\n--- Check 7: Clean Shutdown Verification ---")
    await new Promise<void>((resolve) => {
      server.close(async () => {
        console.log("[Test Server] HTTP server closed.")
        await prisma.$disconnect()
        console.log("[Test Server] Prisma disconnected cleanly.")
        resolve()
      })
    })
  }
}

runFoundationChecks().catch((err) => {
  console.error("Foundation checks failed:", err)
  process.exit(1)
})
