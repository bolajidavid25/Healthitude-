import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { Stethoscope, ArrowRight, AlertCircle, CheckCircle2, Loader2, Check } from "lucide-react"
import logoWhite from "@/imports/Screenshot_2026-09-14_184307-removebg-preview.png"
import { useAuth, type ProfRole } from "@/context/AuthContext"
import { api, ApiError, ProfessionalCategoryType } from "@/utils/api"
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator"
import { isPasswordStrong } from "@/utils/passwordStrength"
import { explainError, extractFieldErrors } from "@/utils/errorExplainer"

const BLUE = "#1a3fcf"

type ProfRoleLocal = ProfRole

const PROF_ROLES: { value: ProfRoleLocal; label: string }[] = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "admin", label: "Administrator" },
]

function Input({
  placeholder,
  type = "text",
  value,
  onChange,
  disabled,
}: {
  placeholder?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-none px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function Select({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-none px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function VerificationPending({
  onEnter,
  registeredEmail,
}: {
  onEnter: () => void
  registeredEmail?: string
}) {
  return (
    <div className="text-center space-y-4 py-2">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-gray-900">
          Professional Account Created
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Your credentials have been submitted. Clinical privileges are pending administrator review.
        </p>
        {registeredEmail && (
          <p className="text-xs text-blue-700 font-mono mt-1 bg-blue-50 py-1 px-2 inline-block">
            {registeredEmail}
          </p>
        )}
      </div>
      <div className="bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2.5 text-sm text-slate-700">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            1
          </span>
          <span>Account created with <strong>RESTRICTED / PENDING</strong> status</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            2
          </span>
          <span>Credentials routed to Healthitude Administrator portal</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            3
          </span>
          <span>Audit trail logged for regulatory compliance</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            4
          </span>
          <span>Full clinical access unlocked immediately upon administrator verification</span>
        </div>
      </div>
      <button
        onClick={onEnter}
        className="btn-send !w-full !py-3 text-white font-semibold rounded-none"
      >
        <span>Proceed to Professional Portal</span>
        <ArrowRight className="w-4 h-4 btn-arrow" />
      </button>
    </div>
  )
}

export default function ProfAuthPage({
  mode: initialMode,
}: {
  mode: "login" | "register"
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  const [role, setRole] = useState<ProfRoleLocal>("doctor")
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Login form state
  const [loginEmail, setLoginEmail] = useState("doctor@healthitude.com")
  const [loginPassword, setLoginPassword] = useState("DoctorPassword123!")

  // Registration form state
  const [form, setForm] = useState({
    firstName: "Kofi",
    lastName: "Boateng",
    email: "",
    phoneNumber: "+233 24 123 4567",
    password: "",
    confirmPassword: "",
    category: "DOCTOR" as ProfessionalCategoryType,
    specialty: "General Practice",
    licenceNumber: "GMA-2026-0841",
    licenceExpiry: "2028-12-31",
    regulatoryBody: "Ghana Medical Association",
    facility: "Korle Bu Teaching Hospital",
  })

  const [consents, setConsents] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ])

  const { login } = useAuth()
  const navigate = useNavigate()
  const TOTAL = 3

  const stepLabels = [
    "Account & Identity",
    "Professional Credentials",
    "Consent & Agreements",
  ]

  function updateFormField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrorMsg(null)
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[field]
      if (field === "confirmPassword" || field === "password") {
        delete copy.confirmPassword
        delete copy.password
      }
      return copy
    })
  }

  function handleRoleChange(newRole: ProfRoleLocal) {
    setRole(newRole)
    setErrorMsg(null)
    if (newRole === "admin") {
      setLoginEmail("admin@healthitude.com")
      setLoginPassword("AdminPassword123!")
    } else if (newRole === "doctor") {
      setLoginEmail("doctor@healthitude.com")
      setLoginPassword("DoctorPassword123!")
      setForm((p) => ({
        ...p,
        category: "DOCTOR",
        specialty: "General Practice",
        regulatoryBody: "Ghana Medical Association",
        licenceNumber: "GMA-2026-0841",
      }))
    } else if (newRole === "nurse") {
      setLoginEmail("nurse@healthitude.com")
      setLoginPassword("NursePassword123!")
      setForm((p) => ({
        ...p,
        category: "NURSE",
        specialty: "Perioperative Care",
        regulatoryBody: "Ghana Nurses & Midwives Council",
        licenceNumber: "GNC-2026-0422",
      }))
    } else if (newRole === "pharmacist") {
      setLoginEmail("pharmacist@healthitude.com")
      setLoginPassword("PharmPassword123!")
      setForm((p) => ({
        ...p,
        category: "PHARMACIST",
        specialty: "Clinical Pharmacy",
        regulatoryBody: "Pharmacy Council of Ghana",
        licenceNumber: "PC-2026-0911",
      }))
    }
  }

  async function handleLogin() {
    setErrorMsg(null)
    setIsLoading(true)
    try {
      if (!loginEmail || !loginPassword) {
        // Fallback for mock demo when fields are empty
        await login(role)
        navigate(role === "admin" ? "/admin" : "/professional/dashboard")
        return
      }

      const portal = role === "admin" || loginEmail === "admin@healthitude.com" ? "admin" : "professional"
      await login({ email: loginEmail.trim(), password: loginPassword }, portal)
      navigate(role === "admin" ? "/admin" : "/professional/dashboard")
    } catch (err: any) {
      const detailed = explainError(err, "Authentication failed. Please verify your credentials.")
      setErrorMsg(detailed)
    } finally {
      setIsLoading(false)
    }
  }

  function validateStep(curStep: number): boolean {
    const errs: Record<string, string> = {}
    if (curStep === 1) {
      if (!form.firstName.trim()) errs.firstName = "First name is required"
      if (!form.lastName.trim()) errs.lastName = "Last name is required"
      if (!form.email.trim() || !form.email.includes("@"))
        errs.email = "Valid email address required"
      if (!form.phoneNumber.trim()) errs.phoneNumber = "Phone number is required"
      
      // Password strength validation & confirmation check
      if (!form.password) {
        errs.password = "Password is required"
      } else if (!isPasswordStrong(form.password)) {
        errs.password = "Password must turn green (satisfy all strength criteria) to continue"
      }

      if (!isPasswordStrong(form.password)) {
        errs.confirmPassword = "Confirmation is locked until the password check turns green"
      } else if (!form.confirmPassword) {
        errs.confirmPassword = "Confirm password is required"
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords do not match"
      }
    } else if (curStep === 2) {
      if (role !== "admin") {
        if (!form.licenceNumber.trim())
          errs.licenceNumber = "Licence / registration number required"
        if (!form.licenceExpiry)
          errs.licenceExpiry = "Licence expiry date required"
      }
    } else if (curStep === 3) {
      const allChecked = consents.every(Boolean)
      if (!allChecked) {
        setErrorMsg("Please accept all professional declarations and agreements to continue.")
        return false
      }
    }

    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      // Explain specific errors in one line
      const errorList = Object.entries(errs).map(([field, message]) => ({ field, message }))
      setErrorMsg(explainError({ errors: errorList }, "Please complete all required fields correctly."))
      return false
    }
    setErrorMsg(null)
    return true
  }

  async function handleRegisterSubmit() {
    if (!validateStep(3)) return

    setIsLoading(true)
    setErrorMsg(null)

    try {
      await api.professional.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        category: form.category,
        specialty: form.specialty.trim() || undefined,
        licenceNumber: form.licenceNumber.trim(),
        licenceExpiry: form.licenceExpiry || undefined,
        regulatoryBody: form.regulatoryBody.trim() || undefined,
        facility: form.facility.trim() || undefined,
      })

      setDone(true)
    } catch (err: any) {
      const detailed = explainError(err, "Registration failed. Please check your details.")
      setErrorMsg(detailed)
      const mapped = extractFieldErrors(err)
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleContinue() {
    if (validateStep(step)) {
      if (step < TOTAL) {
        setStep(step + 1)
      } else {
        handleRegisterSubmit()
      }
    }
  }

  function switchMode(m: "login" | "register") {
    setMode(m)
    setStep(1)
    setDone(false)
    setErrorMsg(null)
    setFieldErrors({})
    navigate(m === "login" ? "/professional/login" : "/professional/register", {
      replace: true,
    })
  }

  const BG =
    "https://images.unsplash.com/photo-1778918006429-9212a04d2177?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxkb2N0b3IlMjB1c2luZyUyMGxhcHRvcCUyMGhvc3BpdGFsJTIwbWVkaWNhbCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3ODk0NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-10 px-6 overflow-y-auto">
      {/* Background Image */}
      <img
        src={BG}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          zIndex: 0,
          filter: "blur(6px) brightness(0.4)",
          transform: "scale(1.08)",
        }}
      />
      {/* Dark overlay */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 1,
          background: "linear-gradient(160deg, #0d1b4bdd 0%, #1a3fcfbb 100%)",
        }}
      />

      {/* Healthitude Logo */}
      <Link to="/" className="relative mb-6" style={{ zIndex: 2 }}>
        <img
          src={logoWhite}
          alt="Healthitude"
          className="h-12 object-contain hover:opacity-80 transition-opacity"
        />
      </Link>

      {/* Main Card */}
      <div
        className="relative bg-white shadow-2xl w-full p-8 rounded-none"
        style={{
          zIndex: 2,
          maxWidth: mode === "register" && !done ? "540px" : "440px",
        }}
      >
        {/* Portal Header */}
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Professional Portal
          </span>
          <span className="flex-1" />
          <Link to="/" className="text-xs text-blue-600 hover:underline">
            Wrong portal?
          </Link>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 mb-7">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 text-sm font-medium transition-all rounded-none ${
              mode === "login"
                ? "bg-white shadow text-blue-700 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-2 text-sm font-medium transition-all rounded-none ${
              mode === "register"
                ? "bg-white shadow text-blue-700 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === "login" && (
          <div className="space-y-5">
            <div>
              <h2
                className="font-display text-2xl font-bold"
                style={{ color: "#0d1b4b" }}
              >
                Professional sign in
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Authenticate with your verified credentials or select an administrator account.
              </p>
            </div>

            <Field label="Email address" required>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick role credentials
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROF_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRoleChange(r.value)}
                    className={`py-2 px-3 text-xs font-medium border transition-all rounded-none ${
                      role === r.value
                        ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-send !w-full !py-3 text-white font-semibold rounded-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 btn-arrow" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              <button
                type="button"
                className="text-blue-600 hover:underline rounded-none"
              >
                Forgot your password?
              </button>
            </p>
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === "register" && !done && (
          <div className="space-y-5">
            {step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Category
                </label>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {PROF_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleRoleChange(r.value)}
                      className={`py-2 px-3 text-xs font-medium border transition-all rounded-none ${
                        role === r.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2
                  className="font-display text-xl font-bold"
                  style={{ color: "#0d1b4b" }}
                >
                  {stepLabels[step - 1]}
                </h2>
                <span className="text-xs text-gray-400">
                  Step {step} of {TOTAL}
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 transition-all"
                    style={{ background: i < step ? BLUE : "#e5e7eb" }}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Account & Identity */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" required error={fieldErrors.firstName}>
                    <Input
                      value={form.firstName}
                      onChange={(e) => updateFormField("firstName", e.target.value)}
                      placeholder="Kofi"
                    />
                  </Field>
                  <Field label="Last name" required error={fieldErrors.lastName}>
                    <Input
                      value={form.lastName}
                      onChange={(e) => updateFormField("lastName", e.target.value)}
                      placeholder="Boateng"
                    />
                  </Field>
                </div>

                <Field label="Email address" required error={fieldErrors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateFormField("email", e.target.value)}
                    placeholder="doctor@example.com"
                  />
                </Field>

                <Field label="Phone number" required error={fieldErrors.phoneNumber}>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => updateFormField("phoneNumber", e.target.value)}
                    placeholder="+233 24 000 0000"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Password" required error={fieldErrors.password}>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateFormField("password", e.target.value)}
                      placeholder="Min. 8 chars (letters, numbers, symbols)"
                    />
                  </Field>
                  <Field
                    label="Confirm password"
                    required
                    error={
                      form.confirmPassword && form.password === form.confirmPassword
                        ? undefined
                        : fieldErrors.confirmPassword
                    }
                  >
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateFormField("confirmPassword", e.target.value)}
                      placeholder={
                        isPasswordStrong(form.password)
                          ? "Re-enter your password"
                          : "Locked until password turns green"
                      }
                      disabled={!isPasswordStrong(form.password)}
                    />
                    {!isPasswordStrong(form.password) ? (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Turn password <strong className="text-emerald-700">green (strong)</strong> to enable confirmation.
                      </p>
                    ) : form.confirmPassword && form.password === form.confirmPassword ? (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        Passwords match
                      </p>
                    ) : null}
                  </Field>
                </div>

                {/* Password Strength Colour Check */}
                <PasswordStrengthIndicator password={form.password} />

                <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-800">
                  Registering as <strong>{PROF_ROLES.find((r) => r.value === role)?.label}</strong>.
                  All professional accounts default to <strong>PENDING</strong> verification status until
                  reviewed by a platform administrator.
                </div>
              </div>
            )}

            {/* STEP 2: Professional Credentials */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Profession">
                    <Select
                      value={form.category}
                      onChange={(e) => updateFormField("category", e.target.value)}
                      options={[
                        { value: "DOCTOR", label: "Doctor (MBChB / MD)" },
                        { value: "NURSE", label: "Registered Nurse" },
                        { value: "PHARMACIST", label: "Pharmacist" },
                        { value: "SPECIALIST", label: "Specialist Consultant" },
                      ]}
                    />
                  </Field>
                  <Field label="Specialty / Area">
                    <Input
                      value={form.specialty}
                      onChange={(e) => updateFormField("specialty", e.target.value)}
                      placeholder="e.g. General Practice"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Licence / Registration number"
                    required
                    error={fieldErrors.licenceNumber}
                  >
                    <Input
                      value={form.licenceNumber}
                      onChange={(e) => updateFormField("licenceNumber", e.target.value)}
                      placeholder="GMA-2026-XXXXX"
                    />
                  </Field>
                  <Field
                    label="Licence expiry date"
                    required
                    error={fieldErrors.licenceExpiry}
                  >
                    <Input
                      type="date"
                      value={form.licenceExpiry}
                      onChange={(e) => updateFormField("licenceExpiry", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Regulatory body / Council">
                  <Input
                    value={form.regulatoryBody}
                    onChange={(e) => updateFormField("regulatoryBody", e.target.value)}
                    placeholder="e.g. Ghana Medical Association"
                  />
                </Field>

                <Field label="Current facility / Affiliation">
                  <Input
                    value={form.facility}
                    onChange={(e) => updateFormField("facility", e.target.value)}
                    placeholder="e.g. Korle Bu Teaching Hospital"
                  />
                </Field>

                <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Verification ensures only genuine, qualified professionals access platform clinical tools.
                  Unverified professionals cannot view patient records or issue prescriptions.
                </div>
              </div>
            )}

            {/* STEP 3: Consent & Agreements */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-2">
                  Please review and accept all professional commitments before finalizing registration.
                </p>

                {[
                  "I confirm I am a licensed healthcare professional and the credentials provided are accurate.",
                  "I agree to Healthitude's Professional Terms of Service and Clinical Privacy Policy.",
                  "I consent to administrative verification of my credentials with relevant regulatory bodies.",
                  "I understand I may only access patient records within authorized clinical workflows.",
                  "I acknowledge all clinical actions are logged in an immutable audit trail.",
                ].map((text, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 cursor-pointer p-2.5 border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={consents[i]}
                      onChange={(e) => {
                        const next = [...consents]
                        next[i] = e.target.checked
                        setConsents(next)
                      }}
                      className="mt-0.5 h-4 w-4 rounded-none border-gray-300 accent-blue-600 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-600 leading-snug">{text}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                  className="btn-underline flex-1 !py-2.5 rounded-none"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className="btn-send flex-1 !py-2.5 text-white font-semibold rounded-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>{step < TOTAL ? "Continue" : "Create Professional Account"}</span>
                    <ArrowRight className="w-4 h-4 btn-arrow" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VERIFICATION PENDING SUCCESS */}
        {mode === "register" && done && (
          <VerificationPending
            registeredEmail={form.email}
            onEnter={() => navigate("/professional/dashboard")}
          />
        )}
      </div>
    </div>
  )
}