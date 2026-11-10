import express, { Express, Request, Response, Router } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { env } from "./config/env"
import { healthRouter as defaultHealthRouter } from "./routes/health"
import { patientRouter } from "./routes/patient"
import { authRouter } from "./routes/auth"
import { professionalRouter as defaultProfessionalRouter } from "./routes/professional"
import { adminRouter as defaultAdminRouter } from "./routes/admin"
import { notFoundHandler, errorHandler } from "./middleware/errorHandler"

export interface AppOptions {
  healthRouter?: Router
  patientRouter?: Router
  authRouter?: Router
  professionalRouter?: Router
  adminRouter?: Router
}

/**
 * Creates and configures the Express application.
 * Rule H: Request parsing, route mounting, and error middleware in predictable order.
 * Rule J & K: Configured CORS for approved frontend origin with credentials.
 */
export function createApp(options?: AppOptions): Express {
  const app = express()

  // 1. Security & CORS (Rule J, K: Explicit origin with credentials, no wildcard)
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  )

  // 2. Request body & Cookie parsing
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  // 3. Root service ping
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "Healthitude API",
      message: "Healthitude API operational",
      version: "1.0.0",
    })
  })

  // 4. Mount Health Routes (Liveness and Readiness probes)
  const health = options?.healthRouter || defaultHealthRouter
  app.use("/api/health", health)

  // 5. Mount Authentication & Session Routes
  const auth = options?.authRouter || authRouter
  app.use("/api/auth", auth)

  // 6. Mount Patient Onboarding & Profile Routes
  const patients = options?.patientRouter || patientRouter
  app.use("/api/patients", patients)
  app.use("/api/patient", patients)

  // 7. Mount Professional Authentication, Profile & Clinical Gating Routes
  const professional = options?.professionalRouter || defaultProfessionalRouter
  app.use("/api/professional", professional)

  // 8. Mount Administrator Portal Subsystem Routes
  const admin = options?.adminRouter || defaultAdminRouter
  app.use("/api/admin", admin)

  // 9. 404 Fallback for unmatched routes
  app.use(notFoundHandler)

  // 10. Centralized Error Handler (Rule I: No stack traces or internals exposed)
  app.use(errorHandler)

  return app
}

export const app = createApp()
