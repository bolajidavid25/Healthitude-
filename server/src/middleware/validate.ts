import { Request, Response, NextFunction } from "express"
import { ZodTypeAny, ZodError } from "zod"
import { ValidationError, type FieldError } from "../errors/AppError"

/**
 * Transforms Zod error issues into a clean, safe, consistent array of FieldErrors.
 * Specifically formats unrecognized_keys for clear reporting of injected or server-controlled fields.
 */
export function formatZodIssues(error: ZodError): FieldError[] {
  return error.issues.map((issue) => {
    let field = issue.path.join(".") || "root"
    let message = issue.message

    if (issue.code === "unrecognized_keys") {
      const keys = (issue as any).keys
      const keyList = Array.isArray(keys) ? keys.join(", ") : "unknown"
      field = Array.isArray(keys) && keys.length > 0 ? keys[0] : field
      message = `Unrecognized or server-controlled property: '${keyList}'`
    }

    return {
      field,
      message,
      code: issue.code,
    }
  })
}

/**
 * Express middleware that validates req.body against a Zod schema.
 * Replaces req.body with the parsed/transformed data on success.
 * Rule D: Rejects malformed JSON, missing fields, invalid enums, unexpected types.
 * Rule E & F: Applies normalized email and phone transformations.
 * Rule J: Strictly rejects server-controlled properties.
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body)
      if (!result.success) {
        const errors = formatZodIssues(result.error)
        return next(new ValidationError("Validation failed", errors))
      }
      req.body = result.data
      next()
    } catch (unexpectedError) {
      next(unexpectedError)
    }
  }
}

/**
 * Express middleware that validates req.query against a Zod schema.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query)
      if (!result.success) {
        const errors = formatZodIssues(result.error)
        return next(new ValidationError("Validation failed", errors))
      }
      req.query = result.data
      next()
    } catch (unexpectedError) {
      next(unexpectedError)
    }
  }
}

/**
 * Express middleware that validates req.params against a Zod schema.
 */
export function validateParams<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params)
      if (!result.success) {
        const errors = formatZodIssues(result.error)
        return next(new ValidationError("Validation failed", errors))
      }
      req.params = result.data
      next()
    } catch (unexpectedError) {
      next(unexpectedError)
    }
  }
}
