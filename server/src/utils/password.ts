import bcrypt from "bcryptjs"

const BCRYPT_SALT_ROUNDS = 12

/**
 * Hashes a plaintext password using bcrypt with an industry-standard work factor of 12.
 * Rule D: Hash passwords using an established password-hashing library with an appropriate work factor.
 * Rule E: Never store or return a plain-text password.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS)
}

/**
 * Compares a plaintext candidate password against a stored secure bcrypt hash.
 */
export async function comparePassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hash)
}
