import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { generateAngitiaHealthResponse } from "../services/aiService"

export const aiRouter = Router()

const AngitiaChatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "model"]),
        text: z.string().max(2000),
      }),
    )
    .optional()
    .default([]),
})

/**
 * POST /api/ai/angitia
 * Public endpoint for Angitia AI health assistant.
 * Powered by Google Gemini Flash with strict health-domain guidance and comforting tone.
 */
aiRouter.post(
  "/angitia",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AngitiaChatSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid chat payload",
        })
        return
      }

      const { message, history } = parsed.data
      const result = await generateAngitiaHealthResponse(message, history)

      res.status(200).json({
        status: "success",
        data: {
          reply: result.text,
          source: result.source,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      next(error)
    }
  },
)

/**
 * GET /api/ai/models
 * Returns the exact models supported by the user's API key directly from Google.
 */
aiRouter.get("/models", async (_req: Request, res: Response) => {
  const rawKey =
    process.env.ANGITIA ||
    process.env.ANGITIA_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "")

  if (!apiKey) {
    res.status(200).json({ error: "No API key configured" })
    return
  }

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { headers: { "x-goog-api-key": apiKey } },
    )
    const data = await listRes.json()
    const names = (data.models || []).map((m: any) => ({
      name: m.name?.replace("models/", ""),
      displayName: m.displayName,
      supportedActions: m.supportedGenerationMethods,
    }))
    res.status(200).json({
      status: listRes.status,
      count: names.length,
      models: names,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
aiRouter.get("/status", (_req: Request, res: Response) => {
  const rawKey =
    process.env.ANGITIA ||
    process.env.ANGITIA_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  const keyDetected = Boolean(rawKey && rawKey.trim().length > 5)
  const keySource = process.env.ANGITIA
    ? "ANGITIA"
    : process.env.ANGITIA_API_KEY
      ? "ANGITIA_API_KEY"
      : process.env.GEMINI_API_KEY
        ? "GEMINI_API_KEY"
        : "NONE"

  res.status(200).json({
    status: "ok",
    service: "Angitia AI Health Companion",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    apiKeyConfigured: keyDetected,
    keySource,
    active: true,
  })
})

/**
 * GET /api/ai/diagnostics
 * Safe diagnostic endpoint to verify Google Gemini API response.
 */
aiRouter.get("/diagnostics", async (_req: Request, res: Response) => {
  const rawKey =
    process.env.ANGITIA ||
    process.env.ANGITIA_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "")

  if (!apiKey) {
    res.status(200).json({
      configured: false,
      message: "No API key found in ANGITIA or GEMINI_API_KEY",
    })
    return
  }

  const requestedModel =
    typeof _req.query.model === "string" ? _req.query.model : undefined
  const model = requestedModel || "gemini-3.8-flash"

  // 1. Try modern Interactions API
  let interactionsResult: any = null
  try {
    const interRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          model,
          input: "Hello, reply in one sentence.",
        }),
      },
    )
    const text = await interRes.text()
    try {
      interactionsResult = {
        httpStatus: interRes.status,
        ok: interRes.ok,
        body: JSON.parse(text),
      }
    } catch {
      interactionsResult = { httpStatus: interRes.status, ok: interRes.ok, raw: text }
    }
  } catch (err: any) {
    interactionsResult = { error: err.message }
  }

  // 2. Try generateContent
  let generateContentResult: any = null
  try {
    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        }),
      },
    )
    const text = await genRes.text()
    try {
      generateContentResult = {
        httpStatus: genRes.status,
        ok: genRes.ok,
        body: JSON.parse(text),
      }
    } catch {
      generateContentResult = { httpStatus: genRes.status, ok: genRes.ok, raw: text }
    }
  } catch (err: any) {
    generateContentResult = { error: err.message }
  }

  res.status(200).json({
    keyMasked: apiKey.slice(0, 6) + "..." + apiKey.slice(-4),
    keyLength: apiKey.length,
    modelTested: model,
    interactionsApi: interactionsResult,
    generateContentApi: generateContentResult,
  })
})
