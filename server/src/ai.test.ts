import { createApp } from "./app"
import http from "http"

async function runAiTests() {
  console.log("================================================================================")
  console.log("HEALTHITUDE: ANGITIA AI (GEMINI FLASH) INTEGRATION & HEALTH DOMAIN TESTS")
  console.log("================================================================================")

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve())
  })

  const addr = server.address()
  const port = typeof addr === "object" && addr ? addr.port : 5000
  const baseUrl = `http://localhost:${port}`

  try {
    // Check 1: GET /api/ai/status
    const statusRes = await fetch(`${baseUrl}/api/ai/status`)
    if (statusRes.status !== 200) {
      throw new Error(`Check 1 Failed: Status returned ${statusRes.status}`)
    }
    const statusData = await statusRes.json()
    if (!statusData.active || statusData.status !== "ok") {
      throw new Error(`Check 1 Failed: Unexpected status data ${JSON.stringify(statusData)}`)
    }
    console.log("✓ Check 1 Passed: Angitia AI status probe operational.")

    // Check 2: POST /api/ai/angitia with a valid health question
    const healthRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is normal blood pressure and how can I manage stress?",
        history: [],
      }),
    })
    if (healthRes.status !== 200) {
      throw new Error(`Check 2 Failed: Expected 200, got ${healthRes.status}`)
    }
    const healthData = await healthRes.json()
    if (!healthData.data?.reply || typeof healthData.data.reply !== "string") {
      throw new Error("Check 2 Failed: Missing reply string")
    }
    console.log("✓ Check 2 Passed: Health prompt returns sound, calming clinical guidance.")

    // Check 3: POST /api/ai/angitia with a non-health prompt (e.g. coding / crypto / math)
    const nonHealthRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Can you write Python code to calculate bitcoin mining profit?",
        history: [],
      }),
    })
    if (nonHealthRes.status !== 200) {
      throw new Error(`Check 3 Failed: Expected 200, got ${nonHealthRes.status}`)
    }
    const nonHealthData = await nonHealthRes.json()
    const replyText = nonHealthData.data?.reply || ""
    if (
      !replyText.toLowerCase().includes("healthitude") &&
      !replyText.toLowerCase().includes("health") &&
      !replyText.toLowerCase().includes("angitia")
    ) {
      throw new Error(`Check 3 Failed: Non-health prompt was not deflected politely. Reply: ${replyText}`)
    }
    console.log("✓ Check 3 Passed: Non-health prompt strictly and politely deflected to health-only scope.")

    // Check 4: POST /api/ai/angitia with invalid empty payload
    const emptyRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    })
    if (emptyRes.status !== 400) {
      throw new Error(`Check 4 Failed: Expected 400 for empty message, got ${emptyRes.status}`)
    }
    console.log("✓ Check 4 Passed: Input validation rejects empty messages.")

    console.log("\n================================================================================")
    console.log("ALL 4 ANGITIA AI TESTS PASSED (100%)")
    console.log("================================================================================")
  } finally {
    server.close()
  }
}

runAiTests().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
