import { Router, Request, Response } from "express"
import { checkDatabaseHealth } from "../config/prisma"

export type DatabaseHealthChecker = () => Promise<{
  ok: boolean
  latencyMs: number
}>

/**
 * Factory function to create health router with configurable checker (useful for controlled failure testing).
 */
export function createHealthRouter(
  dbChecker: DatabaseHealthChecker = checkDatabaseHealth,
): Router {
  const router = Router()

  /**
   * Liveness probe: reports if the HTTP server process is running and responding.
   * Rule J: Reports whether the service is alive.
   */
  router.get("/live", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "healthitude-api",
      check: "liveness",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  /**
   * Readiness probe: checks if the database is reachable via Prisma.
   * Rule J & K: Reports whether the database can be reached; does not assume
   * health merely because Express is running.
   * Rule I: Never expose credentials, connection strings, or stack traces on failure.
   */
  router.get("/ready", async (req: Request, res: Response) => {
    try {
      const dbHealth = await dbChecker()
      res.status(200).json({
        status: "ok",
        service: "healthitude-api",
        check: "readiness",
        database: {
          status: "connected",
          latencyMs: dbHealth.latencyMs,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      // Log failure reason internally on server
      console.error("[Readiness Check Failed]:", error.message || error)

      // Rule I: Return safe, sanitized response to client
      res.status(503).json({
        status: "error",
        service: "healthitude-api",
        check: "readiness",
        database: {
          status: "disconnected",
        },
        message: "Database readiness check failed",
        timestamp: new Date().toISOString(),
      })
    }
  })

  /**
   * Combined health endpoint: provides comprehensive liveness and database readiness summary.
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const dbHealth = await dbChecker()
      res.status(200).json({
        status: "ok",
        service: "healthitude-api",
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          latencyMs: dbHealth.latencyMs,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("[Health Check Degraded]:", error.message || error)

      res.status(503).json({
        status: "degraded",
        service: "healthitude-api",
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "disconnected",
        },
        message: "Database is unreachable",
        timestamp: new Date().toISOString(),
      })
    }
  })

  return router
}

export const healthRouter = createHealthRouter()
