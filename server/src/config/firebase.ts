import { initializeApp, cert, getApps, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { AppError } from "../errors/AppError"

export interface VerifiedGoogleIdentity {
  uid: string
  email: string
  emailVerified: boolean
  name: string
  firstName: string
  lastName: string
  picture: string | null
}

let firebaseApp: App | null = null

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}

function getFirebaseAdminApp(): App {
  if (firebaseApp) return firebaseApp

  const existing = getApps()
  if (existing.length > 0) {
    firebaseApp = existing[0]
    return firebaseApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Firebase Google Authentication is not configured on the server.",
    )
  }

  // Handle escaped \n newlines from .env files and Render environment variables
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n")

  firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })

  return firebaseApp
}

/**
 * Cryptographically verifies a Firebase ID token issued by Google Sign-In.
 * Never trusts client-supplied email/profile fields directly.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<VerifiedGoogleIdentity> {
  if (!idToken || typeof idToken !== "string" || idToken.trim().length < 20) {
    throw AppError.unauthorized("Invalid or missing Firebase ID token")
  }

  const app = getFirebaseAdminApp()
  const auth = getAuth(app)

  try {
    const decoded = await auth.verifyIdToken(idToken, true)
    const email = (decoded.email || "").trim().toLowerCase()

    if (!email) {
      throw AppError.unauthorized(
        "Google account did not return a valid email address",
      )
    }

    if (decoded.email_verified === false) {
      throw AppError.unauthorized(
        "Your Google email address must be verified before signing in",
      )
    }

    const displayName = (decoded.name || "").trim()
    const nameParts = displayName.split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] || email.split("@")[0] || "User"
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Member"

    return {
      uid: decoded.uid,
      email,
      emailVerified: true,
      name: displayName || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      picture: typeof decoded.picture === "string" ? decoded.picture : null,
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err
    throw AppError.unauthorized(
      "Google authentication token is invalid or has expired. Please try signing in again.",
    )
  }
}
