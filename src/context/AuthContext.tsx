import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react"
import {
  api,
  AuthUser as ApiUser,
  OnboardingStatusResponse,
  ProfessionalItem,
  AdministratorItem,
  ProfessionalVerificationStatusType,
} from "@/utils/api"

export type PatientRole = "patient"
export type ProfRole = "doctor" | "nurse" | "pharmacist" | "admin"
export type Role = PatientRole | ProfRole

export interface ContextUser {
  id: string
  role: Role
  name: string
  firstName: string
  lastName: string
  email: string
  initials: string
  phoneNumber?: string
  profilePhoto?: string | null
  // Professional & Admin Subsystem Extensions (Step 2)
  verificationStatus?: ProfessionalVerificationStatusType
  accountStatus?: string
  category?: string
  specialty?: string | null
  licenceNumber?: string
  facility?: string | null
  scope?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

interface AuthContextValue {
  user: ContextUser | null
  isLoading: boolean
  isAuthenticated: boolean
  onboardingStatus: OnboardingStatusResponse | null
  login: (
    credentialsOrRole: LoginCredentials | Role,
    portal?: "patient" | "professional" | "admin",
  ) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const ROLE_META: Record<ProfRole | "patient", {
  name: string
  initials: string
  email: string
}> = {
  patient: {
    name: "Ama Mensah",
    initials: "AM",
    email: "patient@healthitude.com",
  },
  doctor: {
    name: "Dr. Kofi Boateng",
    initials: "KB",
    email: "doctor@healthitude.com",
  },
  nurse: {
    name: "Nurse Afua Darko",
    initials: "AD",
    email: "nurse@healthitude.com",
  },
  pharmacist: {
    name: "Pharm. Kwame Adu",
    initials: "KA",
    email: "pharmacist@healthitude.com",
  },
  admin: {
    name: "Sylvia Yeboah",
    initials: "SY",
    email: "admin@healthitude.com",
  },
}

function formatUser(apiUser: ApiUser, role: Role = "patient"): ContextUser {
  const firstName = apiUser.firstName || ""
  const lastName = apiUser.lastName || ""
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Patient"
  const initials = (firstName[0] || "P") + (lastName[0] || "T")

  return {
    id: apiUser.id,
    role,
    name,
    firstName,
    lastName,
    email: apiUser.email,
    initials: initials.toUpperCase(),
    phoneNumber: apiUser.phoneNumber,
    profilePhoto: apiUser.profilePhoto,
  }
}

function formatProfessional(prof: ProfessionalItem): ContextUser {
  const firstName = prof.firstName || ""
  const lastName = prof.lastName || ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Doctor"
  const initials = ((firstName[0] || "D") + (lastName[0] || "R")).toUpperCase()
  const role: Role = "doctor"

  return {
    id: prof.id,
    role,
    name: `Dr. ${fullName}`,
    firstName,
    lastName,
    email: prof.email,
    initials,
    phoneNumber: prof.phoneNumber,
    verificationStatus: prof.verificationStatus,
    accountStatus: prof.accountStatus,
    category: prof.category,
    specialty: prof.specialty,
    licenceNumber: prof.licenceNumber,
    facility: prof.facility,
  }
}

function formatAdmin(admin: AdministratorItem, scope?: string): ContextUser {
  const parts = (admin.name || "Admin").split(" ")
  const firstName = parts[0] || "Admin"
  const lastName = parts.slice(1).join(" ") || ""
  const initials = ((firstName[0] || "A") + (lastName[0] || "D")).toUpperCase()

  return {
    id: admin.id,
    role: "admin",
    name: admin.name || "Sylvia Yeboah",
    firstName,
    lastName,
    email: admin.email,
    initials,
    scope: scope || "admin:write,admin:read",
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ContextUser | null>(null)
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Check active session across patient, professional, and admin domains
  const refreshUser = useCallback(async () => {
    try {
      // 1. Probe patient session
      try {
        const data = await api.auth.me()
        if (data?.user) {
          const formatted = formatUser(data.user, "patient")
          setUser(formatted)

          try {
            const status = await api.patient.getOnboardingStatus()
            setOnboardingStatus(status)
          } catch {
            // Onboarding status may be pending or unavailable
          }
          return
        }
      } catch {
        // Patient session not active
      }

      // 2. Probe professional session
      try {
        const profRes = await api.professional.me()
        if (profRes?.data?.professional) {
          const formatted = formatProfessional(profRes.data.professional)
          setUser(formatted)
          setOnboardingStatus(null)
          return
        }
      } catch {
        // Professional session not active
      }

      // 3. Probe administrator session
      try {
        const adminRes = await api.admin.me()
        if (adminRes?.data?.admin) {
          const formatted = formatAdmin(adminRes.data.admin)
          setUser(formatted)
          setOnboardingStatus(null)
          return
        }
      } catch {
        // Administrator session not active
      }

      setUser(null)
      setOnboardingStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  async function login(
    credentialsOrRole: LoginCredentials | Role,
    portal?: "patient" | "professional" | "admin",
  ): Promise<void> {
    if (typeof credentialsOrRole === "string") {
      // Backward compatibility for mock roles
      const role = credentialsOrRole
      const meta = ROLE_META[role]
      setUser({
        id: `mock-${role}`,
        role,
        name: meta.name,
        firstName: meta.name.split(" ")[0],
        lastName: meta.name.split(" ").slice(1).join(" "),
        email: meta.email,
        initials: meta.initials,
        verificationStatus: "VERIFIED",
      })
      return
    }

    const { email, password } = credentialsOrRole

    // Administrator Login route
    if (portal === "admin" || email === "admin@healthitude.com") {
      const res = await api.admin.login({ email, password })
      if (res?.administrator) {
        setUser(formatAdmin(res.administrator, res.scope))
        setOnboardingStatus(null)
        return
      }
    }

    // Professional Login route
    if (portal === "professional") {
      const res = await api.professional.login({ email, password })
      if (res?.professional) {
        setUser(formatProfessional(res.professional))
        setOnboardingStatus(null)
        return
      }
    }

    // Authoritative patient login against backend
    const data = await api.auth.login({ email, password })
    if (data.user) {
      const formatted = formatUser(data.user, "patient")
      setUser(formatted)

      try {
        const status = await api.patient.getOnboardingStatus()
        setOnboardingStatus(status)
      } catch {
        // Continue to dashboard
      }
    }
  }

  async function logout(): Promise<void> {
    try {
      if (user?.role === "admin") {
        await api.admin.logout()
      } else if (
        user?.role === "doctor" ||
        user?.role === "nurse" ||
        user?.role === "pharmacist"
      ) {
        await api.professional.logout()
      } else {
        await api.auth.logout()
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null)
      setOnboardingStatus(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        onboardingStatus,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
