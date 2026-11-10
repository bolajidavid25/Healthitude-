import { useState } from "react"
import { ArrowRight } from "lucide-react"
import logoImg from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"

type Role = "patient" | "doctor" | "nurse" | "pharmacist" | "admin"

interface AuthPageProps {
  onLogin: (role: Role) => void
}

const roles = [
  { value: "patient" as Role, label: "Patient" },
  { value: "doctor" as Role, label: "Doctor" },
  { value: "nurse" as Role, label: "Nurse" },
  { value: "pharmacist" as Role, label: "Pharmacist" },
  { value: "admin" as Role, label: "Administrator" },
]

const PATIENT_CATEGORIES = [
  { value: "NURSING_MOTHER", label: "Nursing / Breastfeeding Mother" },
  { value: "ELDERLY", label: "Elderly" },
  { value: "STUDENT", label: "Student" },
  { value: "CIVIL_SERVANT", label: "Civil Servant" },
  { value: "CORPORATE", label: "Corporate / Company Member" },
  { value: "NHIS", label: "NHIS User" },
  { value: "INSURANCE", label: "Insurance Member" },
  { value: "GENERAL", label: "General Patient" },
]

const CATEGORY_EVIDENCE: Record<string, {
  label: string
  placeholder: string
}[]> = {
  STUDENT: [
    {
      label: "Institution / University",
      placeholder: "e.g. University of Ghana",
    },
    { label: "Student ID number", placeholder: "e.g. UG/2023/0041" },
    { label: "Programme of study", placeholder: "e.g. BSc. Nursing" },
    { label: "Expected graduation year", placeholder: "e.g. 2026" },
  ],
  NHIS: [
    { label: "NHIS ID number", placeholder: "e.g. GH-NHIS-20240088341" },
    { label: "Scheme type", placeholder: "e.g. NHIS, DMHIS" },
  ],
  CIVIL_SERVANT: [
    {
      label: "Ministry / Agency / Department",
      placeholder: "e.g. Ghana Health Service",
    },
    { label: "Employee / Staff ID", placeholder: "e.g. GHS-2018-44120" },
  ],
  CORPORATE: [
    { label: "Company / Organisation", placeholder: "e.g. Tullow Ghana Ltd" },
    { label: "Employee / Member ID", placeholder: "e.g. TGL-EMP-00821" },
  ],
  INSURANCE: [
    { label: "Insurance company", placeholder: "e.g. Enterprise Life" },
    { label: "Policy / Member number", placeholder: "e.g. EL-2024-POL-88291" },
    { label: "Coverage type", placeholder: "e.g. Comprehensive, Inpatient" },
  ],
  ELDERLY: [
    {
      label: "Date of birth (for age verification)",
      placeholder: "Will be pre-filled from Step 1",
    },
  ],
  NURSING_MOTHER: [
    {
      label: "Expected / actual delivery date",
      placeholder: "e.g. March 2026",
    },
  ],
  GENERAL: [],
}

const TOTAL_PATIENT_STEPS = 4
const TOTAL_PROF_STEPS = 3

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({
  placeholder,
  type = "text",
  defaultValue,
}: {
  placeholder?: string
  type?: string
  defaultValue?: string
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function Select({
  options,
  placeholder,
}: {
  options: { value: string label: string }[]
  placeholder?: string
}) {
  return (
    <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Step labels ────────────────────────────────────────────────────────────────

function patientStepLabel(step: number) {
  return (
    [
      "Account & Identity",
      "Personal & Emergency Contact",
      "Patient Category",
      "Consent & Agreements",
    ][step - 1] ?? ""
  )
}

function profStepLabel(step: number) {
  return (
    ["Account & Identity", "Professional Credentials", "Consent & Agreements"][
      step - 1
    ] ?? ""
  )
}

// ── Patient registration steps ─────────────────────────────────────────────────

function PatientStep1() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="First name" required>
          <Input placeholder="Ama" />
        </Field>
        <Field label="Middle name">
          <Input placeholder="Akua" />
        </Field>
        <Field label="Last name" required>
          <Input placeholder="Mensah" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth" required>
          <Input type="date" />
        </Field>
        <Field label="Sex" required>
          <Select
            placeholder="Select"
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "prefer_not", label: "Prefer not to say" },
            ]}
          />
        </Field>
      </div>
      <Field label="Email address" required>
        <Input type="email" placeholder="ama@example.com" />
      </Field>
      <Field label="Phone number" required>
        <Input placeholder="+233 24 000 0000" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
        <Field label="Confirm password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
      </div>
    </div>
  )
}

function PatientStep2() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Residential Address
        </p>
        <div className="space-y-3">
          <Field label="Street / House address" required>
            <Input placeholder="12 Independence Ave" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City / Town" required>
              <Input placeholder="Accra" />
            </Field>
            <Field label="Region / State" required>
              <Input placeholder="Greater Accra" />
            </Field>
            <Field label="LGA / District">
              <Input placeholder="Ayawaso West" />
            </Field>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Emergency Contact
        </p>
        <p className="text-xs text-gray-400 mb-3">
          This person will be used in your Break-Glass emergency snapshot.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" required>
              <Input placeholder="Kofi Mensah" />
            </Field>
            <Field label="Relationship" required>
              <Select
                placeholder="Select"
                options={[
                  { value: "spouse", label: "Spouse / Partner" },
                  { value: "parent", label: "Parent" },
                  { value: "sibling", label: "Sibling" },
                  { value: "child", label: "Child" },
                  { value: "friend", label: "Friend" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Field>
          </div>
          <Field label="Phone number" required>
            <Input placeholder="+233 20 555 0101" />
          </Field>
        </div>
      </div>
    </div>
  )
}

function PatientStep3({
  category,
  setCategory,
}: {
  category: string
  setCategory: (c: string) => void
}) {
  const evidence = CATEGORY_EVIDENCE[category] ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 mb-1">
          Healthitude assigns you <strong>exactly one</strong> active billing
          category. If you qualify for several, the system applies a precedence
          rule — select the one that best describes your primary eligibility.
        </p>
      </div>

      <Field label="Pricing category" required>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
        >
          {PATIENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {evidence.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
            Evidence required for{" "}
            {PATIENT_CATEGORIES.find((c) => c.value === category)?.label}
          </p>
          {evidence.map((f) => (
            <Field key={f.label} label={f.label}>
              <Input placeholder={f.placeholder} />
            </Field>
          ))}
          <p className="text-xs text-blue-600 mt-1">
            You can upload supporting documents after registration. Your
            category will remain <strong>pending verification</strong> until
            reviewed.
          </p>
        </div>
      )}

      {category === "GENERAL" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          General Patient is the default category. No evidence is required. You
          can request a category change from your profile once registered.
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        This category is a{" "}
        <strong>financial/billing classification only</strong> — it does not
        affect your clinical priority or the urgency of your care.
      </div>
    </div>
  )
}

function PatientStep4() {
  const consents = [
    {
      id: "terms",
      text: "I agree to the Healthitude Terms of Service and Privacy Policy.",
    },
    {
      id: "data",
      text: "I consent to secure storage and processing of my health information for the purpose of healthcare continuity.",
    },
    {
      id: "professional",
      text: "I consent to authorized healthcare professionals accessing my records within their permitted scope.",
    },
    {
      id: "reported",
      text: "I understand that information I enter myself is patient-reported and is not clinically verified until reviewed by a qualified healthcare professional.",
    },
    {
      id: "ai",
      text: "I acknowledge that the Healthitude AI assistant provides general health information only and cannot diagnose, prescribe, or replace professional medical advice.",
    },
    {
      id: "breakglass",
      text: "I understand that initiating a Break-Glass emergency request will share a controlled snapshot of my health information with a verified responding doctor.",
    },
    {
      id: "accuracy",
      text: "I confirm that the information I have provided during registration is accurate to the best of my knowledge.",
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Please read and accept all agreements to complete your registration.
      </p>
      {consents.map((c) => (
        <label
          key={c.id}
          className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-600 leading-snug">{c.text}</span>
        </label>
      ))}
    </div>
  )
}

// ── Professional registration steps ───────────────────────────────────────────

function ProfStep1({ role }: { role: Role }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" required>
          <Input placeholder="Kofi" />
        </Field>
        <Field label="Last name" required>
          <Input placeholder="Boateng" />
        </Field>
      </div>
      <Field label="Email address" required>
        <Input type="email" placeholder="dr.boateng@example.com" />
      </Field>
      <Field label="Phone number" required>
        <Input placeholder="+233 24 000 0000" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
        <Field label="Confirm password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        You are registering as a{" "}
        <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>. Your
        account will be created immediately, but clinical privileges require
        verification of your credentials in Step 2.
      </div>
    </div>
  )
}

function ProfStep2({ role }: { role: Role }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Profession">
          <Select
            options={[
              { value: "doctor", label: "Doctor (MD/MBChB)" },
              { value: "nurse", label: "Registered Nurse" },
              { value: "pharmacist", label: "Pharmacist" },
              { value: "records", label: "Records Officer" },
            ]}
          />
        </Field>
        <Field label="Specialty / Area">
          <Input
            placeholder={
              role === "doctor"
                ? "e.g. General Practice"
                : role === "nurse"
                  ? "e.g. Perioperative"
                  : "e.g. Clinical Pharmacy"
            }
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Licence / Registration number" required>
          <Input
            placeholder={
              role === "doctor"
                ? "GMA-2021-XXXXX"
                : role === "pharmacist"
                  ? "PC-2020-XXXXX"
                  : "GNC-2022-XXXXX"
            }
          />
        </Field>
        <Field label="Licence expiry date" required>
          <Input type="date" />
        </Field>
      </div>
      <Field label="Regulatory body / Council">
        <Input
          placeholder={
            role === "doctor"
              ? "Ghana Medical Association"
              : role === "pharmacist"
                ? "Pharmacy Council of Ghana"
                : "Ghana Nurses & Midwives Council"
          }
        />
      </Field>
      <Field label="Current facility / Affiliation">
        <Input placeholder="e.g. Korle Bu Teaching Hospital" />
      </Field>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        You will be asked to upload your licence document and ID after
        registration. Clinical privileges will remain <strong>suspended</strong>{" "}
        until verification is approved by a Healthitude reviewer.
      </div>
    </div>
  )
}

function ProfStep3() {
  const consents = [
    {
      id: "terms",
      text: "I agree to the Healthitude Terms of Service and Privacy Policy.",
    },
    {
      id: "professional_conduct",
      text: "I confirm I am a licensed and currently active healthcare professional and that the credentials I have provided are accurate.",
    },
    {
      id: "data",
      text: "I consent to Healthitude verifying my professional credentials and storing my identity and credential information for the purpose of platform access and audit.",
    },
    {
      id: "scope",
      text: "I understand I may only access patient records within my verified professional scope and authorized relationships.",
    },
    {
      id: "audit",
      text: "I acknowledge that my clinical actions on the platform are audited and I remain professionally accountable for all records I create or modify.",
    },
  ]

  return (
    <div className="space-y-3">
      {consents.map((c) => (
        <label
          key={c.id}
          className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-600 leading-snug">{c.text}</span>
        </label>
      ))}
    </div>
  )
}

// ── Verification pending screen ────────────────────────────────────────────────

function VerificationPending({
  role,
  onLogin,
}: {
  role: Role
  onLogin: (r: Role) => void
}) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-gray-900">
          Account created
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {role === "patient"
            ? "A verification email has been sent. Your pricing category is pending admin review."
            : "Your account is created. Clinical privileges are pending credential verification."}
        </p>
      </div>
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 text-left space-y-2.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Next steps
        </p>
        {role === "patient" ? (
          <>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <span>Verify your email address</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <span>Verify your phone number</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <span>Upload category evidence (if required)</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                4
              </span>
              <span>Access your dashboard</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <span>Verify your email address</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <span>Upload your licence &amp; ID documents</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <span>Await verification review</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                4
              </span>
              <span>Clinical privileges activate on approval</span>
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => onLogin(role)}
        className="btn-send !w-full !py-3 text-white font-semibold"
      >
        <span>Go to Dashboard</span>
        <ArrowRight className="w-4 h-4 btn-arrow" />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [role, setRole] = useState<Role>("patient")
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState("NHIS")
  const [done, setDone] = useState(false)

  const isPatient = role === "patient"
  const totalSteps = isPatient ? TOTAL_PATIENT_STEPS : TOTAL_PROF_STEPS

  const stepLabel = isPatient ? patientStepLabel(step) : profStepLabel(step)

  function reset(newMode: "login" | "register") {
    setMode(newMode)
    setStep(1)
    setDone(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10"
      style={{ background: "#f7f9ff" }}
    >
      <div
        className="flex flex-col items-center w-full px-6"
        style={{ maxWidth: mode === "register" && !done ? "560px" : "448px" }}
      >
        <img
          src={logoImg}
          alt="Healthitude"
          className="h-12 object-contain mb-8"
        />

        <div className="bg-white rounded-2xl shadow-xl w-full p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-7">
            <button
              onClick={() => reset("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-white shadow text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => reset("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "register"
                  ? "bg-white shadow text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Register
            </button>
          </div>

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div className="space-y-5">
              <div>
                <h2
                  className="font-display text-2xl font-bold"
                  style={{ color: "#0d1b4b" }}
                >
                  Welcome back
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sign in to your Healthitude account
                </p>
              </div>
              <Field label="Email address" required>
                <Input
                  type="email"
                  defaultValue="patient@healthitude.com"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  defaultValue="••••••••"
                  placeholder="••••••••"
                />
              </Field>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign in as
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        role === r.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onLogin(role)}
                className="btn-send !w-full !py-3 text-white font-semibold"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 btn-arrow" />
              </button>
              <p className="text-center text-sm text-gray-500">
                <button className="text-blue-600 hover:underline">
                  Forgot your password?
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && !done && (
            <div className="space-y-5">
              {/* Role selector — shown only on step 1 */}
              {step === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registering as
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setRole(r.value)
                          setStep(1)
                        }}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                          role === r.value
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-blue-300"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2
                    className="font-display text-xl font-bold"
                    style={{ color: "#0d1b4b" }}
                  >
                    {stepLabel}
                  </h2>
                  <span className="text-xs text-gray-400">
                    Step {step} of {totalSteps}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i < step ? "#1a3fcf" : "#e5e7eb" }}
                    />
                  ))}
                </div>
              </div>

              {/* Step content */}
              {isPatient ? (
                <>
                  {step === 1 && <PatientStep1 />}
                  {step === 2 && <PatientStep2 />}
                  {step === 3 && (
                    <PatientStep3
                      category={category}
                      setCategory={setCategory}
                    />
                  )}
                  {step === 4 && <PatientStep4 />}
                </>
              ) : (
                <>
                  {step === 1 && <ProfStep1 role={role} />}
                  {step === 2 && <ProfStep2 role={role} />}
                  {step === 3 && <ProfStep3 />}
                </>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-1">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="btn-underline flex-1 !py-2.5"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() =>
                    step < totalSteps ? setStep(step + 1) : setDone(true)
                  }
                  className="btn-send flex-1 !py-2.5 text-white font-semibold"
                >
                  <span>{step < totalSteps ? "Continue" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4 btn-arrow" />
                </button>
              </div>
            </div>
          )}

          {/* ── POST-REGISTRATION ── */}
          {mode === "register" && done && (
            <VerificationPending role={role} onLogin={onLogin} />
          )}
        </div>
      </div>
    </div>
  )
}
