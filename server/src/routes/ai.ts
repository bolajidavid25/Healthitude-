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
 * GET /api/ai/status
 * Quick health-check for Angitia AI service.
 */
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
