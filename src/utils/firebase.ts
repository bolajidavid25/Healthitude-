import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

let cachedApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth

  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Google Sign-In is not configured yet. Please set VITE_FIREBASE_* environment variables.",
    )
  }

  const existing = getApps()
  cachedApp = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig)
  cachedAuth = getAuth(cachedApp)
  return cachedAuth
}

export interface GoogleSignInResult {
  idToken: string
  email: string
  displayName: string
  photoURL: string | null
}

/**
 * Triggers the Firebase Google OAuth popup and returns a verified Firebase ID Token
 * for backend authentication/registration.
 */
export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.addScope("email")
  provider.addScope("profile")
  provider.setCustomParameters({ prompt: "select_account" })

  const credential = await signInWithPopup(auth, provider)
  const user = credential.user
  const idToken = await user.getIdToken(true)

  return {
    idToken,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || null,
  }
}
