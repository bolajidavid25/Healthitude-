import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const currentDir =
  import.meta.dirname || path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, "../.env") })
dotenv.config()

import { prisma } from "./config/prisma"

async function main() {
  try {
    const tables = await prisma.$queryRaw<any[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    console.log("=== TABLES IN PUBLIC SCHEMA ===")
    console.log(JSON.stringify(tables, null, 2))

    for (const row of tables) {
      const tableName = row.table_name
      const countResult: any[] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "${tableName}"`,
      )
      console.log(`Table ${tableName} row count:`, countResult[0]?.count)

      const columns: any[] = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `
      console.log(
        `Table ${tableName} columns:`,
        columns
          .map(
            (c: any) =>
              `${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`,
          )
          .join(", "),
      )
    }

    const enums = await prisma.$queryRaw<any[]>`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY enum_name, e.enumsortorder;
    `
    console.log("=== ENUMS IN PUBLIC SCHEMA ===")
    console.log(JSON.stringify(enums, null, 2))
  } catch (error) {
    console.error("Error inspecting database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
