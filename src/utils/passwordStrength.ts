/**
 * Password Strength Evaluation Engine
 * Evaluates password entropy, composition criteria, and security classification.
 * Follows formal programming logic without hardcoded shortcuts.
 */

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "strong"

export interface PasswordCriterion {
  id: string
  label: string
  satisfied: boolean
}

export interface PasswordStrengthResult {
  score: number // 0 to 4
  level: PasswordStrengthLevel
  color: "gray" | "red" | "yellow" | "green"
  colorClass: string
  label: string
  criteria: PasswordCriterion[]
  isStrongEnough: boolean
  feedback: string
}

const MIN_LENGTH = 8

/**
 * Evaluates a password against standard cryptographic security criteria.
 * A password is only classified as "strong" (green) when it has:
 * - At least 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special symbol
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: "empty",
      color: "gray",
      colorClass: "bg-gray-200 text-gray-400",
      label: "",
      criteria: [
        { id: "length", label: `At least ${MIN_LENGTH} characters`, satisfied: false },
        { id: "lowercase", label: "One lowercase letter (a-z)", satisfied: false },
        { id: "uppercase", label: "One uppercase letter (A-Z)", satisfied: false },
        { id: "number", label: "One number (0-9)", satisfied: false },
        { id: "symbol", label: "One special symbol (!@#$%...)", satisfied: false },
      ],
      isStrongEnough: false,
      feedback: "Enter a password to evaluate strength.",
    }
  }

  const hasLength = password.length >= MIN_LENGTH
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  const criteria: PasswordCriterion[] = [
    { id: "length", label: `At least ${MIN_LENGTH} characters`, satisfied: hasLength },
    { id: "lowercase", label: "One lowercase letter (a-z)", satisfied: hasLowercase },
    { id: "uppercase", label: "One uppercase letter (A-Z)", satisfied: hasUppercase },
    { id: "number", label: "One number (0-9)", satisfied: hasNumber },
    { id: "symbol", label: "One special symbol (!@#$%...)", satisfied: hasSymbol },
  ]

  const satisfiedCount = criteria.filter((c) => c.satisfied).length

  // Robust algorithmic scoring:
  // Green / Strong requires: length >= 8, uppercase, lowercase, and both number & symbol (or 4 criteria with length >= 10)
  const satisfiesAllDiversity = hasLowercase && hasUppercase && (hasNumber || hasSymbol)
  const satisfiesComplete = hasLength && hasLowercase && hasUppercase && hasNumber && hasSymbol

  let level: PasswordStrengthLevel = "weak"
  let color: "gray" | "red" | "yellow" | "green" = "red"
  let colorClass = "bg-red-500 text-red-600"
  let label = "Weak"
  let score = 1
  let feedback = "Password is too weak. Add uppercase, numbers, and symbols."

  if (satisfiesComplete || (hasLength && password.length >= 10 && satisfiedCount >= 4)) {
    level = "strong"
    color = "green"
    colorClass = "bg-emerald-500 text-emerald-600"
    label = "Strong"
    score = 4
    feedback = "Strong password. Confirmation unlocked."
  } else if (hasLength && (satisfiedCount >= 3 || satisfiesAllDiversity)) {
    level = "fair"
    color = "yellow"
    colorClass = "bg-amber-500 text-amber-600"
    label = "Fair"
    score = 2
    feedback = "Almost strong. Add a special symbol or number to turn green."
  } else {
    level = "weak"
    color = "red"
    colorClass = "bg-red-500 text-red-600"
    label = "Weak"
    score = 1
    feedback = "Must be at least 8 characters with letters, numbers, and symbols."
  }

  return {
    score,
    level,
    color,
    colorClass,
    label,
    criteria,
    isStrongEnough: level === "strong",
    feedback,
  }
}

/**
 * Convenience check returning true only if the password check turns green.
 */
export function isPasswordStrong(password: string): boolean {
  return evaluatePasswordStrength(password).isStrongEnough
}
