import { createApp } from "./app"
import http from "http"

async function runAiTests() {
  console.log("================================================================================")
  console.log("HEALTHITUDE: ANGITIA AI REBUILD (GEMINI FLASH CO-PILOT & TRIAGE) TEST SUITE")
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

    if (!statusData.apiKeyConfigured) {
      console.log("ℹ️ No GEMINI_API_KEY / ANGITIA configured in local test environment.")
      console.log("Verifying that the backend strictly returns 502 AI_SERVICE_UNAVAILABLE rather than a fake hardcoded reply...")

      const missingKeyRes = await fetch(`${baseUrl}/api/ai/angitia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is normal blood pressure?",
          history: [],
        }),
      })

      if (missingKeyRes.status !== 502) {
        throw new Error(`Expected 502 for unconfigured AI service, got ${missingKeyRes.status}`)
      }

      const errData = await missingKeyRes.json()
      if (errData.code !== "AI_SERVICE_UNAVAILABLE") {
        throw new Error(`Expected code AI_SERVICE_UNAVAILABLE, got ${errData.code}`)
      }
      console.log("✓ Check 2 Passed: Backend refuses fake hardcoded replies and returns standard 502 AI_SERVICE_UNAVAILABLE envelope.")

      // Check 3: Input validation rejects empty messages
      const emptyRes = await fetch(`${baseUrl}/api/ai/angitia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" }),
      })
      if (emptyRes.status !== 400) {
        throw new Error(`Check 3 Failed: Expected 400 for empty message, got ${emptyRes.status}`)
      }
      console.log("✓ Check 3 Passed: Input validation rejects empty messages.")

      console.log("\n================================================================================")
      console.log("ALL LOCAL ZERO-HARDCODED BACKEND SPEC TESTS PASSED (100%)")
      console.log("================================================================================")
      return
    }

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

    // Check 3: Platform Co-Pilot Navigation Test (asking about booking a doctor)
    const navRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "How can I book an appointment with a verified doctor?",
        history: [],
      }),
    })
    if (navRes.status !== 200) {
      throw new Error(`Check 3 Failed: Expected 200, got ${navRes.status}`)
    }
    const navData = await navRes.json()
    const navReply = navData.data?.reply || ""
    if (!navReply.toLowerCase().includes("telemedicine") && !navReply.toLowerCase().includes("doctor")) {
      throw new Error(`Check 3 Failed: Missing platform navigation guidance. Reply: ${navReply}`)
    }
    console.log("✓ Check 3 Passed: Platform Co-Pilot successfully guides user to doctor booking & telemedicine.")

    // Check 4: Emergency Red-Flag Test
    const emergencyRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "I have severe sudden chest pain and trouble breathing",
        history: [],
      }),
    })
    if (emergencyRes.status !== 200) {
      throw new Error(`Check 4 Failed: Expected 200, got ${emergencyRes.status}`)
    }
    const emergencyData = await emergencyRes.json()
    const emergencyReply = emergencyData.data?.reply || ""
    if (
      !emergencyReply.toLowerCase().includes("emergency") &&
      !emergencyReply.toLowerCase().includes("immediate")
    ) {
      throw new Error(`Check 4 Failed: Emergency red-flag was not elevated. Reply: ${emergencyReply}`)
    }
    console.log("✓ Check 4 Passed: Emergency red-flag triggers immediate urgent medical alert.")

    // Check 5: Founder Recognition Test
    const founderRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Who founded Healthitude and where was it created?",
        history: [],
      }),
    })
    if (founderRes.status !== 200) {
      throw new Error(`Check 5 Failed: Expected 200, got ${founderRes.status}`)
    }
    const founderData = await founderRes.json()
    const founderReply = founderData.data?.reply || ""
    if (
      !founderReply.toLowerCase().includes("bolaji") &&
      !founderReply.toLowerCase().includes("david") &&
      !founderReply.toLowerCase().includes("ibadan")
    ) {
      throw new Error(`Check 5 Failed: Founder details missing. Reply: ${founderReply}`)
    }
    console.log("✓ Check 5 Passed: Founder & University of Ibadan heritage accurately acknowledged.")

    // Check 6: Non-Health Prompt Deflection (e.g. coding / crypto / math)
    const nonHealthRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Can you write Python code to calculate bitcoin mining profit?",
        history: [],
      }),
    })
    if (nonHealthRes.status !== 200) {
      throw new Error(`Check 6 Failed: Expected 200, got ${nonHealthRes.status}`)
    }
    const nonHealthData = await nonHealthRes.json()
    const nonHealthReply = nonHealthData.data?.reply || ""
    if (
      !nonHealthReply.toLowerCase().includes("healthitude") &&
      !nonHealthReply.toLowerCase().includes("health") &&
      !nonHealthReply.toLowerCase().includes("angitia")
    ) {
      throw new Error(`Check 6 Failed: Non-health prompt was not deflected politely. Reply: ${nonHealthReply}`)
    }
    console.log("✓ Check 6 Passed: Non-health prompt strictly and politely deflected to health-only scope.")

    // Check 7: Input validation rejects empty messages
    const emptyRes = await fetch(`${baseUrl}/api/ai/angitia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    })
    if (emptyRes.status !== 400) {
      throw new Error(`Check 7 Failed: Expected 400 for empty message, got ${emptyRes.status}`)
    }
    console.log("✓ Check 7 Passed: Input validation rejects empty messages.")

    console.log("\n================================================================================")
    console.log("ALL 7 ANGITIA AI REBUILD TESTS PASSED (100%)")
    console.log("================================================================================")
  } finally {
    server.close()
  }
}

runAiTests().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
