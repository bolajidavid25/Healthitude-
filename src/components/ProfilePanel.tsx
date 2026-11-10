import { useState, useEffect } from "react"
import { api, PatientProfileResponse } from "@/utils/api"
import {
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  Shield,
  HeartPulse,
  FileText,
  Lock,
  Award,
  Check,
} from "lucide-react"

type Role = "patient" | "doctor" | "nurse" | "pharmacist" | "admin"

const BLUE = "#1a3fcf"

const roleNames: Record<Role, { first: string middle?: string last: string }> =
  {
    patient: { first: "Ama", middle: "Akua", last: "Mensah" },
    doctor: { first: "Kofi", last: "Boateng" },
    nurse: { first: "Afua", last: "Darko" },
    pharmacist: { first: "Kwame", last: "Adu" },
    admin: { first: "Sylvia", last: "Yeboah" },
  }

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

function SectionCard({
  title,
  children,
  onSave,
}: {
  title: string
  children: React.ReactNode
  onSave?: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
      {children}
      {onSave && (
        <div className="pt-1">
          <button
            onClick={onSave}
            className="px-5 py-2 rounded-none text-white text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98] shadow-sm cursor-pointer"
            style={{ background: BLUE }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({
  defaultValue,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  defaultValue?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        disabled
          ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
          : "border-gray-200 text-gray-800"
      }`}
    />
  )
}

function Select({
  defaultValue,
  value,
  onChange,
  options,
  disabled,
}: {
  defaultValue?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
        disabled
          ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
          : "border-gray-200 text-gray-800"
      }`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Patient profile tabs ───────────────────────────────────────────────────────

type PatientTab = "identity" | "personal" | "health" | "category" | "consents" | "security"

function PatientProfile() {
  const [tab, setTab] = useState<PatientTab>("identity")
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    section: string
    text: string
    isError?: boolean
  } | null>(null)

  const [identityData, setIdentityData] = useState({
    firstName: "Ama",
    middleName: "Akua",
    lastName: "Mensah",
    phoneNumber: "+233 24 000 0000",
  })

  const [addressData, setAddressData] = useState({
    street: "12 Independence Ave",
    city: "Accra",
    state: "Greater Accra",
    district: "Ayawaso West",
  })

  const [emergencyData, setEmergencyData] = useState({
    fullName: "Kofi Mensah",
    relationship: "spouse",
    phoneNumber: "+233 20 555 0101",
  })

  const [healthData, setHealthData] = useState({
    bloodGroup: "O+",
    genotype: "AA",
    knownAllergies: "Penicillin",
    medicalConditions: "Hypertension (diagnosed 2021)",
    currentMedications: "Lisinopril 10mg once daily",
    previousSurgeries: "",
    medicalHistory: "",
  })

  useEffect(() => {
    let active = true
    api.patient
      .getProfile()
      .then((data) => {
        if (!active || !data) return
        setProfile(data)
        if (data.user) {
          setIdentityData({
            firstName: data.user.firstName || "",
            middleName: data.user.middleName || "",
            lastName: data.user.lastName || "",
            phoneNumber: data.user.phoneNumber || "",
          })
        }
        if (data.address) {
          setAddressData({
            street: data.address.street || "",
            city: data.address.city || "",
            state: data.address.state || "",
            district: data.address.district || "",
          })
        }
        if (data.emergencyContact) {
          setEmergencyData({
            fullName: data.emergencyContact.fullName || "",
            relationship:
              data.emergencyContact.relationship?.toLowerCase() || "spouse",
            phoneNumber: data.emergencyContact.phoneNumber || "",
          })
        }
        if (data.healthProfile) {
          setHealthData({
            bloodGroup: data.healthProfile.bloodGroup || "unknown",
            genotype: data.healthProfile.genotype || "unknown",
            knownAllergies: data.healthProfile.knownAllergies || "",
            medicalConditions: data.healthProfile.medicalConditions || "",
            currentMedications: data.healthProfile.currentMedications || "",
            previousSurgeries: data.healthProfile.previousSurgeries || "",
            medicalHistory: data.healthProfile.medicalHistory || "",
          })
        }
      })
      .catch(() => {
        // Fall back to initial defaults
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSaveIdentity() {
    setStatusMessage(null)
    try {
      await api.patient.updateProfile({
        identity: {
          firstName: identityData.firstName.trim() || undefined,
          middleName: identityData.middleName.trim() || undefined,
          lastName: identityData.lastName.trim() || undefined,
          phoneNumber: identityData.phoneNumber.trim() || undefined,
        },
      })
      setStatusMessage({
        section: "identity",
        text: "Account & Identity saved successfully.",
      })
    } catch (err: any) {
      setStatusMessage({
        section: "identity",
        text: err.message || "Failed to update identity.",
        isError: true,
      })
    }
  }

  async function handleSaveAddress() {
    setStatusMessage(null)
    try {
      await api.patient.updateProfile({
        address: {
          street: addressData.street.trim() || undefined,
          city: addressData.city.trim() || undefined,
          state: addressData.state.trim() || undefined,
          district: addressData.district.trim() || undefined,
        },
      })
      setStatusMessage({
        section: "personal",
        text: "Address saved successfully.",
      })
    } catch (err: any) {
      setStatusMessage({
        section: "personal",
        text: err.message || "Failed to update address.",
        isError: true,
      })
    }
  }

  async function handleSaveEmergency() {
    setStatusMessage(null)
    try {
      await api.patient.updateProfile({
        emergencyContact: {
          fullName: emergencyData.fullName.trim() || undefined,
          relationship: emergencyData.relationship as any,
          phoneNumber: emergencyData.phoneNumber.trim() || undefined,
        },
      })
      setStatusMessage({
        section: "personal",
        text: "Emergency contact saved successfully.",
      })
    } catch (err: any) {
      setStatusMessage({
        section: "personal",
        text: err.message || "Failed to update emergency contact.",
        isError: true,
      })
    }
  }

  async function handleSaveHealth() {
    setStatusMessage(null)
    try {
      await api.patient.updateProfile({
        healthProfile: {
          bloodGroup:
            healthData.bloodGroup === "unknown"
              ? undefined
              : healthData.bloodGroup as any,
          genotype:
            healthData.genotype === "unknown"
              ? undefined
              : healthData.genotype as any,
          knownAllergies: healthData.knownAllergies.trim() || undefined,
          medicalConditions: healthData.medicalConditions.trim() || undefined,
          currentMedications: healthData.currentMedications.trim() || undefined,
          previousSurgeries: healthData.previousSurgeries.trim() || undefined,
          medicalHistory: healthData.medicalHistory.trim() || undefined,
        },
      })
      setStatusMessage({
        section: "health",
        text: "Health profile saved successfully.",
      })
    } catch (err: any) {
      setStatusMessage({
        section: "health",
        text: err.message || "Failed to update health profile.",
        isError: true,
      })
    }
  }

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })

  async function handleSavePassword() {
    setStatusMessage(null)
    if (!passwordData.currentPassword) {
      setStatusMessage({
        section: "security",
        text: "Please enter your current password.",
        isError: true,
      })
      return
    }
    if (!passwordData.newPassword) {
      setStatusMessage({
        section: "security",
        text: "Please enter a new password.",
        isError: true,
      })
      return
    }
    if (passwordData.newPassword.length < 8) {
      setStatusMessage({
        section: "security",
        text: "New password must be at least 8 characters long.",
        isError: true,
      })
      return
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setStatusMessage({
        section: "security",
        text: "New passwords do not match.",
        isError: true,
      })
      return
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setStatusMessage({
        section: "security",
        text: "New password must be different from your current password.",
        isError: true,
      })
      return
    }

    try {
      await api.patient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      })
      setStatusMessage({
        section: "security",
        text: "Password changed successfully.",
      })
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      })
    } catch (err: any) {
      setStatusMessage({
        section: "security",
        text:
          err?.message ||
          "Failed to change password. Please verify your current password.",
        isError: true,
      })
    }
  }

  const tabs: { id: PatientTab label: string icon: React.ReactNode }[] = [
    {
      id: "identity",
      label: "Account & Identity",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "personal",
      label: "Personal & Emergency",
      icon: <Phone className="w-4 h-4" />,
    },
    {
      id: "health",
      label: "Health Profile",
      icon: <HeartPulse className="w-4 h-4" />,
    },
    {
      id: "category",
      label: "Pricing Category",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "consents",
      label: "Consents",
      icon: <FileText className="w-4 h-4" />,
    },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
  ]

  const categoryName = profile?.patientCategory?.category
    ? profile.patientCategory.category.replace(/_/g, " ")
    : "NHIS User"
  const categoryStatus =
    profile?.patientCategory?.verificationStatus || "PENDING"

  const consentsList =
    profile?.consents && profile.consents.length > 0
      ? profile.consents.map((c) => ({
          text: c.consentType.replace(/_/g, " "),
          date: c.acceptedAt
            ? new Date(c.acceptedAt).toLocaleDateString()
            : "Active",
          version: c.version ? `v${c.version}` : "v1.0",
          accepted: c.accepted,
        }))
      : [
          {
            text: "Terms of Service and Privacy Policy",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "Healthcare data storage and processing consent",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "Authorized healthcare professionals may access records within their permitted scope",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "Patient-reported information is not clinically verified until reviewed by a professional",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "AI assistant provides general information only — not diagnosis or prescription",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "Break-Glass emergency request shares a controlled health snapshot with a verified doctor",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
          {
            text: "Information provided during registration is accurate to the best of my knowledge",
            date: "Registration",
            version: "v1.0",
            accepted: true,
          },
        ]

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1.5 bg-white border border-gray-100 rounded-xl p-1.5 shadow-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setStatusMessage(null)
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
              tab === t.id
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            style={tab === t.id ? { background: BLUE } : {}}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {statusMessage && statusMessage.section === tab && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 shadow-sm ${
            statusMessage.isError
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {statusMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── Account & Identity ── */}
      {tab === "identity" && (
        <SectionCard title="Account & Identity" onSave={handleSaveIdentity}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="First name" required>
              <Input
                value={identityData.firstName}
                onChange={(e) =>
                  setIdentityData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Middle name">
              <Input
                value={identityData.middleName}
                onChange={(e) =>
                  setIdentityData((prev) => ({
                    ...prev,
                    middleName: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={identityData.lastName}
                onChange={(e) =>
                  setIdentityData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Date of birth"
              required
              hint="Verified on registration (read-only)"
            >
              <Input
                type="date"
                defaultValue={
                  profile?.user?.dateOfBirth
                    ? profile.user.dateOfBirth.slice(0, 10)
                    : "1992-06-14"
                }
                disabled
              />
            </Field>
            <Field
              label="Sex"
              required
              hint="Recorded during registration (read-only)"
            >
              <Input defaultValue={profile?.user?.sex || "FEMALE"} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Email address"
              required
              hint="Account primary identifier (read-only)"
            >
              <Input
                type="email"
                defaultValue={profile?.user?.email || "patient@healthitude.com"}
                disabled
              />
            </Field>
            <Field
              label="Phone number"
              required
              hint="Used for account and emergency contact"
            >
              <Input
                value={identityData.phoneNumber}
                onChange={(e) =>
                  setIdentityData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* ── Personal & Emergency ── */}
      {tab === "personal" && (
        <div className="space-y-5">
          <SectionCard title="Residential Address" onSave={handleSaveAddress}>
            <Field label="Street / House address" required>
              <Input
                value={addressData.street}
                onChange={(e) =>
                  setAddressData((prev) => ({
                    ...prev,
                    street: e.target.value,
                  }))
                }
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="City / Town" required>
                <Input
                  value={addressData.city}
                  onChange={(e) =>
                    setAddressData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Region / State" required>
                <Input
                  value={addressData.state}
                  onChange={(e) =>
                    setAddressData((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="LGA / District">
                <Input
                  value={addressData.district}
                  onChange={(e) =>
                    setAddressData((prev) => ({
                      ...prev,
                      district: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Emergency Contact" onSave={handleSaveEmergency}>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 -mt-1">
              This contact is included in your Break-Glass emergency snapshot
              shared with a responding verified doctor.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" required>
                <Input
                  value={emergencyData.fullName}
                  onChange={(e) =>
                    setEmergencyData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Relationship" required>
                <Select
                  value={emergencyData.relationship}
                  onChange={(v) =>
                    setEmergencyData((prev) => ({ ...prev, relationship: v }))
                  }
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
              <Input
                value={emergencyData.phoneNumber}
                onChange={(e) =>
                  setEmergencyData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
              />
            </Field>
          </SectionCard>
        </div>
      )}

      {/* ── Health Profile ── */}
      {tab === "health" && (
        <div className="space-y-5">
          <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <svg
              className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Patient-reported information.</strong> The details below
              were entered by you and have not been clinically verified. They
              become verified only when reviewed and confirmed by an authorized
              healthcare professional.
            </span>
          </div>

          <SectionCard title="Blood & Genetics" onSave={handleSaveHealth}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood group" hint="Patient-reported">
                <Select
                  value={healthData.bloodGroup}
                  onChange={(v) =>
                    setHealthData((prev) => ({ ...prev, bloodGroup: v }))
                  }
                  options={[
                    { value: "A+", label: "A+" },
                    { value: "A-", label: "A−" },
                    { value: "B+", label: "B+" },
                    { value: "B-", label: "B−" },
                    { value: "AB+", label: "AB+" },
                    { value: "AB-", label: "AB−" },
                    { value: "O+", label: "O+" },
                    { value: "O-", label: "O−" },
                    { value: "unknown", label: "I don't know" },
                  ]}
                />
              </Field>
              <Field label="Genotype" hint="Patient-reported">
                <Select
                  value={healthData.genotype}
                  onChange={(v) =>
                    setHealthData((prev) => ({ ...prev, genotype: v }))
                  }
                  options={[
                    { value: "AA", label: "AA" },
                    { value: "AS", label: "AS" },
                    { value: "SS", label: "SS" },
                    { value: "AC", label: "AC" },
                    { value: "SC", label: "SC" },
                    { value: "unknown", label: "I don't know" },
                  ]}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Allergies" onSave={handleSaveHealth}>
            <Field
              label="Known allergies"
              hint="Patient-reported · Separate multiple entries with commas"
            >
              <textarea
                rows={3}
                value={healthData.knownAllergies}
                onChange={(e) =>
                  setHealthData((prev) => ({
                    ...prev,
                    knownAllergies: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Existing Conditions & Medications"
            onSave={handleSaveHealth}
          >
            <Field label="Existing medical conditions" hint="Patient-reported">
              <textarea
                rows={3}
                value={healthData.medicalConditions}
                onChange={(e) =>
                  setHealthData((prev) => ({
                    ...prev,
                    medicalConditions: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </Field>
            <Field
              label="Current medications"
              hint="Patient-reported · Include dose and frequency where known"
            >
              <textarea
                rows={3}
                value={healthData.currentMedications}
                onChange={(e) =>
                  setHealthData((prev) => ({
                    ...prev,
                    currentMedications: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Surgical & Medical History"
            onSave={handleSaveHealth}
          >
            <Field label="Previous major surgeries" hint="Patient-reported">
              <textarea
                rows={2}
                value={healthData.previousSurgeries}
                onChange={(e) =>
                  setHealthData((prev) => ({
                    ...prev,
                    previousSurgeries: e.target.value,
                  }))
                }
                placeholder="e.g. Appendectomy (2018) — or leave blank"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </Field>
            <Field
              label="Important medical history"
              hint="Patient-reported · Anything else your doctor should know"
            >
              <textarea
                rows={3}
                value={healthData.medicalHistory}
                onChange={(e) =>
                  setHealthData((prev) => ({
                    ...prev,
                    medicalHistory: e.target.value,
                  }))
                }
                placeholder="Any additional health information relevant to your care"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </Field>
          </SectionCard>
        </div>
      )}

      {/* ── Pricing Category ── */}
      {tab === "category" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-blue-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-base">
                  Active Pricing Category
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  You have exactly one active billing category at any time.
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  categoryStatus === "VERIFIED"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {categoryStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Current category">
                <Input defaultValue={categoryName} disabled />
              </Field>
              <Field label="Category code">
                <Input
                  defaultValue={
                    profile?.patientCategory?.category || "NHIS_USER"
                  }
                  disabled
                />
              </Field>
              <Field label="NHIS ID on file">
                <Input
                  defaultValue={
                    profile?.patientCategory?.nhisId || "None provided"
                  }
                  disabled
                />
              </Field>
              <Field label="Scheme type">
                <Input
                  defaultValue={
                    profile?.patientCategory?.nhisSchemeType || "Standard"
                  }
                  disabled
                />
              </Field>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Your pricing category is a{" "}
              <strong>billing classification only</strong> — it does not reflect
              your clinical priority or urgency of care. To request a category
              change, contact Healthitude administration.
            </div>
          </div>

          <SectionCard title="Request Category Change">
            <p className="text-sm text-gray-500 -mt-2">
              If your eligibility has changed, submit a category review request.
              Administration will review your evidence and update your category.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="New category requested">
                <Select
                  defaultValue=""
                  options={[
                    { value: "", label: "Select new category" },
                    ...PATIENT_CATEGORIES,
                  ]}
                />
              </Field>
              <Field label="Reason for change">
                <Select
                  defaultValue=""
                  options={[
                    { value: "", label: "Select reason" },
                    {
                      value: "new_eligibility",
                      label: "New eligibility acquired",
                    },
                    { value: "expired", label: "Previous category expired" },
                    {
                      value: "incorrect",
                      label: "Category was assigned incorrectly",
                    },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Field>
            </div>
            <Field label="Supporting notes">
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Briefly describe your eligibility..."
              />
            </Field>
            <div className="pt-1">
              <button
                className="btn-rise !px-5 !py-2 !text-sm text-white font-semibold"
              >
                Submit Review Request
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Consents ── */}
      {tab === "consents" && (
        <SectionCard title="Consent & Policy Agreements">
          <p className="text-sm text-gray-500 -mt-2">
            Agreements recorded at registration. Version and timestamp are
            stored for audit purposes.
          </p>
          <div className="space-y-3">
            {consentsList.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{c.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Accepted {c.date} · {c.version}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            These consent records are kept for compliance and audit purposes and
            cannot be retroactively removed. To withdraw a consent, contact
            Healthitude — account access or clinical records may be affected.
          </div>
        </SectionCard>
      )}

      {/* ── Security ── */}
      {tab === "security" && (
        <div className="space-y-5">
          <SectionCard title="Change Password" onSave={handleSavePassword}>
            <Field label="Current password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="New password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Confirm new password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Active Sessions">
            <div className="space-y-2">
              {[
                {
                  device: "Chrome on macOS",
                  location: "Accra, Ghana",
                  time: "Now · current session",
                  current: true,
                },
                {
                  device: "Safari on iPhone",
                  location: "Accra, Ghana",
                  time: "Yesterday at 6:14 PM",
                  current: false,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {s.device}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.location} · {s.time}
                    </p>
                  </div>
                  {s.current ? (
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  ) : (
                    <button className="text-xs text-red-500 hover:underline">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ── Professional profile tabs ──────────────────────────────────────────────────

type ProfTab = "identity" | "credentials" | "consents" | "security"

function ProfessionalProfile({ role }: { role: Role }) {
  const [tab, setTab] = useState<ProfTab>("identity")
  const name = roleNames[role]

  const tabs: { id: ProfTab label: string icon: React.ReactNode }[] = [
    {
      id: "identity",
      label: "Account & Identity",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "credentials",
      label: "Professional Credentials",
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: "consents",
      label: "Consents",
      icon: <FileText className="w-4 h-4" />,
    },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
  ]

  const professionLabel: Record<Role, string> = {
    doctor: "Doctor (MBChB / MD)",
    nurse: "Registered Nurse",
    pharmacist: "Pharmacist",
    admin: "Administrator",
    patient: "Patient",
  }

  const licencePrefix: Record<Role, string> = {
    doctor: "GMA-2021-04812",
    nurse: "GNC-2019-01892",
    pharmacist: "PC-2020-05510",
    admin: "",
    patient: "",
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 bg-white border border-gray-100 rounded-xl p-1.5 shadow-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
              tab === t.id
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            style={tab === t.id ? { background: BLUE } : {}}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Account & Identity ── */}
      {tab === "identity" && (
        <SectionCard title="Account & Identity" onSave={() => {}}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required>
              <Input defaultValue={name.first} />
            </Field>
            <Field label="Last name" required>
              <Input defaultValue={name.last} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email address" required>
              <Input type="email" defaultValue={`${role}@healthitude.com`} />
            </Field>
            <Field label="Phone number" required>
              <Input defaultValue="+233 24 000 0000" />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* ── Professional Credentials ── */}
      {tab === "credentials" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-green-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-base">
                Verification Status
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Profession">
                <Input defaultValue={professionLabel[role]} disabled />
              </Field>
              <Field label="Specialty / Area">
                <Input
                  defaultValue={
                    role === "doctor"
                      ? "General Practice"
                      : role === "nurse"
                        ? "Perioperative Care"
                        : "Clinical Pharmacy"
                  }
                  disabled
                />
              </Field>
              <Field label="Licence / Registration number">
                <Input defaultValue={licencePrefix[role]} disabled />
              </Field>
              <Field label="Licence expiry">
                <Input defaultValue="December 31, 2026" disabled />
              </Field>
              <Field label="Regulatory body">
                <Input
                  defaultValue={
                    role === "doctor"
                      ? "Ghana Medical Association"
                      : role === "pharmacist"
                        ? "Pharmacy Council of Ghana"
                        : "Ghana Nurses & Midwives Council"
                  }
                  disabled
                />
              </Field>
              <Field label="Current facility / Affiliation">
                <Input defaultValue="Korle Bu Teaching Hospital" disabled />
              </Field>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
              Credential details are managed by Healthitude administration.
              Contact support to update or resubmit credentials for
              revalidation.
            </div>
          </div>

          <SectionCard title="Credential Documents">
            <p className="text-sm text-gray-500 -mt-2">
              Supporting documents submitted at registration and reviewed by
              Healthitude.
            </p>
            <div className="space-y-2">
              {[
                "National ID / Passport",
                "Professional Licence Certificate",
                "Qualification / Degree Certificate",
              ].map((doc) => (
                <div
                  key={doc}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Verified</span>
                    <button className="text-xs text-blue-600 hover:underline">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-1">
              <button className="btn-fill-slide !px-4 !py-2 !text-sm font-medium">
                Upload new document
              </button>
            </div>
          </SectionCard>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Licence renewal:</strong> Your licence expires in 108 days.
            Ensure revalidation is complete before expiry to maintain your
            clinical privileges.
          </div>
        </div>
      )}

      {/* ── Consents ── */}
      {tab === "consents" && (
        <SectionCard title="Consent & Policy Agreements">
          <p className="text-sm text-gray-500 -mt-2">
            Professional agreements recorded at registration.
          </p>
          <div className="space-y-3">
            {[
              {
                text: "Terms of Service and Privacy Policy",
                date: "Jan 14, 2024",
                version: "v1.0",
              },
              {
                text: "I am a licensed and currently active healthcare professional and the credentials provided are accurate",
                date: "Jan 14, 2024",
                version: "v1.0",
              },
              {
                text: "Healthitude may verify professional credentials and store identity and credential information for platform access and audit",
                date: "Jan 14, 2024",
                version: "v1.0",
              },
              {
                text: "I may only access patient records within my verified professional scope and authorized relationships",
                date: "Jan 14, 2024",
                version: "v1.0",
              },
              {
                text: "My clinical actions on the platform are audited and I remain professionally accountable for all records I create or modify",
                date: "Jan 14, 2024",
                version: "v1.0",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-snug">{c.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Accepted {c.date} · {c.version}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Security ── */}
      {tab === "security" && (
        <div className="space-y-5">
          <SectionCard title="Change Password" onSave={() => {}}>
            <Field label="Current password" required>
              <Input type="password" placeholder="••••••••" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="New password" required>
                <Input type="password" placeholder="••••••••" />
              </Field>
              <Field label="Confirm new password" required>
                <Input type="password" placeholder="••••••••" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Active Sessions">
            <div className="space-y-2">
              {[
                {
                  device: "Chrome on macOS",
                  location: "Accra, Ghana",
                  time: "Now · current session",
                  current: true,
                },
                {
                  device: "Safari on iPhone",
                  location: "Accra, Ghana",
                  time: "Yesterday at 8:02 PM",
                  current: false,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {s.device}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.location} · {s.time}
                    </p>
                  </div>
                  {s.current ? (
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  ) : (
                    <button className="text-xs text-red-500 hover:underline">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ── Admin profile ──────────────────────────────────────────────────────────────

function AdminProfile() {
  return (
    <div className="space-y-5">
      <SectionCard title="Account & Identity" onSave={() => {}}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required>
            <Input defaultValue="Sylvia" />
          </Field>
          <Field label="Last name" required>
            <Input defaultValue="Yeboah" />
          </Field>
          <Field label="Email address" required>
            <Input type="email" defaultValue="admin@healthitude.com" />
          </Field>
          <Field label="Phone number" required>
            <Input defaultValue="+233 24 000 0000" />
          </Field>
        </div>
        <Field
          label="Administrator role"
          hint="Role is managed by Healthitude system configuration"
        >
          <Input defaultValue="System Administrator" disabled />
        </Field>
      </SectionCard>

      <SectionCard title="Change Password" onSave={() => {}}>
        <Field label="Current password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="New password" required>
            <Input type="password" placeholder="••••••••" />
          </Field>
          <Field label="Confirm new password" required>
            <Input type="password" placeholder="••••••••" />
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Exported component ─────────────────────────────────────────────────────────

export default function ProfilePanel({ role }: { role: Role }) {
  return (
    <div className="max-w-3xl space-y-1">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Profile & Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account information, credentials, and privacy settings.
        </p>
      </div>
      {role === "patient" && <PatientProfile />}
      {(role === "doctor" || role === "nurse" || role === "pharmacist") && (
        <ProfessionalProfile role={role} />
      )}
      {role === "admin" && <AdminProfile />}
    </div>
  )
}
