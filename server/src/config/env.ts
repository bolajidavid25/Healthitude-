import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Rule F: Load environment configuration before initializing modules that depend on environment variables.
const currentDir =
  import.meta.dirname || path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, "../../.env") })
dotenv.config()

const portNumber = Number(process.env.PORT) || 5000
const nodeEnv = process.env.NODE_ENV || "development"
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    "FATAL: DATABASE_URL is missing from environment configuration.",
  )
}

const uploadDir =
  process.env.UPLOAD_DIR || path.resolve(currentDir, "../../storage/uploads")

export const env = {
  PORT: portNumber,
  NODE_ENV: nodeEnv,
  DATABASE_URL: databaseUrl,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  UPLOAD_DIR: uploadDir,
} as const

export type EnvConfig = typeof env
