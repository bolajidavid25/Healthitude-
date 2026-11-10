import "dotenv/config"

import { prisma } from "./config/prisma"

async function main() {
  try {
    const result = await prisma.$queryRaw<{
      database: string
      current_time: Date
    }[]>`
      SELECT
        current_database() AS database,
        NOW() AS current_time
    `

    console.log("Prisma connection successful!")

    console.table(result)
  } catch (error) {
    console.error("Prisma connection failed:", error)

    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
