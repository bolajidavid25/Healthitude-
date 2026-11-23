import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../config/prisma"
import { authenticate } from "../middleware/authenticate"
import { generateAngitiaHealthResponse } from "../services/aiService"
import { SESSION_COOKIE_NAME, hashSessionToken } from "../utils/session"

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

const SaveChatSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(1000).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "model"]),
      text: z.string(),
      time: z.string().optional(),
    }),
  ).min(1, "At least one message is required"),
})

/**
 * Optional helper to detect logged-in patient without throwing 401
 */
async function detectLoggedInUser(req: Request): Promise<{ id: string; firstName: string } | null> {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME]
    if (!rawToken) return null

    const tokenHash = hashSessionToken(rawToken)
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, firstName: true } } },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session.user
  } catch {
    return null
  }
}

/**
 * POST /api/ai/angitia
 * Public endpoint for Angitia AI health assistant and platform co-pilot.
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
      const user = await detectLoggedInUser(req)

      const result = await generateAngitiaHealthResponse(message, history, {
        isLoggedIn: !!user,
        userId: user?.id,
        userName: user?.firstName,
      })

      res.status(200).json({
        status: "success",
        data: {
          reply: result.text,
          source: result.source,
          timestamp: new Date().toISOString(),
          isLoggedIn: !!user,
        },
      })
    } catch (error: any) {
      res.status(502).json({
        status: "error",
        code: "AI_SERVICE_UNAVAILABLE",
        message:
          error.message ||
          "Angitia AI is momentarily unable to reach the medical knowledge base. Please try again shortly.",
      })
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
    service: "Angitia AI Health Companion & Platform Co-Pilot",
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    apiKeyConfigured: keyDetected,
    keySource,
    active: true,
  })
})

/**
 * POST /api/ai/save
 * Authenticated endpoint: Save consultation transcript into patient's health records.
 */
aiRouter.post(
  "/save",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = SaveChatSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message || "Invalid payload",
        })
        return
      }

      const { title, summary, messages } = parsed.data
      const record = await prisma.angitiaChatRecord.create({
        data: {
          userId: req.user!.id,
          title,
          summary: summary || null,
          messages,
        },
      })

      res.status(201).json({
        status: "success",
        message: "Consultation chat saved to your health record",
        data: record,
      })
    } catch (error) {
      next(error)
    }
  },
)

/**
 * GET /api/ai/history
 * Authenticated endpoint: Retrieve saved chat records for logged-in patient.
 */
aiRouter.get(
  "/history",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await prisma.angitiaChatRecord.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      })

      res.status(200).json({
        status: "success",
        data: records,
      })
    } catch (error) {
      next(error)
    }
  },
)

/**
 * DELETE /api/ai/history/:id
 * Authenticated endpoint: Delete a saved chat record.
 */
aiRouter.delete(
  "/history/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const existing = await prisma.angitiaChatRecord.findUnique({
        where: { id },
      })

      if (!existing || existing.userId !== req.user!.id) {
        res.status(404).json({
          status: "error",
          code: "NOT_FOUND",
          message: "Record not found",
        })
        return
      }

      await prisma.angitiaChatRecord.delete({
        where: { id },
      })

      res.status(200).json({
        status: "success",
        message: "Record removed successfully",
      })
    } catch (error) {
      next(error)
    }
  },
)
