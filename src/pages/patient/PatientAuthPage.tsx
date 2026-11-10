import { useState, useRef } from "react"
import { useNavigate, Link } from "react-router"
import { Building2, ArrowRight, Check } from "lucide-react"
import logoWhite from "@/imports/Screenshot_2026-09-14_184307-removebg-preview.png"
import { useAuth } from "@/context/AuthContext"
import {
  api,
  ApiError,
  mapSexToPrisma,
  mapRelationshipToPrisma,
  mapBloodGroupToPrisma,
  mapGenotypeToPrisma,
  ConsentType,
  ConsentTypeValue,
} from "@/utils/api"
import {
  CORRELATED_PATIENT_CATEGORIES,
  correlateCategoryToPrisma,
  PrismaPatientCategory,
} from "@/utils/patientCategory"
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator"
import { isPasswordStrong } from "@/utils/passwordStrength"
import { explainError, extractFieldErrors } from "@/utils/errorExplainer"

const BLUE = "#1a3fcf"

const PATIENT_CATEGORIES = CORRELATED_PATIENT_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}))

const CATEGORY_EVIDENCE: Record<string, {
  label: string
  placeholder: string
  key: string
}[]> = {
  [PrismaPatientCategory.STUDENT]: [
    {
      label: "Institution / University",
      placeholder: "e.g. University of Ghana",
      key: "institution",
    },
    {
      label: "Student ID number",
      placeholder: "e.g. UG/2023/0041",
      key: "studentId",
    },
    {
      label: "Programme of study",
      placeholder: "e.g. BSc. Nursing",
      key: "programme",
    },
    {
      label: "Expected graduation year",
      placeholder: "e.g. 2026",
      key: "gradYear",
    },
  ],
  [PrismaPatientCategory.NHIS_USER]: [
    {
      label: "NHIS ID number",
      placeholder: "e.g. GH-NHIS-20240088341",
      key: "nhisId",
    },
    {
      label: "Scheme type",
      placeholder: "e.g. NHIS, DMHIS",
      key: "nhisSchemeType",
    },
  ],
  [PrismaPatientCategory.CIVIL_SERVANT]: [
    {
      label: "Ministry / Agency / Department",
      placeholder: "e.g. Ghana Health Service",
      key: "ministry",
    },
    {
      label: "Employee / Staff ID",
      placeholder: "e.g. GHS-2018-44120",
      key: "staffId",
    },
  ],
  [PrismaPatientCategory.CORPORATE_COMPANY_MEMBER]: [
    {
      label: "Company / Organisation",
      placeholder: "e.g. Tullow Ghana Ltd",
      key: "company",
    },
    {
      label: "Employee / Member ID",
      placeholder: "e.g. TGL-EMP-00821",
      key: "memberId",
    },
  ],
  [PrismaPatientCategory.INSURANCE_MEMBER]: [
    {
      label: "Insurance company",
      placeholder: "e.g. Enterprise Life",
      key: "insuranceCompany",
    },
    {
      label: "Policy / Member number",
      placeholder: "e.g. EL-2024-POL-88291",
      key: "policyNumber",
    },
    {
      label: "Coverage type",
      placeholder: "e.g. Comprehensive, Inpatient",
      key: "coverageType",
    },
  ],
  [PrismaPatientCategory.ELDERLY]: [
    {
      label: "Date of birth (for age verification)",
      placeholder: "Pre-filled from Step 1",
      key: "dobNote",
    },
  ],
  [PrismaPatientCategory.NURSING_BREASTFEEDING_MOTHER]: [
    {
      label: "Expected / actual delivery date",
      placeholder: "e.g. March 2026",
      key: "deliveryDate",
    },
  ],
  [PrismaPatientCategory.GENERAL_PATIENT]: [],
}

const CONSENT_ITEMS: { type: ConsentTypeValue text: string }[] = [
  {
    type: ConsentType.TERMS_AND_PRIVACY,
    text: "I agree to the Healthitude Terms of Service and Privacy Policy.",
  },
  {
    type: ConsentType.HEALTH_DATA_PROCESSING,
    text: "I consent to secure storage and processing of my health information for healthcare continuity.",
  },
  {
    type: ConsentType.PROFESSIONAL_ACCESS,
    text: "I consent to authorized healthcare professionals accessing my records within their permitted scope.",
  },
  {
    type: ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT,
    text: "I understand that information I enter myself is patient-reported and is not clinically verified until reviewed by a qualified professional.",
  },
  {
    type: ConsentType.AI_LIMITATIONS,
    text: "I acknowledge that the AI assistant provides general health information only and cannot diagnose, prescribe, or replace professional medical advice.",
  },
  {
    type: ConsentType.BREAK_GLASS_DISCLOSURE,
    text: "I understand that initiating a Break-Glass emergency request will share a controlled snapshot of my health information with a verified responding doctor.",
  },
  {
    type: ConsentType.INFORMATION_ACCURACY,
    text: "I confirm that the information I have provided during registration is accurate to the best of my knowledge.",
  },
]

interface RegistrationState {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  sex: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string

  street: string
  city: string
  state: string
  district: string
  emergencyFullName: string
  emergencyRelationship: string
  emergencyPhone: string

  bloodGroup: string
  genotype: string
  knownAllergies: string
  medicalConditions: string
  currentMedications: string
  previousSurgeries: string
  medicalHistory: string

  category: string
  nhisId: string
  nhisSchemeType: string
  evidenceNotes: string
  evidenceFields: Record<string, string>

  consents: Record<string, boolean>
}

function getFieldError(
  errors: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    if (errors[k]) return errors[k]
  }
  return undefined
}

function Input({
  placeholder,
  type = "text",
  value,
  onChange,
  disabled,
  error,
}: {
  placeholder?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: boolean
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
        error
          ? "border-red-400 focus:ring-red-400 bg-red-50/20 text-gray-900"
          : "border-gray-200 focus:ring-blue-500 text-gray-900"
      }`}
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
  placeholder,
  value,
  onChange,
  error,
}: {
  options: { value: string label: string }[]
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  error?: boolean
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white text-gray-700 transition-colors ${
        error
          ? "border-red-400 focus:ring-red-400 bg-red-50/20"
          : "border-gray-200 focus:ring-blue-500"
      }`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Step1({
  formData,
  setField,
  errors,
  photoPreview,
  onPhotoSelected,
}: {
  formData: RegistrationState
  setField: (k: keyof RegistrationState, v: any) => void
  errors: Record<string, string>
  photoPreview: string | null
  onPhotoSelected: (f: File | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onPhotoSelected(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden"
        >
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Profile photo</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Optional · JPG or PNG · Max 2 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            {photoPreview ? "Change photo" : "Upload photo"}
          </button>
          {getFieldError(errors, "account.profilePhoto", "profilePhoto") && (
            <p className="text-xs text-red-600 mt-1">
              {getFieldError(errors, "account.profilePhoto", "profilePhoto")}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field
          label="First name"
          required
          error={getFieldError(errors, "account.firstName", "firstName")}
        >
          <Input
            value={formData.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="Ama"
            error={!!getFieldError(errors, "account.firstName", "firstName")}
          />
        </Field>
        <Field
          label="Middle name"
          error={getFieldError(errors, "account.middleName", "middleName")}
        >
          <Input
            value={formData.middleName}
            onChange={(e) => setField("middleName", e.target.value)}
            placeholder="Akua"
            error={!!getFieldError(errors, "account.middleName", "middleName")}
          />
        </Field>
        <Field
          label="Last name"
          required
          error={getFieldError(errors, "account.lastName", "lastName")}
        >
          <Input
            value={formData.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="Mensah"
            error={!!getFieldError(errors, "account.lastName", "lastName")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Date of birth"
          required
          error={getFieldError(errors, "account.dateOfBirth", "dateOfBirth")}
        >
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setField("dateOfBirth", e.target.value)}
            error={
              !!getFieldError(errors, "account.dateOfBirth", "dateOfBirth")
            }
          />
        </Field>
        <Field
          label="Sex"
          required
          error={getFieldError(errors, "account.sex", "sex")}
        >
          <Select
            placeholder="Select"
            value={formData.sex}
            onChange={(v) => setField("sex", v)}
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "prefer_not", label: "Prefer not to say" },
            ]}
            error={!!getFieldError(errors, "account.sex", "sex")}
          />
        </Field>
      </div>
      <Field
        label="Email address"
        required
        error={getFieldError(errors, "account.email", "email")}
      >
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="ama@example.com"
          error={!!getFieldError(errors, "account.email", "email")}
        />
      </Field>
      <Field
        label="Phone number"
        required
        error={getFieldError(errors, "account.phoneNumber", "phoneNumber")}
      >
        <Input
          value={formData.phoneNumber}
          onChange={(e) => setField("phoneNumber", e.target.value)}
          placeholder="+233 24 000 0000"
          error={!!getFieldError(errors, "account.phoneNumber", "phoneNumber")}
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field
          label="Password"
          required
          error={getFieldError(errors, "account.password", "password")}
        >
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="Min. 8 chars (letters, numbers, symbols)"
            error={!!getFieldError(errors, "account.password", "password")}
          />
        </Field>
        <Field
          label="Confirm password"
          required
          error={
            formData.confirmPassword &&
            formData.password === formData.confirmPassword
              ? undefined
              : getFieldError(
                  errors,
                  "account.confirmPassword",
                  "confirmPassword",
                )
          }
        >
          <Input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setField("confirmPassword", e.target.value)}
            placeholder={
              isPasswordStrong(formData.password)
                ? "Re-enter your password"
                : "Locked until password turns green"
            }
            disabled={!isPasswordStrong(formData.password)}
            error={
              formData.confirmPassword &&
              formData.password === formData.confirmPassword
                ? false
                : !!getFieldError(
                    errors,
                    "account.confirmPassword",
                    "confirmPassword",
                  )
            }
          />
          {!isPasswordStrong(formData.password) ? (
            <p className="text-[11px] text-amber-600 mt-1">
              Turn password <strong className="text-emerald-700">green (strong)</strong> to enable confirmation.
            </p>
          ) : formData.confirmPassword &&
            formData.password === formData.confirmPassword ? (
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Passwords match
            </p>
          ) : null}
        </Field>
      </div>

      {/* Dynamic Password Strength Indicator */}
      <PasswordStrengthIndicator password={formData.password} />
    </div>
  )
}

function Step2({
  formData,
  setField,
  errors,
}: {
  formData: RegistrationState
  setField: (k: keyof RegistrationState, v: any) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Residential Address
        </p>
        <div className="space-y-3">
          <Field
            label="Street / House address"
            required
            error={getFieldError(errors, "contact.street", "street")}
          >
            <Input
              value={formData.street}
              onChange={(e) => setField("street", e.target.value)}
              placeholder="12 Independence Ave"
              error={!!getFieldError(errors, "contact.street", "street")}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="City / Town"
              required
              error={getFieldError(errors, "contact.city", "city")}
            >
              <Input
                value={formData.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Accra"
                error={!!getFieldError(errors, "contact.city", "city")}
              />
            </Field>
            <Field
              label="Region / State"
              required
              error={getFieldError(errors, "contact.state", "state")}
            >
              <Input
                value={formData.state}
                onChange={(e) => setField("state", e.target.value)}
                placeholder="Greater Accra"
                error={!!getFieldError(errors, "contact.state", "state")}
              />
            </Field>
            <Field
              label="LGA / District"
              error={getFieldError(errors, "contact.district", "district")}
            >
              <Input
                value={formData.district}
                onChange={(e) => setField("district", e.target.value)}
                placeholder="Ayawaso West"
                error={!!getFieldError(errors, "contact.district", "district")}
              />
            </Field>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Emergency Contact
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Used in your Break-Glass emergency snapshot.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Full name"
              required
              error={getFieldError(
                errors,
                "contact.emergencyContact.fullName",
                "emergencyFullName",
              )}
            >
              <Input
                value={formData.emergencyFullName}
                onChange={(e) => setField("emergencyFullName", e.target.value)}
                placeholder="Kofi Mensah"
                error={
                  !!getFieldError(
                    errors,
                    "contact.emergencyContact.fullName",
                    "emergencyFullName",
                  )
                }
              />
            </Field>
            <Field
              label="Relationship"
              required
              error={getFieldError(
                errors,
                "contact.emergencyContact.relationship",
                "emergencyRelationship",
              )}
            >
              <Select
                placeholder="Select"
                value={formData.emergencyRelationship}
                onChange={(v) => setField("emergencyRelationship", v)}
                options={[
                  { value: "spouse", label: "Spouse / Partner" },
                  { value: "parent", label: "Parent" },
                  { value: "sibling", label: "Sibling" },
                  { value: "child", label: "Child" },
                  { value: "friend", label: "Friend" },
                  { value: "other", label: "Other" },
                ]}
                error={
                  !!getFieldError(
                    errors,
                    "contact.emergencyContact.relationship",
                    "emergencyRelationship",
                  )
                }
              />
            </Field>
          </div>
          <Field
            label="Phone number"
            required
            error={getFieldError(
              errors,
              "contact.emergencyContact.phoneNumber",
              "emergencyPhone",
            )}
          >
            <Input
              value={formData.emergencyPhone}
              onChange={(e) => setField("emergencyPhone", e.target.value)}
              placeholder="+233 20 555 0101"
              error={
                !!getFieldError(
                  errors,
                  "contact.emergencyContact.phoneNumber",
                  "emergencyPhone",
                )
              }
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function Step3HealthProfile({
  formData,
  setField,
  errors,
}: {
  formData: RegistrationState
  setField: (k: keyof RegistrationState, v: any) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <svg
          className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
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
          <strong>Patient-reported information.</strong> This data is not
          clinically verified until reviewed and confirmed by an authorized
          healthcare professional.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Blood group (if known)"
          error={getFieldError(
            errors,
            "healthProfile.bloodGroup",
            "bloodGroup",
          )}
        >
          <Select
            placeholder="Select or skip"
            value={formData.bloodGroup}
            onChange={(v) => setField("bloodGroup", v)}
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
            error={
              !!getFieldError(errors, "healthProfile.bloodGroup", "bloodGroup")
            }
          />
        </Field>
        <Field
          label="Genotype (if known)"
          error={getFieldError(errors, "healthProfile.genotype", "genotype")}
        >
          <Select
            placeholder="Select or skip"
            value={formData.genotype}
            onChange={(v) => setField("genotype", v)}
            options={[
              { value: "AA", label: "AA" },
              { value: "AS", label: "AS" },
              { value: "SS", label: "SS" },
              { value: "AC", label: "AC" },
              { value: "SC", label: "SC" },
              { value: "unknown", label: "I don't know" },
            ]}
            error={
              !!getFieldError(errors, "healthProfile.genotype", "genotype")
            }
          />
        </Field>
      </div>
      <Field
        label="Known allergies"
        error={getFieldError(
          errors,
          "healthProfile.knownAllergies",
          "knownAllergies",
        )}
      >
        <textarea
          rows={2}
          value={formData.knownAllergies}
          onChange={(e) => setField("knownAllergies", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
          placeholder="e.g. Penicillin, Aspirin, Latex — or leave blank if none known"
        />
      </Field>
      <Field
        label="Existing medical conditions"
        error={getFieldError(
          errors,
          "healthProfile.medicalConditions",
          "medicalConditions",
        )}
      >
        <textarea
          rows={2}
          value={formData.medicalConditions}
          onChange={(e) => setField("medicalConditions", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
          placeholder="e.g. Hypertension, Type 2 Diabetes — or leave blank if none"
        />
      </Field>
      <Field
        label="Current medications"
        error={getFieldError(
          errors,
          "healthProfile.currentMedications",
          "currentMedications",
        )}
      >
        <textarea
          rows={2}
          value={formData.currentMedications}
          onChange={(e) => setField("currentMedications", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
          placeholder="List any medications you are currently taking, with doses if known"
        />
      </Field>
      <Field
        label="Previous major surgeries"
        error={getFieldError(
          errors,
          "healthProfile.previousSurgeries",
          "previousSurgeries",
        )}
      >
        <textarea
          rows={2}
          value={formData.previousSurgeries}
          onChange={(e) => setField("previousSurgeries", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
          placeholder="e.g. Appendectomy (2018) — or leave blank"
        />
      </Field>
      <Field
        label="Important medical history"
        error={getFieldError(
          errors,
          "healthProfile.medicalHistory",
          "medicalHistory",
        )}
      >
        <textarea
          rows={2}
          value={formData.medicalHistory}
          onChange={(e) => setField("medicalHistory", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
          placeholder="Any other health information your doctor should know"
        />
      </Field>
    </div>
  )
}

function Step3Category({
  formData,
  setField,
  errors,
  selectedDocName,
  onDocSelected,
}: {
  formData: RegistrationState
  setField: (k: keyof RegistrationState, v: any) => void
  errors: Record<string, string>
  selectedDocName: string | null
  onDocSelected: (f: File | null) => void
}) {
  const docInputRef = useRef<HTMLInputElement>(null)
  const normalizedCategory = correlateCategoryToPrisma(formData.category)
  const evidence =
    CATEGORY_EVIDENCE[normalizedCategory] ??
    CATEGORY_EVIDENCE[formData.category] ??
    []

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onDocSelected(file)
    }
  }

  function handleEvidenceFieldChange(key: string, val: string) {
    if (key === "nhisId") {
      setField("nhisId", val)
    } else if (key === "nhisSchemeType") {
      setField("nhisSchemeType", val)
    } else {
      const updated = { ...formData.evidenceFields, [key]: val }
      setField("evidenceFields", updated)
      // Construct summary note for backend supportingDocument
      const noteParts = Object.entries(updated).map(([k, v]) => `${k}: ${v}`)
      setField("evidenceNotes", noteParts.join("; "))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Healthitude assigns you <strong>exactly one</strong> active billing
        category. This is a financial classification — it does not affect your
        clinical priority.
      </p>
      <Field
        label="Pricing category"
        required
        error={getFieldError(errors, "patientCategory.category", "category")}
      >
        <Select
          value={formData.category}
          onChange={(c) => setField("category", c)}
          options={PATIENT_CATEGORIES}
          error={
            !!getFieldError(errors, "patientCategory.category", "category")
          }
        />
      </Field>

      {evidence.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
            Evidence required —{" "}
            {
              PATIENT_CATEGORIES.find((c) => c.value === formData.category)
                ?.label
            }
          </p>
          {evidence.map((f) => {
            const isNhisId = f.key === "nhisId"
            const val = isNhisId
              ? formData.nhisId
              : f.key === "nhisSchemeType"
                ? formData.nhisSchemeType
                : formData.evidenceFields[f.key] || ""
            const err = isNhisId
              ? getFieldError(errors, "patientCategory.nhisId", "nhisId")
              : undefined

            return (
              <Field
                key={f.label}
                label={f.label}
                required={isNhaiUserCategory(normalizedCategory) && isNhisId}
                error={err}
              >
                <Input
                  placeholder={f.placeholder}
                  value={val}
                  onChange={(e) =>
                    handleEvidenceFieldChange(f.key, e.target.value)
                  }
                  error={!!err}
                />
              </Field>
            )
          })}

          <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-800">
                Supporting document
              </p>
              <p className="text-xs text-blue-600">
                {selectedDocName
                  ? `Selected: ${selectedDocName}`
                  : "Optional · PDF, JPG, PNG · Max 5 MB"}
              </p>
            </div>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={handleDocChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {selectedDocName ? "Change File" : "Choose File"}
            </button>
          </div>
          <p className="text-xs text-blue-600">
            You can also upload supporting documents after registration. Your
            category will be <strong>pending verification</strong> until
            reviewed.
          </p>
        </div>
      )}

      {(normalizedCategory === PrismaPatientCategory.GENERAL_PATIENT ||
        formData.category === "GENERAL") && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          General Patient is the default. No evidence required. You can request
          a category change after registration.
        </div>
      )}
    </div>
  )
}

function isNhaiUserCategory(cat: string): boolean {
  return cat === PrismaPatientCategory.NHIS_USER || cat === "NHIS"
}

function Step4Consents({
  consents,
  onToggle,
  errors,
}: {
  consents: Record<string, boolean>
  onToggle: (type: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Please read and accept all agreements to complete your registration.
      </p>
      {CONSENT_ITEMS.map((item) => {
        const checked = !!consents[item.type]
        const error = errors[`consents.${item.type}`] || errors[item.type]

        return (
          <div key={item.type} className="flex flex-col">
            <label
              className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-lg transition-colors ${
                error ? "bg-red-50" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.type)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 flex-shrink-0"
              />
              <span
                className={`text-sm leading-snug ${
                  error ? "text-red-800 font-medium" : "text-gray-600"
                }`}
              >
                {item.text}
              </span>
            </label>
            {error && (
              <span className="text-xs text-red-600 ml-9 -mt-1 mb-1">
                {error}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VerificationPending({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="text-center space-y-4 py-2">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg
          className="w-7 h-7 text-green-600"
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
          A verification email has been sent. Your pricing category is pending
          review.
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-left space-y-2 text-sm text-gray-600">
        <p>1. Verify your email address</p>
        <p>2. Verify your phone number</p>
        <p>3. Upload category evidence (if required)</p>
        <p>4. Access your dashboard</p>
      </div>
      <button
        onClick={onEnter}
        className="btn-send !w-full !py-3 text-white font-semibold"
      >
        <span>Go to Patient Dashboard</span>
        <ArrowRight className="w-4 h-4 btn-arrow" />
      </button>
    </div>
  )
}

export default function PatientAuthPage({
  mode: initialMode,
}: {
  mode: "login" | "register"
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Sign in state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // File uploads state
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const TOTAL = 5

  const stepLabels = [
    "Account & Identity",
    "Personal & Emergency Contact",
    "Health Profile",
    "Patient Category",
    "Consent & Agreements",
  ]

  const [formData, setFormData] = useState<RegistrationState>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "female",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",

    street: "",
    city: "",
    state: "",
    district: "",
    emergencyFullName: "",
    emergencyRelationship: "spouse",
    emergencyPhone: "",

    bloodGroup: "",
    genotype: "",
    knownAllergies: "",
    medicalConditions: "",
    currentMedications: "",
    previousSurgeries: "",
    medicalHistory: "",

    category: PrismaPatientCategory.NHIS_USER,
    nhisId: "",
    nhisSchemeType: "NHIS",
    evidenceNotes: "",
    evidenceFields: {},

    consents: {
      [ConsentType.TERMS_AND_PRIVACY]: false,
      [ConsentType.HEALTH_DATA_PROCESSING]: false,
      [ConsentType.PROFESSIONAL_ACCESS]: false,
      [ConsentType.PATIENT_DATA_ACKNOWLEDGEMENT]: false,
      [ConsentType.AI_LIMITATIONS]: false,
      [ConsentType.BREAK_GLASS_DISCLOSURE]: false,
      [ConsentType.INFORMATION_ACCURACY]: false,
    },
  })

  function setField<K extends keyof RegistrationState>(
    key: K,
    value: RegistrationState[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setGlobalError(null)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      delete next[`account.${key}`]
      delete next[`contact.${key}`]
      delete next[`patientCategory.${key}`]
      if (key === "confirmPassword" || key === "password") {
        delete next.confirmPassword
        delete next["account.confirmPassword"]
        delete next.password
        delete next["account.password"]
      }
      return next
    })
  }

  function handleConsentToggle(type: string) {
    setFormData((prev) => ({
      ...prev,
      consents: {
        ...prev.consents,
        [type]: !prev.consents[type],
      },
    }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`consents.${type}`]
      delete next[type]
      return next
    })
  }

  function handlePhotoSelected(file: File | null) {
    if (!file) {
      setSelectedPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        "account.profilePhoto": "File size exceeds 2 MB limit",
      }))
      return
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        "account.profilePhoto": "Only JPG and PNG images are allowed",
      }))
      return
    }

    setSelectedPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleDocSelected(file: File | null) {
    if (!file) {
      setSelectedDocFile(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        supportingDocument: "Supporting document size exceeds 5 MB limit",
      }))
      return
    }

    setSelectedDocFile(file)
  }

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.")
      return
    }

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      await login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      })
      navigate("/patient/dashboard")
    } catch (err: any) {
      setLoginError(
        explainError(
          err,
          "Invalid email address or password. Please check your credentials and try again.",
        ),
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim())
      errors["account.firstName"] = "First name is required"
    if (!formData.lastName.trim())
      errors["account.lastName"] = "Last name is required"
    if (!formData.dateOfBirth.trim()) {
      errors["account.dateOfBirth"] = "Date of birth is required"
    } else {
      const dob = new Date(formData.dateOfBirth)
      if (isNaN(dob.getTime())) {
        errors["account.dateOfBirth"] = "Invalid date format"
      } else if (dob >= new Date()) {
        errors["account.dateOfBirth"] = "Date of birth must be in the past"
      }
    }
    if (!formData.sex) errors["account.sex"] = "Please select sex"
    if (!formData.email.trim()) {
      errors["account.email"] = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors["account.email"] = "Please enter a valid email address"
    }
    if (!formData.phoneNumber.trim()) {
      errors["account.phoneNumber"] = "Phone number is required"
    }

    // Password strength check & confirmation gating
    if (!formData.password) {
      errors["account.password"] = "Password is required"
    } else if (!isPasswordStrong(formData.password)) {
      errors["account.password"] =
        "Password must turn green (satisfy all strength criteria) to continue"
    }

    if (!isPasswordStrong(formData.password)) {
      errors["account.confirmPassword"] =
        "Confirmation is locked until the password check turns green"
    } else if (!formData.confirmPassword) {
      errors["account.confirmPassword"] = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      errors["account.confirmPassword"] = "Passwords do not match"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const errorList = Object.entries(errors).map(([field, message]) => ({
        field,
        message,
      }))
      setGlobalError(
        explainError(
          { errors: errorList },
          "Please resolve the highlighted fields before proceeding.",
        ),
      )
      return false
    }
    return true
  }

  function validateStep2(): boolean {
    const errors: Record<string, string> = {}
    if (!formData.street.trim())
      errors["contact.street"] = "Street address is required"
    if (!formData.city.trim())
      errors["contact.city"] = "City or town is required"
    if (!formData.state.trim())
      errors["contact.state"] = "Region or state is required"
    if (!formData.emergencyFullName.trim())
      errors["contact.emergencyContact.fullName"] =
        "Emergency contact name is required"
    if (!formData.emergencyRelationship.trim())
      errors["contact.emergencyContact.relationship"] =
        "Relationship is required"
    if (!formData.emergencyPhone.trim())
      errors["contact.emergencyContact.phoneNumber"] =
        "Emergency contact phone is required"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGlobalError("Please resolve the highlighted fields before proceeding.")
      return false
    }
    return true
  }

  function validateStep4(): boolean {
    const errors: Record<string, string> = {}
    const prismaCat = correlateCategoryToPrisma(formData.category)
    if (!formData.category)
      errors["patientCategory.category"] = "Please select a pricing category"
    if (isNhaiUserCategory(prismaCat) && !formData.nhisId.trim()) {
      errors["patientCategory.nhisId"] =
        "NHIS ID number is required for NHIS User category"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGlobalError("Please resolve the highlighted fields before proceeding.")
      return false
    }
    return true
  }

  function handleContinue() {
    setGlobalError(null)
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 4 && !validateStep4()) return

    setFieldErrors({})
    if (step < TOTAL) {
      setStep(step + 1)
    } else {
      handleRegisterDone()
    }
  }

  async function handleRegisterDone() {
    // Validate step 5 consents
    const consentErrors: Record<string, string> = {}
    for (const item of CONSENT_ITEMS) {
      if (!formData.consents[item.type]) {
        consentErrors[`consents.${item.type}`] =
          "This agreement must be accepted"
      }
    }

    if (Object.keys(consentErrors).length > 0) {
      setFieldErrors(consentErrors)
      setGlobalError(
        "Please read and accept all mandatory agreements to complete your registration.",
      )
      return
    }

    setIsSubmitting(true)
    setGlobalError(null)
    setFieldErrors({})

    const prismaCategory = correlateCategoryToPrisma(formData.category)

    const payload = {
      account: {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        sex: mapSexToPrisma(formData.sex),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword || undefined,
        profilePhoto: undefined,
      },
      contact: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        district: formData.district.trim() || undefined,
        emergencyContact: {
          fullName: formData.emergencyFullName.trim(),
          relationship: mapRelationshipToPrisma(formData.emergencyRelationship),
          phoneNumber: formData.emergencyPhone.trim(),
        },
      },
      healthProfile: {
        bloodGroup: mapBloodGroupToPrisma(formData.bloodGroup) || undefined,
        genotype: mapGenotypeToPrisma(formData.genotype) || undefined,
        knownAllergies: formData.knownAllergies.trim() || undefined,
        medicalConditions: formData.medicalConditions.trim() || undefined,
        currentMedications: formData.currentMedications.trim() || undefined,
        previousSurgeries: formData.previousSurgeries.trim() || undefined,
        medicalHistory: formData.medicalHistory.trim() || undefined,
      },
      patientCategory: {
        category: prismaCategory,
        nhisId: formData.nhisId.trim() || undefined,
        nhisSchemeType: formData.nhisSchemeType.trim() || undefined,
        supportingDocument: formData.evidenceNotes.trim() || undefined,
      },
      consents: {
        consents: CONSENT_ITEMS.map((item) => ({
          consentType: item.type,
          accepted: !!formData.consents[item.type],
          version: "1.0",
        })),
      },
    }

    try {
      // 1. Submit registration
      await api.patient.register(payload)

      // 2. Authenticate session
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      // 3. Upload photo if selected
      if (selectedPhotoFile) {
        try {
          await api.uploadProfilePhoto(selectedPhotoFile)
        } catch (uploadErr) {
          console.warn("Profile photo upload failed:", uploadErr)
        }
      }

      // 4. Upload document if selected
      if (selectedDocFile) {
        try {
          await api.uploadCategoryDocument(selectedDocFile)
        } catch (docErr) {
          console.warn("Category document upload failed:", docErr)
        }
      }

      setDone(true)
    } catch (err: any) {
      const detailed = explainError(
        err,
        "Registration could not be completed. Please review the highlighted fields.",
      )
      setGlobalError(detailed)
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      }

      // Auto-navigate to step containing the first error
      const keys = Object.keys(errors)
      if (
        keys.some(
          (k) =>
            k.startsWith("account.") ||
            [
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "dateOfBirth",
              "password",
            ].includes(k),
        )
      ) {
        setStep(1)
      } else if (keys.some((k) => k.startsWith("contact."))) {
        setStep(2)
      } else if (keys.some((k) => k.startsWith("healthProfile."))) {
        setStep(3)
      } else if (
        keys.some((k) => k.startsWith("patientCategory.") || k === "nhisId")
      ) {
        setStep(4)
      } else if (keys.some((k) => k.startsWith("consents."))) {
        setStep(5)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(m: "login" | "register") {
    setMode(m)
    setStep(1)
    setDone(false)
    setGlobalError(null)
    setFieldErrors({})
    setLoginError(null)
    navigate(m === "login" ? "/patient/login" : "/patient/register", {
      replace: true,
    })
  }

  const BG =
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRpZW50JTIwdXNpbmclMjBzbWFydHBob25lJTIwdGVsZW1lZGljaW5lJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3ODk0NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-10 px-6 overflow-y-auto">
      {/* Full-screen background image */}
      <img
        src={BG}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          zIndex: 0,
          filter: "blur(6px) brightness(0.45)",
          transform: "scale(1.08)",
        }}
      />
      {/* Dark gradient overlay */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 1,
          background: `linear-gradient(160deg, ${BLUE}bb 0%, #0d1b4bdd 100%)`,
        }}
      />

      {/* Logo */}
      <Link to="/" className="relative mb-6" style={{ zIndex: 2 }}>
        <img
          src={logoWhite}
          alt="Healthitude"
          className="h-12 object-contain hover:opacity-80 transition-opacity"
        />
      </Link>

      {/* Form card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full p-8"
        style={{
          zIndex: 2,
          maxWidth: mode === "register" && !done ? "560px" : "440px",
        }}
      >
        {/* Portal label */}
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Patient Portal
          </span>
          <span className="flex-1" />
          <Link to="/" className="text-xs text-blue-600 hover:underline">
            Wrong portal?
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-7">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white shadow text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white shadow text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Login */}
        {mode === "login" && (
          <div className="space-y-5">
            <div>
              <h2
                className="font-display text-2xl font-bold"
                style={{ color: "#0d1b4b" }}
              >
                Patient sign in
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your Healthitude patient account
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold">Sign in failed</p>
                  <p>{loginError}</p>
                </div>
              </div>
            )}

            <Field label="Email address" required>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="btn-send !w-full !py-3 text-white font-semibold"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 btn-arrow" />
                </span>
              )}
            </button>
            <p className="text-center text-sm text-gray-500">
              <button className="text-blue-600 hover:underline">
                Forgot your password?
              </button>
            </p>
          </div>
        )}

        {/* Register */}
        {mode === "register" && !done && (
          <div className="space-y-5">
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
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{ background: i < step ? BLUE : "#e5e7eb" }}
                  />
                ))}
              </div>
            </div>

            {globalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold">Check required fields</p>
                  <p>{globalError}</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <Step1
                formData={formData}
                setField={setField}
                errors={fieldErrors}
                photoPreview={photoPreview}
                onPhotoSelected={handlePhotoSelected}
              />
            )}
            {step === 2 && (
              <Step2
                formData={formData}
                setField={setField}
                errors={fieldErrors}
              />
            )}
            {step === 3 && (
              <Step3HealthProfile
                formData={formData}
                setField={setField}
                errors={fieldErrors}
              />
            )}
            {step === 4 && (
              <Step3Category
                formData={formData}
                setField={setField}
                errors={fieldErrors}
                selectedDocName={selectedDocFile?.name || null}
                onDocSelected={handleDocSelected}
              />
            )}
            {step === 5 && (
              <Step4Consents
                consents={formData.consents}
                onToggle={handleConsentToggle}
                errors={fieldErrors}
              />
            )}

            <div className="flex gap-3 pt-1">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalError(null)
                    setStep(step - 1)
                  }}
                  disabled={isSubmitting}
                  className="btn-underline flex-1 !py-2.5"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting}
                className="btn-send flex-1 !py-2.5 text-white font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {step < TOTAL ? "Continuing..." : "Creating Account..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>{step < TOTAL ? "Continue" : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4 btn-arrow" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {mode === "register" && done && (
          <VerificationPending onEnter={() => navigate("/patient/dashboard")} />
        )}
      </div>
    </div>
  )
}
