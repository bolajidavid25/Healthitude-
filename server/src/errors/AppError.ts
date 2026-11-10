/**
 * Standard Application Error Codes.
 * Rule M: Distinguish validation failures, authentication failures,
 * authorization failures, resource conflicts, rate limits, and unexpected server errors.
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MALFORMED_JSON = "MALFORMED_JSON",
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_CONTENT = "INVALID_FILE_CONTENT",
  UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE",
  EMPTY_FILE = "EMPTY_FILE",
}

export interface FieldError {
  field: string
  message: string
  code?: string
}

export interface ErrorResponseEnvelope {
  status: "error"
  code: ErrorCode | string
  message: string
  errors?: FieldError[]
}

/**
 * Base Application Error class for predictable HTTP error responses.
 * Rule L: Return appropriate HTTP status codes and a consistent response shape.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode | string
  public readonly errors?: FieldError[]

  constructor(
    statusCode: number,
    code: ErrorCode | string,
    message: string,
    errors?: FieldError[],
  ) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
    this.errors = errors
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static badRequest(
    message = "Bad request",
    code = ErrorCode.VALIDATION_ERROR,
    errors?: FieldError[],
  ) {
    return new AppError(400, code, message, errors)
  }

  static validation(errors: FieldError[], message = "Validation failed") {
    return new ValidationError(message, errors)
  }

  static malformedJson(message = "Malformed JSON payload in request body") {
    return new AppError(400, ErrorCode.MALFORMED_JSON, message)
  }

  static unauthorized(
    message = "Authentication is required to access this resource",
  ) {
    return new UnauthorizedError(message)
  }

  static invalidCredentials(message = "Invalid email or password") {
    return new InvalidCredentialsError(message)
  }

  static forbidden(
    message = "You do not have permission to perform this action",
  ) {
    return new ForbiddenError(message)
  }

  static notFound(message = "Resource not found") {
    return new NotFoundError(message)
  }

  static conflict(
    message = "A resource with these details already exists",
    errors?: FieldError[],
  ) {
    return new ConflictError(message, errors)
  }

  static rateLimit(message = "Too many requests. Please try again later.") {
    return new RateLimitError(message)
  }

  static internal(message = "Internal server error") {
    return new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, message)
  }

  static fileTooLarge(message = "File exceeds permitted size limit of 2 MB") {
    return new AppError(400, ErrorCode.FILE_TOO_LARGE, message, [
      { field: "file", message, code: "FILE_TOO_LARGE" },
    ])
  }

  static invalidFileContent(message = "File content is invalid or corrupted") {
    return new AppError(400, ErrorCode.INVALID_FILE_CONTENT, message, [
      { field: "file", message, code: "INVALID_FILE_CONTENT" },
    ])
  }

  static unsupportedFileType(message = "Unsupported file type") {
    return new AppError(400, ErrorCode.UNSUPPORTED_FILE_TYPE, message, [
      { field: "file", message, code: "UNSUPPORTED_FILE_TYPE" },
    ])
  }

  static emptyFile(message = "Uploaded file cannot be empty") {
    return new AppError(400, ErrorCode.EMPTY_FILE, message, [
      { field: "file", message, code: "EMPTY_FILE" },
    ])
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors: FieldError[] = []) {
    super(400, ErrorCode.VALIDATION_ERROR, message, errors)
    this.name = "ValidationError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required to access this resource") {
    super(401, ErrorCode.AUTHENTICATION_REQUIRED, message)
    this.name = "UnauthorizedError"
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid email or password") {
    super(401, ErrorCode.INVALID_CREDENTIALS, message)
    this.name = "InvalidCredentialsError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, ErrorCode.FORBIDDEN, message)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, ErrorCode.NOT_FOUND, message)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "A resource with these details already exists",
    errors?: FieldError[],
  ) {
    super(409, ErrorCode.RESOURCE_CONFLICT, message, errors)
    this.name = "ConflictError"
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, ErrorCode.RATE_LIMIT_EXCEEDED, message)
    this.name = "RateLimitError"
  }
}
