import { Request, Response, NextFunction } from "express"
import {
  AppError,
  ErrorCode,
  type ErrorResponseEnvelope,
  type FieldError,
  ValidationError,
} from "../errors/AppError"
import { sanitizeForLog } from "../utils/sanitizeLog"

// Re-export for convenience across the application
export { ValidationError, ErrorCode }
export type { FieldError, ErrorResponseEnvelope }

/**
 * 404 Not Found Middleware
 * Handles requests to endpoints that do not exist.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const envelope: ErrorResponseEnvelope = {
    status: "error",
    code: ErrorCode.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  }
  res.status(404).json(envelope)
}

/**
 * Centralized Error Handling Middleware
 * Rule D: Reject malformed JSON with 400.
 * Rule I & N: Do not expose stack traces, credentials, or database internals to API clients.
 * Rule K: Never log raw passwords, session tokens, or unnecessary medical information.
 * Rule L: Return appropriate HTTP status codes and a consistent response shape.
 * Rule M: Distinguish validation failures, authentication failures, authorization failures,
 *         resource conflicts, rate limits, and unexpected server errors.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
)// eslint-disable-next-line @typescript-eslint/no-unused-vars
: void {
  // Rule K: Sanitize request details before logging on the server
  const safeBody = sanitizeForLog(req.body)
  const safeMessage = typeof err?.message === "string" ? err.message : "Error"

  // 1. Handle Malformed JSON parsing errors from express.json()
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as any).status === 400 &&
    "body" in err
  ) {
    console.warn(
      `[Client Error 400] Malformed JSON ${req.method} ${req.originalUrl}`,
    )
    const envelope: ErrorResponseEnvelope = {
      status: "error",
      code: ErrorCode.MALFORMED_JSON,
      message: "Malformed JSON payload in request body",
    }
    res.status(400).json(envelope)
    return
  }

  // 2. Handle Prisma Unique Constraint Violations (P2002)
  if (err && typeof err === "object" && err.code === "P2002") {
    console.warn(
      `[Conflict 409] Prisma P2002 Unique Constraint Violation on ${req.method} ${req.originalUrl}`,
    )
    const targets = Array.isArray(err.meta?.target)
      ? err.meta.target
      : err.meta?.target
        ? [String(err.meta.target)]
        : []

    const fieldErrors: FieldError[] = targets.map((targetField: string) => ({
      field: targetField,
      message: `A record with this ${targetField} already exists`,
      code: "DUPLICATE_ENTRY",
    }))

    const envelope: ErrorResponseEnvelope = {
      status: "error",
      code: ErrorCode.RESOURCE_CONFLICT,
      message: "A resource with these details already exists",
      ...(fieldErrors.length > 0 ? { errors: fieldErrors } : {}),
    }
    res.status(409).json(envelope)
    return
  }

  // 3. Handle Multer Upload Errors (e.g. LIMIT_FILE_SIZE)
  if (err && (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE")) {
    console.warn(
      `[Client Error 400] Multer Error on ${req.method} ${req.originalUrl}:`,
      err.message,
    )
    if (err.code === "LIMIT_FILE_SIZE") {
      const envelope: ErrorResponseEnvelope = {
        status: "error",
        code: ErrorCode.FILE_TOO_LARGE,
        message: "File exceeds permitted size limit of 2 MB",
        errors: [
          {
            field: "file",
            message: "The uploaded file exceeds the maximum allowed file size",
            code: "FILE_TOO_LARGE",
          },
        ],
      }
      res.status(400).json(envelope)
      return
    }

    const envelope: ErrorResponseEnvelope = {
      status: "error",
      code: ErrorCode.VALIDATION_ERROR,
      message: err.message || "File upload failed",
    }
    res.status(400).json(envelope)
    return
  }

  // 3b. Handle Zod Validation Errors directly
  if (err && (err.name === "ZodError" || Array.isArray(err.issues))) {
    const fieldErrors = (err.issues || []).map((issue: any) => ({
      field: issue.path ? issue.path.join(".") || "root" : "root",
      message: issue.message || "Invalid input",
      code: issue.code || "VALIDATION_ERROR",
    }))
    const oneLineDetail =
      fieldErrors.length === 1
        ? `${fieldErrors[0].field}: ${fieldErrors[0].message}`
        : `Validation failed: ${fieldErrors.map((f: any) => `${f.field} (${f.message})`).join("; ")}`

    const envelope: ErrorResponseEnvelope = {
      status: "error",
      code: ErrorCode.VALIDATION_ERROR,
      message: oneLineDetail,
      errors: fieldErrors,
    }
    res.status(400).json(envelope)
    return
  }

  // 4. Handle Explicit Application Errors (AppError, ValidationError, ConflictError, etc.)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(
        `[Server Error ${err.statusCode}] ${req.method} ${req.originalUrl}:`,
        safeMessage,
      )
    } else {
      console.warn(
        `[Client Error ${err.statusCode}] ${req.method} ${req.originalUrl}:`,
        safeMessage,
        {
          body: safeBody,
          errors: err.errors,
        },
      )
    }

    const envelope: ErrorResponseEnvelope = {
      status: "error",
      code: err.code,
      message: err.message,
      ...(err.errors && err.errors.length > 0 ? { errors: err.errors } : {}),
    }
    res.status(err.statusCode).json(envelope)
    return
  }

  // 4. Handle Legacy / Third-Party / Unexpected Errors
  const statusCode =
    typeof err?.statusCode === "number"
      ? err.statusCode
      : typeof err?.status === "number"
        ? err.status
        : 500

  let defaultCode = ErrorCode.INTERNAL_SERVER_ERROR
  if (statusCode === 400) defaultCode = ErrorCode.VALIDATION_ERROR
  else if (statusCode === 401) defaultCode = ErrorCode.AUTHENTICATION_REQUIRED
  else if (statusCode === 403) defaultCode = ErrorCode.FORBIDDEN
  else if (statusCode === 404) defaultCode = ErrorCode.NOT_FOUND
  else if (statusCode === 409) defaultCode = ErrorCode.RESOURCE_CONFLICT
  else if (statusCode === 429) defaultCode = ErrorCode.RATE_LIMIT_EXCEEDED

  if (statusCode >= 500) {
    console.error(
      `[Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`,
      safeMessage,
    )
  } else {
    console.warn(
      `[Client Error ${statusCode}] ${req.method} ${req.originalUrl}:`,
      safeMessage,
      {
        body: safeBody,
        errors: err?.errors,
      },
    )
  }

  // Rule I & N: Never leak internal error details, SQL queries, or stack traces
  const clientMessage =
    statusCode >= 500
      ? "Internal server error"
      : typeof err?.message === "string"
        ? err.message
        : "An unexpected error occurred"

  const envelope: ErrorResponseEnvelope = {
    status: "error",
    code:
      statusCode >= 500
        ? ErrorCode.INTERNAL_SERVER_ERROR
        : err?.code || defaultCode,
    message: clientMessage,
    ...(Array.isArray(err?.errors) && err.errors.length > 0
      ? { errors: err.errors }
      : {}),
  }

  res.status(statusCode).json(envelope)
}
