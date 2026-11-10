import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"
import { env } from "./env"

// Rule G: Use a single shared Prisma Client instance for the application.
// Rule C: Keep database access inside the Prisma data-access layer.
// Rule D: Do not use pool.query(), direct pg queries, or a second database connection pool.
// Rule E: Do not remove the PostgreSQL driver dependency if Prisma's configured adapter requires it.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
})

export const prisma = new PrismaClient({
  adapter,
})

/**
 * Validates database connectivity through Prisma data-access layer.
 * Rule J & K: Actually queries the database, does not assume health from Express.
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean
  latencyMs: number
}> {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  const latencyMs = Date.now() - start
  return { ok: true, latencyMs }
}
