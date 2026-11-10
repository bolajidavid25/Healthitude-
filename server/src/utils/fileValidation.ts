import path from "path"
import crypto from "crypto"
import { AppError } from "../errors/AppError"

export type AllowedMimeType = "image/jpeg" | "image/png" | "application/pdf"

export interface InspectedFile {
  isValid: boolean
  mimeType?: AllowedMimeType
  extension?: "jpg" | "png" | "pdf"
  error?: string
  isMisleadingExtension?: boolean
}

/**
 * Validates file buffer by inspecting magic bytes / content signatures.
 * Rule B & D: Content inspection ensures file contains real binary format,
 * preventing execution of disguised scripts or misleading extensions.
 */
export function inspectFileContent(
  buffer: Buffer,
  originalFilename?: string,
): InspectedFile {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: "File is empty (0 bytes)",
    }
  }

  // 1. JPEG Magic Bytes: 0xFF 0xD8 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return verifyDeclaredExtension(originalFilename, "image/jpeg", "jpg")
  }

  // 2. PNG Magic Bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 && // P
    buffer[2] === 0x4e && // N
    buffer[3] === 0x47 && // G
    buffer[4] === 0x0d && // \r
    buffer[5] === 0x0a && // \n
    buffer[6] === 0x1a && // EOF
    buffer[7] === 0x0a // \n
  ) {
    return verifyDeclaredExtension(originalFilename, "image/png", "png")
  }

  // 3. PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 // F
  ) {
    return verifyDeclaredExtension(originalFilename, "application/pdf", "pdf")
  }

  // Content did not match any allowed binary signature
  return {
    isValid: false,
    error:
      "File content signature does not match any supported format (JPEG, PNG, PDF)",
  }
}

/**
 * Checks whether the original filename's declared extension matches detected content.
 */
function verifyDeclaredExtension(
  originalFilename: string | undefined,
  detectedMime: AllowedMimeType,
  detectedExt: "jpg" | "png" | "pdf",
): InspectedFile {
  if (!originalFilename) {
    return { isValid: true, mimeType: detectedMime, extension: detectedExt }
  }

  const rawExt = path.extname(originalFilename).toLowerCase().replace(/^\./, "")
  const normalizedRawExt = rawExt === "jpeg" ? "jpg" : rawExt

  if (normalizedRawExt && normalizedRawExt !== detectedExt) {
    return {
      isValid: false,
      mimeType: detectedMime,
      extension: detectedExt,
      isMisleadingExtension: true,
      error: `File extension '.${rawExt}' does not match detected file format '.${detectedExt}'`,
    }
  }

  return { isValid: true, mimeType: detectedMime, extension: detectedExt }
}

/**
 * Validates that a profile photo matches size (<= 2 MB) and format (JPG/PNG).
 * Rule C: Maximum 2 MB profile photo size limit.
 */
export function validateProfilePhotoUpload(
  buffer: Buffer,
  originalFilename?: string,
): { mimeType: "image/jpeg" | "image/png"; extension: "jpg" | "png" } {
  // 1. Empty file check
  if (!buffer || buffer.length === 0) {
    throw AppError.emptyFile("Profile photo file cannot be empty")
  }

  // 2. Size limit check (2 MB = 2,097,152 bytes)
  const MAX_AVATAR_SIZE = 2 * 1024 * 1024
  if (buffer.length > MAX_AVATAR_SIZE) {
    throw AppError.fileTooLarge(
      "Profile photo exceeds maximum permitted size of 2 MB",
    )
  }

  // 3. Inspect original filename extension before content check
  if (originalFilename) {
    const rawExt = path
      .extname(originalFilename)
      .toLowerCase()
      .replace(/^\./, "")
    const allowedExts = new Set(["jpg", "jpeg", "png"])
    if (rawExt && !allowedExts.has(rawExt)) {
      throw AppError.unsupportedFileType(
        `Unsupported file type '.${rawExt}'. Only JPG and PNG images are allowed for profile photos.`,
      )
    }
  }

  // 4. Magic bytes content inspection
  const inspected = inspectFileContent(buffer, originalFilename)
  if (!inspected.isValid) {
    if (inspected.isMisleadingExtension) {
      throw AppError.invalidFileContent(
        inspected.error || "File has a misleading extension",
      )
    }
    throw AppError.invalidFileContent(
      inspected.error || "File content does not match valid JPEG or PNG format",
    )
  }

  // 5. PDF not allowed for avatars
  if (inspected.mimeType === "application/pdf") {
    throw AppError.unsupportedFileType(
      "PDF documents are not supported as profile photos",
    )
  }

  return {
    mimeType: inspected.mimeType as "image/jpeg" | "image/png",
    extension: inspected.extension as "jpg" | "png",
  }
}

/**
 * Validates that a supporting document matches size (<= 5 MB) and format (JPG/PNG/PDF).
 */
export function validateSupportingDocumentUpload(
  buffer: Buffer,
  originalFilename?: string,
): { mimeType: AllowedMimeType; extension: "jpg" | "png" | "pdf" } {
  // 1. Empty file check
  if (!buffer || buffer.length === 0) {
    throw AppError.emptyFile("Supporting document file cannot be empty")
  }

  // 2. Size limit check (5 MB = 5,242,880 bytes)
  const MAX_DOC_SIZE = 5 * 1024 * 1024
  if (buffer.length > MAX_DOC_SIZE) {
    throw AppError.fileTooLarge(
      "Supporting document exceeds maximum permitted size of 5 MB",
    )
  }

  // 3. Check declared extension
  if (originalFilename) {
    const rawExt = path
      .extname(originalFilename)
      .toLowerCase()
      .replace(/^\./, "")
    const allowedExts = new Set(["jpg", "jpeg", "png", "pdf"])
    if (rawExt && !allowedExts.has(rawExt)) {
      throw AppError.unsupportedFileType(
        `Unsupported document type '.${rawExt}'. Allowed formats: PDF, JPG, PNG.`,
      )
    }
  }

  // 4. Magic bytes content inspection
  const inspected = inspectFileContent(buffer, originalFilename)
  if (!inspected.isValid) {
    if (inspected.isMisleadingExtension) {
      throw AppError.invalidFileContent(
        inspected.error || "File has a misleading extension",
      )
    }
    throw AppError.invalidFileContent(
      inspected.error ||
        "File content does not match valid PDF, JPEG, or PNG format",
    )
  }

  return {
    mimeType: inspected.mimeType!,
    extension: inspected.extension!,
  }
}

/**
 * Generates an immutable, server-controlled filename with cryptographic uniqueness.
 * Rule E & F: Prevents client filename manipulation, collisions, and path traversal.
 */
export function generateServerFilename(
  prefix: "avatar" | "doc",
  userId: string,
  extension: string,
): string {
  // Sanitize userId to safe alphanumeric/hyphens
  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, "")
  const randomSuffix = crypto.randomUUID()
  const safeExt = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()

  return `${prefix}_${safeUserId}_${randomSuffix}.${safeExt}`
}

/**
 * Validates that a stored file key or filename contains no directory traversal characters.
 * Rule G: Path traversal prevention.
 */
export function assertSafeFilename(filename: string): void {
  if (!filename || typeof filename !== "string") {
    throw AppError.badRequest("Invalid filename")
  }

  // Reject directory separators and parent directory references
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    throw AppError.forbidden("Path traversal detected in file request")
  }

  // Must match strict alphanumeric + underscores + hyphens + period
  if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    throw AppError.badRequest("Invalid filename characters")
  }
}
