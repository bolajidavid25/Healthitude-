import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  validateProfilePhotoUpload,
  validateSupportingDocumentUpload,
} from "../utils/fileValidation"
import {
  saveFile,
  deleteFile,
  cleanupOrphanedFile,
  StoredFileResult,
} from "./storageService"
import {
  CategoryVerificationStatus,
  PatientCategory,
} from "../generated/prisma/enums"

export interface UploadServiceOptions {
  /** Optional testing hook for verifying rollback/cleanup upon database failure (Check 11) */
  simulateDbFailure?: boolean
}

/**
 * Validates, saves, and links a profile photo to a patient's account.
 * Rule C: Maximum 2 MB limit.
 * Rule D: Magic bytes content inspection.
 * Rule E & F: Server-controlled filename and isolated disk paths.
 * Rule P & Check 11: Immediate disk cleanup if database operation fails.
 */
export async function uploadPatientProfilePhoto(
  userId: string,
  fileBuffer: Buffer,
  originalFilename?: string,
  options?: UploadServiceOptions,
): Promise<StoredFileResult> {
  // 1. Validate content signature, size, and declared extension
  const { extension } = validateProfilePhotoUpload(fileBuffer, originalFilename)

  // 2. Fetch existing user record to check for prior photo
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profilePhoto: true },
  })

  if (!existingUser) {
    throw AppError.notFound("Patient account not found")
  }

  // 3. Save new file to disk under server-controlled filename
  const stored = await saveFile("avatars", fileBuffer, extension, userId)

  // 4. Update database reference with cleanup on failure
  try {
    if (options?.simulateDbFailure) {
      throw new Error("Simulated database failure after file storage")
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: stored.storageKey,
      },
    })

    // 5. Clean up previous profile photo if it exists (Rule P)
    if (existingUser.profilePhoto) {
      await deleteFile("avatars", existingUser.profilePhoto)
    }

    return stored
  } catch (error) {
    // Check 11: Cleanup newly created file on database failure
    await cleanupOrphanedFile(stored.absolutePath)
    throw error
  }
}

/**
 * Removes a patient's profile photo from disk and database.
 */
export async function removePatientProfilePhoto(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhoto: true },
  })

  if (user?.profilePhoto) {
    await deleteFile("avatars", user.profilePhoto)
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    })
  }
}

/**
 * Validates, saves, and links a category supporting document to a patient's category record.
 * Rule Q: Setting/updating supporting document strictly maintains verificationStatus: PENDING.
 * Rule P & Check 11: Immediate disk cleanup if database operation fails.
 */
export async function uploadPatientSupportingDocument(
  userId: string,
  fileBuffer: Buffer,
  originalFilename?: string,
  options?: UploadServiceOptions,
): Promise<StoredFileResult> {
  // 1. Validate content signature, size (5 MB), and declared extension
  const { extension } = validateSupportingDocumentUpload(
    fileBuffer,
    originalFilename,
  )

  // 2. Fetch existing category record to check for prior document
  const existingRecord = await prisma.patientCategoryRecord.findUnique({
    where: { userId },
    select: { id: true, supportingDocument: true },
  })

  // 3. Save new file to disk under server-controlled filename
  const stored = await saveFile("documents", fileBuffer, extension, userId)

  // 4. Update database reference with cleanup on failure
  try {
    if (options?.simulateDbFailure) {
      throw new Error("Simulated database failure after file storage")
    }

    // Rule Q: Category verification status MUST REMAIN PENDING
    await prisma.patientCategoryRecord.upsert({
      where: { userId },
      create: {
        userId,
        category: PatientCategory.GENERAL_PATIENT,
        verificationStatus: CategoryVerificationStatus.PENDING,
        supportingDocument: stored.storageKey,
      },
      update: {
        supportingDocument: stored.storageKey,
        verificationStatus: CategoryVerificationStatus.PENDING,
      },
    })

    // 5. Clean up previous document if it exists (Rule P)
    if (existingRecord?.supportingDocument) {
      await deleteFile("documents", existingRecord.supportingDocument)
    }

    return stored
  } catch (error) {
    // Check 11: Cleanup newly created file on database failure
    await cleanupOrphanedFile(stored.absolutePath)
    throw error
  }
}
