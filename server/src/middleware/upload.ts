import multer from "multer"
import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"

const memoryStorage = multer.memoryStorage()

const avatarMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit (Rule C)
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "photo", maxCount: 1 },
])

const documentMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "document", maxCount: 1 },
])

/**
 * Middleware for parsing profile photo uploads.
 * Normalizes uploaded file to req.file.
 */
export function parseProfilePhotoUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  avatarMulter(req, res, (err) => {
    if (err) {
      return next(err)
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    } | undefined
    const file = files?.file?.[0] || files?.photo?.[0]

    if (!file) {
      return next(AppError.emptyFile("No file was uploaded"))
    }

    req.file = file
    next()
  })
}

/**
 * Middleware for parsing category supporting document uploads.
 * Normalizes uploaded file to req.file.
 */
export function parseSupportingDocumentUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  documentMulter(req, res, (err) => {
    if (err) {
      return next(err)
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    } | undefined
    const file = files?.file?.[0] || files?.document?.[0]

    if (!file) {
      return next(AppError.emptyFile("No file was uploaded"))
    }

    req.file = file
    next()
  })
}
