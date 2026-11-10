/**
 * Sensitive field patterns that must be redacted from server logs.
 * Rule G: Do not log passwords, health information, authentication tokens,
 * or other sensitive request values.
 * Rule K: Never log raw passwords, session tokens, or unnecessary medical information.
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /secret/i,
  /bearer/i,
  /cookie/i,
  /allerg/i,
  /medicat/i,
  /surger/i,
  /history/i,
  /condition/i,
  /bloodgroup/i,
  /genotype/i,
  /nhis/i,
  /ssn/i,
  /nin/i,
  /pin/i,
  /nationalid/i,
  /session/i,
  /csrf/i,
]

/**
 * Checks if a property key represents sensitive information.
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

/**
 * Recursively deep-clones an object or array, redacting any sensitive fields.
 * Safe to call on primitives, objects, errors, and arrays.
 */
export function sanitizeForLog(data: any, seen = new WeakSet()): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data !== "object") {
    return data
  }

  // Prevent circular reference infinite loops
  if (seen.has(data)) {
    return "[Circular]"
  }
  seen.add(data)

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLog(item, seen))
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
    }
  }

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeForLog(value, seen)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
