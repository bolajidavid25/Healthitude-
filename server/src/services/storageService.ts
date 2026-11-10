import fs from "fs"
import path from "path"
import { env } from "../config/env"
import {
  generateServerFilename,
  assertSafeFilename,
} from "../utils/fileValidation"

export type StorageCategory = "avatars" | "documents"

export interface StoredFileResult {
  filename: string
  storageKey: string
  absolutePath: string
  publicUrl: string
}

/**
 * Initializes and ensures storage subdirectories exist.
 */
export function ensureStorageDirectories(): void {
  const root = path.resolve(env.UPLOAD_DIR)
  const avatarsDir = path.join(root, "avatars")
  const documentsDir = path.join(root, "documents")

  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true })
  }
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true })
  }
}

/**
 * Strips category prefix if present (e.g., 'avatars/avatar_123.jpg' -> 'avatar_123.jpg')
 */
export function extractFilename(
  category: StorageCategory,
  keyOrFilename: string,
): string {
  const normalized = keyOrFilename.replace(/\\/g, "/")
  const prefix = `${category}/`
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length)
  }
  return normalized
}

/**
 * Stores a file buffer to disk using a cryptographically random, server-controlled filename.
 * Rule E & F: Server-controlled filename and isolated disk paths.
 * Rule G: Path traversal prevention.
 */
export async function saveFile(
  category: StorageCategory,
  fileBuffer: Buffer,
  extension: string,
  userId: string,
): Promise<StoredFileResult> {
  ensureStorageDirectories()

  const prefix = category === "avatars" ? "avatar" : "doc"
  const filename = generateServerFilename(prefix, userId, extension)
  assertSafeFilename(filename)

  const categoryDir = path.resolve(env.UPLOAD_DIR, category)
  const targetPath = path.resolve(categoryDir, filename)

  // Guarantee canonical path stays within category directory (Rule G)
  if (!targetPath.startsWith(categoryDir)) {
    throw new Error(
      "Security violation: path traversal detected during file save",
    )
  }

  // Write file to disk
  await fs.promises.writeFile(targetPath, fileBuffer)

  const storageKey = `${category}/${filename}`
  const publicUrl =
    category === "avatars"
      ? "/api/patient/profile-photo"
      : "/api/patient/category-document"

  return {
    filename,
    storageKey,
    absolutePath: targetPath,
    publicUrl,
  }
}

/**
 * Retrieves the verified absolute filesystem path for a stored file.
 * Returns null if the file does not exist.
 */
export async function getFilePath(
  category: StorageCategory,
  keyOrFilename: string,
): Promise<string | null> {
  const filename = extractFilename(category, keyOrFilename)
  assertSafeFilename(filename)

  const categoryDir = path.resolve(env.UPLOAD_DIR, category)
  const targetPath = path.resolve(categoryDir, filename)

  // Path containment check (Rule G)
  if (!targetPath.startsWith(categoryDir)) {
    return null
  }

  try {
    await fs.promises.access(targetPath, fs.constants.R_OK)
    return targetPath
  } catch {
    return null
  }
}

/**
 * Safely unlinks a file from disk.
 * Rule P: Cleanup of replaced or orphaned files.
 */
export async function deleteFile(
  category: StorageCategory,
  keyOrFilename: string,
): Promise<boolean> {
  const targetPath = await getFilePath(category, keyOrFilename)
  if (!targetPath) {
    return false
  }

  try {
    await fs.promises.unlink(targetPath)
    return true
  } catch (error) {
    console.warn(`[StorageService] Failed to unlink file ${targetPath}:`, error)
    return false
  }
}

/**
 * Safely cleans up a newly created file if subsequent database operations fail.
 * Rule P & Check 11: Rollback / file cleanup on DB failure.
 */
export async function cleanupOrphanedFile(absolutePath: string): Promise<void> {
  try {
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath)
    }
  } catch (error) {
    console.warn(
      `[StorageService] Failed to clean up orphaned file ${absolutePath}:`,
      error,
    )
  }
}
