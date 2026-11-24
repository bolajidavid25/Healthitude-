import crypto from "crypto"
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

const DEFAULT_FIREBASE_PROJECT_ID = "healthitude-9a7b4"
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

let firebaseApp: App | null = null
let cachedPublicCerts: { certs: Record<string, string>; expiresAt: number } | null =
  null

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
  )
}

function hasServiceAccountCredentials(): boolean {
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

  const projectId = process.env.FIREBASE_PROJECT_ID!
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n")

  firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })

  return firebaseApp
}

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now()
  if (cachedPublicCerts && cachedPublicCerts.expiresAt > now) {
    return cachedPublicCerts.certs
  }

  const res = await fetch(GOOGLE_CERTS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public certificates (${res.status})`)
  }
  const certs = (await res.json()) as Record<string, string>

  // Respect Cache-Control max-age header (default 1 hour)
  const cacheControl = res.headers.get("cache-control") || ""
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600

  cachedPublicCerts = {
    certs,
    expiresAt: now + maxAgeSec * 1000,
  }
  return certs
}

function decodeBase64UrlJson(segment: string): any {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"))
}

/**
 * Verifies a Firebase ID Token cryptographically against Google's official public x509
 * SecureToken certificates (RS256) per Firebase's official JWT verification specification.
 * Used as a secure zero-secret fallback when Service Account env vars are not set.
 */
async function verifyIdTokenWithGooglePublicKeys(
  idToken: string,
  projectId: string,
): Promise<Record<string, any>> {
  const parts = idToken.split(".")
  if (parts.length !== 3) {
    throw AppError.unauthorized("Invalid Firebase ID token format")
  }

  const [headerB64, payloadB64, signatureB64] = parts
  const header = decodeBase64UrlJson(headerB64)
  const payload = decodeBase64UrlJson(payloadB64)

  if (header.alg !== "RS256" || !header.kid) {
    throw AppError.unauthorized("Invalid Firebase ID token header")
  }

  const certs = await getGooglePublicCerts()
  const publicCert = certs[header.kid]
  if (!publicCert) {
    throw AppError.unauthorized("Unknown Firebase signing key ID")
  }

  const verifier = crypto.createVerify("RSA-SHA256")
  verifier.update(`${headerB64}.${payloadB64}`)
  verifier.end()

  const sigNormalized = signatureB64.replace(/-/g, "+").replace(/_/g, "/")
  const sigPadded =
    sigNormalized + "=".repeat((4 - (sigNormalized.length % 4)) % 4)
  const signature = Buffer.from(sigPadded, "base64")

  const isValidSig = verifier.verify(publicCert, signature)
  if (!isValidSig) {
    throw AppError.unauthorized("Firebase ID token signature verification failed")
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
    throw AppError.unauthorized("Firebase ID token has expired")
  }
  if (typeof payload.iat !== "number" || payload.iat > nowSec + 300) {
    throw AppError.unauthorized("Invalid Firebase ID token issued-at time")
  }
  if (payload.aud !== projectId) {
    throw AppError.unauthorized("Firebase ID token audience mismatch")
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw AppError.unauthorized("Firebase ID token issuer mismatch")
  }
  if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
    throw AppError.unauthorized("Firebase ID token missing subject")
  }

  return { ...payload, uid: payload.user_id || payload.sub }
}

/**
 * Cryptographically verifies a Firebase ID token issued by Google Sign-In.
 * Uses firebase-admin when Service Account credentials are present, and falls back
 * to Google's official public x509 SecureToken RS256 verification otherwise.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<VerifiedGoogleIdentity> {
  if (!idToken || typeof idToken !== "string" || idToken.trim().length < 20) {
    throw AppError.unauthorized("Invalid or missing Firebase ID token")
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID

  try {
    let decoded: Record<string, any>

    if (hasServiceAccountCredentials()) {
      const app = getFirebaseAdminApp()
      const auth = getAuth(app)
      decoded = await auth.verifyIdToken(idToken, true)
    } else {
      decoded = await verifyIdTokenWithGooglePublicKeys(idToken, projectId)
    }

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
      uid: String(decoded.uid || decoded.sub),
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
