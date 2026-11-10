import { env } from "./config/env"
import { app } from "./app"
import { prisma } from "./config/prisma"

/**
 * Main application entry point.
 * Rule B: One clearly defined Express application entry point.
 * Rule F: Environment variables loaded first via ./config/env.
 */
const server = app.listen(env.PORT, () => {
  console.log(
    `[Healthitude API] Server running on http://localhost:${env.PORT} (mode: ${env.NODE_ENV})`,
  )
})

let isShuttingDown = false

/**
 * Rule L: Graceful shutdown handler for HTTP server and Prisma Client.
 */
export async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(
    `\n[Shutdown] Received ${signal}. Initiating graceful shutdown...`,
  )

  server.close(async () => {
    console.log("[Shutdown] HTTP server closed successfully.")
    try {
      await prisma.$disconnect()
      console.log("[Shutdown] Prisma Client disconnected cleanly.")
      process.exit(0)
    } catch (error: any) {
      console.error(
        "[Shutdown] Error disconnecting Prisma Client:",
        error.message || error,
      )
      process.exit(1)
    }
  })

  // Failsafe timeout to prevent hanging connections
  setTimeout(() => {
    console.error("[Shutdown] Shutdown timed out. Forcing termination.")
    process.exit(1)
  }, 10000).unref()
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"))
process.on("SIGINT", () => handleShutdown("SIGINT"))

process.on("unhandledRejection", (reason: any) => {
  console.error(
    "[Fatal] Unhandled Promise Rejection:",
    reason?.message || reason,
  )
})

process.on("uncaughtException", (error: Error) => {
  console.error("[Fatal] Uncaught Exception:", error.message)
  handleShutdown("uncaughtException")
})

export { server }
