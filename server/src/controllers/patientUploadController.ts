import fs from "fs"
import path from "path"
import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import {
  uploadPatientProfilePhoto,
  removePatientProfilePhoto,
  uploadPatientSupportingDocument,
} from "../services/patientUploadService"
import { getFilePath } from "../services/storageService"

/**
 * Handles profile photo upload for the authenticated patient.
 */
export async function uploadProfilePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    if (!req.file || !req.file.buffer) {
      return next(AppError.emptyFile("No file was uploaded"))
    }

    const stored = await uploadPatientProfilePhoto(
      userId,
      req.file.buffer,
      req.file.originalname,
    )

    res.status(200).json({
      status: "success",
      message: "Profile photo uploaded successfully",
      data: {
        profilePhoto: stored.publicUrl,
        storageKey: stored.storageKey,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Serves the authenticated patient's profile photo with security headers.
 * Rule H & J: Controlled access, no script execution.
 */
export async function getProfilePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    await streamUserAvatar(userId, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Serves a patient's profile photo by userId, verifying authorization.
 * Rule C & Check 2: Prevents unauthorized profile photo access.
 */
export async function getProfilePhotoByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const targetUserId = req.params.userId
    const authenticatedUserId = req.user!.id

    if (targetUserId !== authenticatedUserId) {
      return next(
        AppError.forbidden(
          "Access denied: You are not authorized to view another patient's profile photo",
        ),
      )
    }

    await streamUserAvatar(authenticatedUserId, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Helper to stream an avatar from storage with safe headers.
 */
async function streamUserAvatar(
  userId: string,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhoto: true },
  })

  if (!user || !user.profilePhoto) {
    return next(AppError.notFound("Profile photo not found"))
  }

  const filePath = await getFilePath("avatars", user.profilePhoto)
  if (!filePath) {
    return next(AppError.notFound("Profile photo file not found on disk"))
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = ext === ".png" ? "image/png" : "image/jpeg"

  res.setHeader("Content-Type", contentType)
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "private, max-age=3600")
  res.setHeader("Content-Disposition", "inline")

  const stream = fs.createReadStream(filePath)
  stream.on("error", (err) => next(err))
  stream.pipe(res)
}

/**
 * Handles profile photo removal.
 */
export async function deleteProfilePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    await removePatientProfilePhoto(userId)

    res.status(200).json({
      status: "success",
      message: "Profile photo removed successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handles category supporting document upload.
 * Rule Q: Preserves verificationStatus: PENDING.
 */
export async function uploadCategoryDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    if (!req.file || !req.file.buffer) {
      return next(AppError.emptyFile("No file was uploaded"))
    }

    const stored = await uploadPatientSupportingDocument(
      userId,
      req.file.buffer,
      req.file.originalname,
    )

    res.status(200).json({
      status: "success",
      message: "Supporting document uploaded successfully",
      data: {
        supportingDocument: stored.publicUrl,
        storageKey: stored.storageKey,
        verificationStatus: "PENDING",
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Serves the authenticated patient's supporting document with strict security headers.
 * Rule J & K: Private document access.
 */
export async function getCategoryDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id
    await streamCategoryDocument(userId, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Serves a patient's supporting document by userId.
 * Rule C & K & Check 8: Strictly blocks unauthorized patient access to documents.
 */
export async function getCategoryDocumentByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const targetUserId = req.params.userId
    const authenticatedUserId = req.user!.id

    if (targetUserId !== authenticatedUserId) {
      return next(
        AppError.forbidden(
          "Access denied: You are not authorized to view another patient's supporting documents",
        ),
      )
    }

    await streamCategoryDocument(authenticatedUserId, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Helper to stream a supporting document with safe headers.
 */
async function streamCategoryDocument(
  userId: string,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const record = await prisma.patientCategoryRecord.findUnique({
    where: { userId },
    select: { supportingDocument: true },
  })

  if (!record || !record.supportingDocument) {
    return next(AppError.notFound("Supporting document not found"))
  }

  const filePath = await getFilePath("documents", record.supportingDocument)
  if (!filePath) {
    return next(AppError.notFound("Supporting document file not found on disk"))
  }

  const ext = path.extname(filePath).toLowerCase()
  let contentType = "application/pdf"
  if (ext === ".jpg" || ext === ".jpeg") {
    contentType = "image/jpeg"
  } else if (ext === ".png") {
    contentType = "image/png"
  }

  res.setHeader("Content-Type", contentType)
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "private, no-cache")
  res.setHeader(
    "Content-Disposition",
    `inline; filename="supporting-document${ext}"`,
  )

  const stream = fs.createReadStream(filePath)
  stream.on("error", (err) => next(err))
  stream.pipe(res)
}
