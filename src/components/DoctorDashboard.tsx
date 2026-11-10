import { useState } from "react"
import {
  Calendar,
  Activity,
  FileText,
  Pill,
  Shield,
  Clock,
  Video,
  Building2,
  Paperclip,
  Stethoscope,
  Lock,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  Play,
} from "lucide-react"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"
const SKY = "#0ea5e9"

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Badge({
  label,
  color,
}: {
  label: string
  color: "green" | "blue" | "yellow" | "red" | "gray" | "purple"
}) {
  const styles: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[color]}`}
    >
      {label}
    </span>
  )
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 ${className}`}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({
  placeholder,
  defaultValue,
}: {
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
      style={{ ["--tw-ring-color" as string]: BLUE + "40" }}
    />
  )
}

function Select({
  options,
  defaultValue,
}: {
  options: string[]
  defaultValue?: string
}) {
  return (
    <select
      defaultValue={defaultValue}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

function PrimaryBtn({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-rise text-white font-semibold ${
        small ? "!px-3 !py-1.5 !text-xs" : "!px-4 !py-2 !text-sm"
      }`}
    >
      {children}
    </button>
  )
}

function OutlineBtn({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-underline ${
        small ? "!px-3 !py-1.5 !text-xs" : "!px-4 !py-2 !text-sm"
      }`}
    >
      {children}
    </button>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TODAY_APPOINTMENTS = [
  {
    id: "APT-091",
    patient: "John Doe",
    initials: "JD",
    avatarColor: "#7c3aed",
    age: 34,
    reason: "General Consultation",
    symptoms: ["Headache", "Fatigue", "Dizziness"],
    duration: "5 days",
    severity: "Moderate",
    time: "09:00 AM",
    type: "Video",
    status: "Upcoming",
    statusColor: "blue" as const,
    conditions: "No reported conditions",
    medications: "Paracetamol 500mg · 2× daily",
    documents: ["Blood_Test.pdf", "Prescription.jpg"],
    allergies: "None reported",
  },
  {
    id: "APT-090",
    patient: "Ama Mensah",
    initials: "AM",
    avatarColor: "#be185d",
    age: 28,
    reason: "Follow-up Consultation",
    symptoms: ["Persistent cough", "Mild chest pain"],
    duration: "2 weeks",
    severity: "Mild",
    time: "10:30 AM",
    type: "Video",
    status: "In Progress",
    statusColor: "green" as const,
    conditions: "Asthma",
    medications: "Salbutamol inhaler · as needed",
    documents: ["Chest_Xray.pdf"],
    allergies: "Penicillin",
  },
  {
    id: "APT-089",
    patient: "Kweku Osei",
    initials: "KO",
    avatarColor: "#047857",
    age: 52,
    reason: "Medication Review",
    symptoms: ["Elevated BP readings at home"],
    duration: "1 month",
    severity: "Moderate",
    time: "01:00 PM",
    type: "In-Person",
    status: "Confirmed",
    statusColor: "gray" as const,
    conditions: "Hypertension, Type 2 Diabetes",
    medications: "Amlodipine 5mg, Metformin 500mg",
    documents: [],
    allergies: "Aspirin",
  },
  {
    id: "APT-088",
    patient: "Abena Frempong",
    initials: "AF",
    avatarColor: "#b45309",
    age: 19,
    reason: "Specialist Consultation",
    symptoms: ["Skin rash", "Itching", "Redness"],
    duration: "3 days",
    severity: "Mild",
    time: "03:30 PM",
    type: "Video",
    status: "Confirmed",
    statusColor: "gray" as const,
    conditions: "None",
    medications: "None",
    documents: ["Rash_Photo.jpg"],
    allergies: "Latex",
  },
]

const complaints = [
  {
    id: "CPL-0041",
    patient: "Ama Mensah",
    date: "Sep 12",
    symptoms: "Persistent headache, mild fever, fatigue",
    severity: "Moderate",
    status: "UNDER_REVIEW",
    priority: "ROUTINE",
  },
  {
    id: "CPL-0040",
    patient: "Kweku Osei",
    date: "Sep 11",
    symptoms: "Chest tightness, shortness of breath",
    severity: "Severe",
    status: "UNDER_REVIEW",
    priority: "URGENT",
  },
  {
    id: "CPL-0039",
    patient: "Abena Frempong",
    date: "Sep 10",
    symptoms: "Mild skin rash, itching",
    severity: "Mild",
    status: "NEW",
    priority: "ROUTINE",
  },
]

// ─── Section 21 & 22 — Today's Appointments + Pre-Consultation Panel ──────────

function AppointmentsView({
  onStartConsultation,
}: {
  onStartConsultation: (apt: typeof TODAY_APPOINTMENTS[0]) => void
}) {
  const [selected, setSelected] = useState<typeof TODAY_APPOINTMENTS[0] | null>(
    null,
  )

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* Appointment list */}
      <div className="lg:col-span-2 space-y-3">
        <h3 className="font-semibold text-gray-800 mb-4">
          Today's Appointments — Sep 15, 2026
        </h3>
        {TODAY_APPOINTMENTS.map((apt) => (
          <button
            key={apt.id}
            onClick={() => setSelected(apt)}
            className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md ${
              selected?.id === apt.id
                ? "border-blue-400 shadow-sm"
                : "border-gray-100 bg-white hover:border-blue-200"
            }`}
            style={selected?.id === apt.id ? { background: BLUE + "06" } : {}}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: apt.avatarColor }}
              >
                {apt.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 text-sm">
                    {apt.patient}
                  </p>
                  <Badge label={apt.status} color={apt.statusColor} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{apt.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {apt.time}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {apt.type === "Video" ? (
                      <>
                        <Video className="w-3 h-3 text-blue-600" />
                        <span>Video</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 text-gray-500" />
                        <span>In-Person</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Patient pre-consultation panel */}
      <div className="lg:col-span-3">
        {selected ? (
          <Card>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: selected.avatarColor }}
              >
                {selected.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">
                    {selected.patient}
                  </h3>
                  <span className="text-xs text-gray-400">
                    · {selected.age} yrs · {selected.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge label={selected.reason} color="blue" />
                  <Badge label={selected.time} color="gray" />
                  <Badge
                    label={selected.type}
                    color={selected.type === "Video" ? "purple" : "gray"}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <OutlineBtn small onClick={() => {}}>
                  View Profile
                </OutlineBtn>
                <PrimaryBtn small onClick={() => onStartConsultation(selected)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-current" />
                    <span>
                      {selected.status === "In Progress"
                        ? "Resume"
                        : "Start Consultation"}
                    </span>
                  </span>
                </PrimaryBtn>
              </div>
            </div>

            {/* Pre-consultation info */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pre-Consultation Information (Patient-reported)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Symptoms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.symptoms.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: "#fff7ed",
                          color: "#c2410c",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>
                      Duration:{" "}
                      <strong className="text-gray-700">
                        {selected.duration}
                      </strong>
                    </span>
                    <span>
                      Severity:{" "}
                      <strong className="text-gray-700">
                        {selected.severity}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Medical History
                  </p>
                  <p className="text-sm text-gray-700">{selected.conditions}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Allergies:{" "}
                    <strong className="text-gray-700">
                      {selected.allergies}
                    </strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Current Medications
                  </p>
                  <p className="text-sm text-gray-700">
                    {selected.medications || "None reported"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Uploaded Documents
                  </p>
                  {selected.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selected.documents.map((doc) => (
                        <div
                          key={doc}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-gray-700 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            {doc}
                          </span>
                          <button className="text-xs text-blue-600 hover:underline">
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No documents attached
                    </p>
                  )}
                </div>
              </div>

              {selected.status === "In Progress" && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <p className="text-sm font-medium text-green-800">
                    Consultation in progress
                  </p>
                  <PrimaryBtn
                    small
                    onClick={() => onStartConsultation(selected)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume Consultation</span>
                    </span>
                  </PrimaryBtn>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center p-12">
            <div className="text-center text-gray-400">
              <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-600">Select an appointment</p>
              <p className="text-sm mt-1">
                Patient pre-consultation information will appear here
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Section 18 — Doctor Consultation Notes ───────────────────────────────────

function ConsultationNotesView({
  patient,
  onComplete,
  onBack,
}: {
  patient: typeof TODAY_APPOINTMENTS[0]
  onComplete: () => void
  onBack: () => void
}) {
  const [diagnoses, setDiagnoses] = useState([{ label: "" }])
  const [prescriptions, setPrescriptions] = useState([
    {
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ])
  const [followUp, setFollowUp] = useState("follow2weeks")

  const addDiagnosis = () => setDiagnoses((d) => [...d, { label: "" }])
  const addPrescription = () =>
    setPrescriptions((p) => [
      ...p,
      {
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ])

  const FOLLOW_UP_OPTIONS = [
    { id: "none", label: "No follow-up required" },
    { id: "follow1week", label: "Follow-up in 1 week" },
    { id: "follow2weeks", label: "Follow-up in 2 weeks" },
    { id: "follow1month", label: "Follow-up in 1 month" },
    { id: "custom", label: "Custom date" },
  ]

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Appointments
        </button>
        <span className="text-gray-200">·</span>
        <h2 className="font-display text-lg font-bold" style={{ color: NAVY }}>
          Consultation — {patient.id}
        </h2>
        <span className="ml-auto">
          <Badge label="Active Consultation" color="green" />
        </span>
      </div>

      {/* Patient summary bar */}
      <Card className="p-4 flex items-center gap-4 mb-5 flex-wrap">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
          style={{ background: patient.avatarColor }}
        >
          {patient.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">{patient.patient}</span>
            <span className="text-xs text-gray-400">{patient.age} yrs</span>
          </div>
          <div className="flex gap-3 flex-wrap text-xs text-gray-500 mt-0.5">
            <span>{patient.reason}</span>
            <span>·</span>
            <span>Symptoms: {patient.symptoms.join(", ")}</span>
            <span>·</span>
            <span>Severity: {patient.severity}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {patient.documents.map((doc) => (
            <button
              key={doc}
              className="text-xs px-2.5 py-1.5 rounded-none border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{doc}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Consultation notes */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Consultation Notes
            </h3>
            <textarea
              rows={6}
              placeholder="Document your observations, discussion, and clinical assessment..."
              defaultValue="Patient presents with 5-day history of headache, fatigue and dizziness. No fever or vomiting reported. Vital signs: BP 118/76, PR 74bpm, SpO₂ 99%, Temp 36.8°C. CNS examination unremarkable. No meningeal signs."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed"
            />
          </Card>

          {/* Diagnosis */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Diagnosis</h3>
              <button
                onClick={addDiagnosis}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: BLUE }}
              >
                <span className="text-base leading-none">+</span> Add diagnosis
              </button>
            </div>
            <div className="space-y-2">
              {diagnoses.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    defaultValue={
                      i === 0 ? "Tension-type headache (G44.2)" : ""
                    }
                    placeholder={`Diagnosis ${i + 1} — include ICD code where possible`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  />
                  {diagnoses.length > 1 && (
                    <button
                      onClick={() =>
                        setDiagnoses((d) => d.filter((_, j) => j !== i))
                      }
                      className="px-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Prescription */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Prescription</h3>
              <button
                onClick={addPrescription}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: BLUE }}
              >
                <span className="text-base leading-none">+</span> Add medication
              </button>
            </div>
            <div className="space-y-4">
              {prescriptions.map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Medication {i + 1}
                    </span>
                    {prescriptions.length > 1 && (
                      <button
                        onClick={() =>
                          setPrescriptions((p) => p.filter((_, j) => j !== i))
                        }
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Input
                        placeholder="Medication name"
                        defaultValue={i === 0 ? "Paracetamol" : ""}
                      />
                    </div>
                    <Input
                      placeholder="Dosage (e.g. 500 mg)"
                      defaultValue={i === 0 ? "500 mg" : ""}
                    />
                    <Select
                      options={[
                        "Once daily",
                        "Twice daily",
                        "Three times daily",
                        "Every 6 hours",
                        "As needed",
                      ]}
                      defaultValue={i === 0 ? "Twice daily" : "Once daily"}
                    />
                    <Input
                      placeholder="Duration (e.g. 5 days)"
                      defaultValue={i === 0 ? "5 days" : ""}
                    />
                    <Input
                      placeholder="Route (e.g. Oral)"
                      defaultValue="Oral"
                    />
                    <div className="col-span-2">
                      <Input
                        placeholder="Special instructions (e.g. Take with food)"
                        defaultValue={
                          i === 0
                            ? "Take with or after food. Do not exceed 4g per day."
                            : ""
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Doctor's Recommendations
            </h3>
            <textarea
              rows={4}
              defaultValue="- Increase water intake to 2.5L daily&#10;- Rest for 48 hours; avoid strenuous activity&#10;- Limit screen time&#10;- Return if symptoms persist beyond 7 days or worsen"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed"
            />
          </Card>
        </div>

        {/* Right column — patient summary + follow-up */}
        <div className="space-y-4">
          {/* Patient pre-consult summary */}
          <Card className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Patient Summary
            </p>
            {[
              { label: "Reason", value: patient.reason },
              { label: "Symptoms", value: patient.symptoms.join(", ") },
              { label: "Duration", value: patient.duration },
              { label: "Severity", value: patient.severity },
              { label: "Conditions", value: patient.conditions },
              { label: "Medications", value: patient.medications || "None" },
              { label: "Allergies", value: patient.allergies },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-0.5 py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className="text-sm text-gray-700 font-medium">
                  {row.value}
                </span>
              </div>
            ))}
          </Card>

          {/* Follow-up */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Follow-up</h3>
            <div className="space-y-2">
              {FOLLOW_UP_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="followup"
                    value={opt.id}
                    checked={followUp === opt.id}
                    onChange={() => setFollowUp(opt.id)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
              {followUp === "custom" && (
                <input
                  type="date"
                  className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                />
              )}
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              This consultation note will be digitally signed with your
              credentials and stored as a verified clinical record. You remain
              professionally accountable for all clinical entries.
            </span>
          </div>

          {/* Complete */}
          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-none text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            style={{ background: `linear-gradient(135deg, #16a34a, #22c55e)` }}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Complete Consultation</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Complaint queue (existing, polished) ─────────────────────────────────────

function ComplaintQueueView() {
  const [selected, setSelected] = useState<typeof complaints[0] | null>(null)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 mb-4">Complaint Queue</h3>
        {complaints.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:border-blue-300 ${
              selected?.id === c.id
                ? "border-blue-400 shadow-sm"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">{c.patient}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {c.id} · {c.date}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <Badge
                  label={c.priority}
                  color={c.priority === "URGENT" ? "red" : "gray"}
                />
                <Badge
                  label={c.status.replace(/_/g, " ")}
                  color={c.status === "NEW" ? "blue" : "yellow"}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">{c.symptoms}</p>
            <p className="text-xs text-gray-400 mt-1">Severity: {c.severity}</p>
          </button>
        ))}
      </div>

      {selected ? (
        <Card className="p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">
              {selected.id}
            </p>
            <h3 className="font-display text-lg font-bold text-gray-900">
              {selected.patient}
            </h3>
            <Badge
              label={selected.priority}
              color={selected.priority === "URGENT" ? "red" : "gray"}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Patient-reported symptoms
            </p>
            <p className="text-sm text-gray-800">{selected.symptoms}</p>
            <p className="text-xs text-gray-500 mt-2">
              Severity: {selected.severity}
            </p>
          </div>
          <Field label="Clinical notes">
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
              placeholder="Document your clinical assessment..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <PrimaryBtn>Record & Resolve</PrimaryBtn>
            <OutlineBtn>Refer to Specialist</OutlineBtn>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center justify-center p-12 text-gray-400 text-sm border-dashed">
          Select a complaint to review
        </Card>
      )}
    </div>
  )
}

// ─── Records & Prescriptions ───────────────────────────────────────────────────

function ClinicalRecordsView() {
  return (
    <Card className="p-6 space-y-5 max-w-2xl">
      <h3 className="font-display text-lg font-bold text-gray-900">
        Create Verified Clinical Record
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Patient">
          <Select
            options={["John Doe", "Ama Mensah", "Kweku Osei", "Abena Frempong"]}
          />
        </Field>
        <Field label="Record type">
          <Select
            options={[
              "Diagnosis",
              "Vital Signs",
              "Lab Result",
              "Treatment Note",
              "Referral",
            ]}
          />
        </Field>
      </div>
      <Field label="Clinical content">
        <textarea
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
          placeholder="Enter clinical findings, diagnosis, or treatment notes..."
        />
      </Field>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        This record will be marked as clinically verified and associated with
        your credentials. Patients cannot edit verified records.
      </div>
      <PrimaryBtn>Save Verified Record</PrimaryBtn>
    </Card>
  )
}

function PrescriptionsView() {
  const [showForm, setShowForm] = useState(false)
  return (
    <Card className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-gray-900">
          Prescriptions
        </h3>
        <PrimaryBtn onClick={() => setShowForm(!showForm)}>
          + New Prescription
        </PrimaryBtn>
      </div>
      {showForm && (
        <div className="border border-blue-200 rounded-xl p-5 space-y-4 bg-blue-50/50">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient">
              <Select options={["John Doe", "Ama Mensah", "Kweku Osei"]} />
            </Field>
            <Field label="Medication">
              <Input placeholder="e.g. Amoxicillin 500mg" />
            </Field>
            <Field label="Dosage">
              <Input placeholder="e.g. 1 tablet" />
            </Field>
            <Field label="Frequency">
              <Select
                options={[
                  "Once daily",
                  "Twice daily",
                  "Three times daily",
                  "As needed",
                ]}
              />
            </Field>
            <Field label="Duration">
              <Input placeholder="e.g. 7 days" />
            </Field>
            <Field label="Route">
              <Select options={["Oral", "IV", "Topical", "Inhaled"]} />
            </Field>
          </div>
          <Field label="Special instructions">
            <Input placeholder="e.g. Take with food" />
          </Field>
          <div className="flex gap-3">
            <OutlineBtn onClick={() => setShowForm(false)}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={() => setShowForm(false)}>
              Issue Prescription
            </PrimaryBtn>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {[
          {
            patient: "Ama Mensah",
            med: "Ibuprofen 400mg · 3× daily · 7 days",
            date: "Sep 12",
            status: "ACTIVE",
          },
          {
            patient: "Ama Mensah",
            med: "Omeprazole 20mg · Once daily · 14 days",
            date: "Sep 12",
            status: "ACTIVE",
          },
          {
            patient: "Kweku Osei",
            med: "Amlodipine 5mg · Once daily · 30 days",
            date: "Sep 10",
            status: "ACTIVE",
          },
        ].map((rx, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 bg-white"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{rx.patient}</p>
              <p className="text-xs text-gray-500">{rx.med}</p>
            </div>
            <span className="text-xs text-gray-400">{rx.date}</span>
            <Badge label={rx.status} color="green" />
          </div>
        ))}
      </div>
    </Card>
  )
}

function VerificationView() {
  return (
    <div className="max-w-lg space-y-5">
      <h3 className="font-display text-lg font-bold text-gray-900">
        Professional Verification Status
      </h3>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: BLUE }}
          >
            KB
          </div>
          <div>
            <p className="font-semibold text-gray-900">Dr. Kofi Boateng</p>
            <p className="text-sm text-gray-500">
              General Practitioner · GMA-2021-04812
            </p>
          </div>
          <Badge label="VERIFIED" color="green" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Verification state", value: "VERIFIED" },
            { label: "Verified date", value: "Jan 14, 2024" },
            { label: "Licence expiry", value: "Dec 31, 2026" },
            { label: "Specialty", value: "General Practice" },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="font-medium text-gray-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Licence renewal:</strong> Your licence expires in 108 days.
        Ensure timely revalidation to maintain your clinical privileges.
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

type DoctorView = "appointments" | "queue" | "records" | "prescribe" | "verification"

export default function DoctorDashboard() {
  const [view, setView] = useState<DoctorView>("appointments")
  const [consultationPatient, setConsultationPatient] =
    useState<typeof TODAY_APPOINTMENTS[0] | null>(null)
  const [consultationDone, setConsultationDone] = useState(false)

  const navItems: { id: DoctorView label: string icon: React.ReactNode }[] = [
    {
      id: "appointments",
      label: "Today's Appointments",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "queue",
      label: "Complaint Queue",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: "records",
      label: "Clinical Records",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "prescribe",
      label: "Prescriptions",
      icon: <Pill className="w-4 h-4" />,
    },
    {
      id: "verification",
      label: "Verification",
      icon: <Shield className="w-4 h-4" />,
    },
  ]

  const handleComplete = () => {
    setConsultationDone(true)
    setConsultationPatient(null)
  }

  // Consultation notes full-page takeover
  if (consultationPatient) {
    return (
      <ConsultationNotesView
        patient={consultationPatient}
        onComplete={handleComplete}
        onBack={() => setConsultationPatient(null)}
      />
    )
  }

  return (
    <div>
      {/* Completion toast */}
      {consultationDone && (
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl border border-green-200 bg-green-50 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 text-sm">
              Consultation completed
            </p>
            <p className="text-xs text-green-600">
              Clinical notes, diagnosis, and prescription saved to patient
              record.
            </p>
          </div>
          <button
            onClick={() => setConsultationDone(false)}
            className="text-green-600 hover:text-green-800 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Today's Appointments",
            value: "4",
            icon: <Calendar className="w-4 h-4" />,
            accent: true,
          },
          {
            label: "Urgent Complaints",
            value: "2",
            icon: <AlertTriangle className="w-4 h-4" />,
            urgent: true,
          },
          {
            label: "Completed Today",
            value: "1",
            icon: <CheckCircle2 className="w-4 h-4" />,
          },
          {
            label: "Pending Reviews",
            value: "3",
            icon: <Clock className="w-4 h-4" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  s.urgent
                    ? "bg-red-50 text-red-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {s.icon}
              </div>
            </div>
            <p
              className={`text-2xl font-bold ${
                s.urgent ? "text-red-700" : "text-slate-900"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="w-full flex justify-center mb-6">
        <div className="w-full lg:w-[90%] max-w-5xl flex items-center justify-start sm:justify-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-xs overflow-x-auto">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                view === n.id
                  ? "text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              style={view === n.id ? { background: BLUE } : {}}
            >
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {view === "appointments" && (
        <AppointmentsView
          onStartConsultation={(apt) => setConsultationPatient(apt)}
        />
      )}
      {view === "queue" && <ComplaintQueueView />}
      {view === "records" && <ClinicalRecordsView />}
      {view === "prescribe" && <PrescriptionsView />}
      {view === "verification" && <VerificationView />}
    </div>
  )
}
