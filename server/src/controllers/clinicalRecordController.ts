import { Request, Response, NextFunction } from "express"
import fs from "fs"
import path from "path"
import {
  getPatientClinicalRecords,
  getPatientClinicalRecordById,
  getClinicalRecordAttachment,
  rejectPatientCreateRecord,
  rejectPatientUpdateRecord,
  rejectPatientDeleteRecord,
} from "../services/clinicalRecordService"
import { normalizeRecordType } from "../validation/clinicalRecord"
import { ClinicalRecordType } from "../generated/prisma/enums"

/**
 * GET /api/patient/records
 * Retrieves authorized list of clinical records for the authenticated patient.
 * Optional query parameter: ?type=DIAGNOSIS (case-insensitive)
 */
export async function getPatientClinicalRecordsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    let filterType: ClinicalRecordType | undefined

    if (req.query.type && typeof req.query.type === "string") {
      try {
        filterType = normalizeRecordType(req.query.type)
      } catch (err: any) {
        res.status(400).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message: err.message,
        })
        return
      }
    }

    const records = await getPatientClinicalRecords(patientId, filterType)

    res.status(200).json({
      status: "success",
      data: records,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/records/:id
 * Retrieves a single clinical record by UUID or recordNumber, verifying ownership.
 */
export async function getPatientClinicalRecordByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const recordId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const record = await getPatientClinicalRecordById(patientId, recordId)

    res.status(200).json({
      status: "success",
      data: record,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/patient/records/:id/attachment
 * Securely streams an attached medical report or document for an authorized patient.
 */
export async function getPatientClinicalRecordAttachmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = req.user!.id
    const recordId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const { filePath, attachmentName } = await getClinicalRecordAttachment(
      patientId,
      recordId,
    )

    const ext = path.extname(filePath).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".pdf") contentType = "application/pdf"
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
    else if (ext === ".png") contentType = "image/png"

    res.setHeader("Content-Type", contentType)
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("Cache-Control", "private, max-age=3600")
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${attachmentName.replace(/[^\w.-]/g, "_")}"`,
    )

    const stream = fs.createReadStream(filePath)
    stream.on("error", (err) => next(err))
    stream.pipe(res)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/patient/records
 * Patient record creation is prohibited by clinical policy (Rule 4). Responds with HTTP 403.
 */
export function patientCreateRecordBlockedHandler(
  _req: Request,
  _res: Response,
  _next: NextFunction,
): void {
  rejectPatientCreateRecord()
}

/**
 * PATCH /api/patient/records/:id
 * Patient record modification is prohibited (Rule 2). Responds with HTTP 403.
 */
export function patientUpdateRecordBlockedHandler(
  _req: Request,
  _res: Response,
  _next: NextFunction,
): void {
  rejectPatientUpdateRecord()
}

/**
 * DELETE /api/patient/records/:id
 * Patient record deletion is prohibited (Rule 3). Responds with HTTP 403.
 */
export function patientDeleteRecordBlockedHandler(
  _req: Request,
  _res: Response,
  _next: NextFunction,
): void {
  rejectPatientDeleteRecord()
}
