import { useState, useEffect, useCallback } from "react"
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
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  Play,
  Siren,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { api, ClinicalRecordType, type ClinicalRecordTypeValue } from "@/utils/api"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"

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

function PrimaryBtn({
  children,
  onClick,
  small,
  disabled,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn-rise text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
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
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`btn-underline disabled:opacity-50 disabled:cursor-not-allowed ${
        small ? "!px-3 !py-1.5 !text-xs" : "!px-4 !py-2 !text-sm"
      }`}
    >
      {children}
    </button>
  )
}

const AVATAR_COLORS = ["#7c3aed", "#be185d", "#047857", "#b45309", "#1d4ed8"]
function avatarColorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type DoctorAppointment = Awaited<
  ReturnType<typeof api.professional.getAppointments>
>[number]
type DoctorComplaint = Awaited<
  ReturnType<typeof api.professional.getComplaints>
>[number]
type DoctorPatient = Awaited<
  ReturnType<typeof api.professional.getPatients>
>[number]
type DoctorClinicalRecord = Awaited<
  ReturnType<typeof api.professional.getClinicalRecords>
>[number]
type DoctorPrescription = Awaited<
  ReturnType<typeof api.professional.getPrescriptions>
>[number]
type DoctorEmergency = Awaited<
  ReturnType<typeof api.professional.getEmergencies>
>[number]
type DashboardSummary = Awaited<
  ReturnType<typeof api.professional.getDashboard>
>

function appointmentStatusColor(
  status: string,
): "green" | "blue" | "yellow" | "red" | "gray" {
  if (status === "COMPLETED") return "green"
  if (status === "CONFIRMED") return "blue"
  if (status === "PENDING_CONFIRMATION") return "yellow"
  if (status === "CANCELLED" || status === "NO_SHOW") return "red"
  return "gray"
}

// ─── Appointments + Pre-Consultation Panel ───────────────────────────────────

function AppointmentsView({
  appointments,
  onStartConsultation,
  onVerifyProfile,
  onRefresh,
}: {
  appointments: DoctorAppointment[]
  onStartConsultation: (apt: DoctorAppointment) => void
  onVerifyProfile: (patientId: string) => Promise<void>
  onRefresh: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    appointments[0]?.id ?? null,
  )
  const [verifying, setVerifying] = useState(false)

  const selected =
    appointments.find((a) => a.id === selectedId) ?? appointments[0] ?? null

  const handleVerify = async (patientId: string) => {
    setVerifying(true)
    try {
      await onVerifyProfile(patientId)
      onRefresh()
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* Appointment list */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">
            Appointments ({appointments.length})
          </h3>
          <button
            onClick={onRefresh}
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {appointments.length === 0 ? (
          <Card className="p-8 text-center text-gray-400 text-sm">
            No appointments scheduled yet. When a patient books an appointment
            with you, it will appear here automatically.
          </Card>
        ) : (
          appointments.map((apt) => (
            <button
              key={apt.id}
              onClick={() => setSelectedId(apt.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
                selected?.id === apt.id
                  ? "border-blue-400 shadow-sm"
                  : "border-gray-100 bg-white hover:border-blue-200"
              }`}
              style={selected?.id === apt.id ? { background: BLUE + "06" } : {}}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: avatarColorFor(apt.patientId) }}
                >
                  {apt.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {apt.patientName}
                    </p>
                    <Badge
                      label={apt.status.replace(/_/g, " ")}
                      color={appointmentStatusColor(apt.status)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {apt.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {apt.date} · {apt.time}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {apt.type.toLowerCase().includes("video") ? (
                        <>
                          <Video className="w-3 h-3 text-blue-600" />
                          <span>Video</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 text-gray-500" />
                          <span>{apt.type}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Patient pre-consultation panel */}
      <div className="lg:col-span-3">
        {selected ? (
          <Card>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center gap-4 flex-wrap">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: avatarColorFor(selected.patientId) }}
              >
                {selected.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">
                    {selected.patientName}
                  </h3>
                  <span className="text-xs text-gray-400">
                    · {selected.age} yrs · {selected.appointmentNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge label={selected.reason} color="blue" />
                  <Badge label={`${selected.date} · ${selected.time}`} color="gray" />
                  <Badge
                    label={
                      selected.clinicallyVerified
                        ? "Clinically Verified Profile"
                        : "Patient-Reported Profile"
                    }
                    color={selected.clinicallyVerified ? "green" : "yellow"}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {!selected.clinicallyVerified && (
                  <OutlineBtn
                    small
                    disabled={verifying}
                    onClick={() => handleVerify(selected.patientId)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {verifying ? "Verifying..." : "Verify Profile"}
                    </span>
                  </OutlineBtn>
                )}
                {selected.status !== "COMPLETED" &&
                  selected.status !== "CANCELLED" && (
                    <PrimaryBtn
                      small
                      onClick={() => onStartConsultation(selected)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Consultation</span>
                      </span>
                    </PrimaryBtn>
                  )}
              </div>
            </div>

            {/* Pre-consultation info */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pre-Consultation Information (
                {selected.clinicallyVerified
                  ? "Clinically Verified"
                  : "Patient-Reported"}
                )
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Symptoms
                  </p>
                  {selected.symptoms.length > 0 ? (
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
                  ) : (
                    <p className="text-sm text-gray-400">No symptoms listed</p>
                  )}
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
                    </strong>{" "}
                    · Blood Group:{" "}
                    <strong className="text-gray-700">
                      {selected.bloodGroup}
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

// ─── Doctor Consultation Notes Takeover ──────────────────────────────────────

function ConsultationNotesView({
  appointment,
  onComplete,
  onBack,
}: {
  appointment: DoctorAppointment
  onComplete: () => void
  onBack: () => void
}) {
  const [notes, setNotes] = useState("")
  const [vitalSigns, setVitalSigns] = useState("")
  const [diagnoses, setDiagnoses] = useState<string[]>([""])
  const [recommendations, setRecommendations] = useState("")
  const [prescriptions, setPrescriptions] = useState([
    {
      medicine: "",
      dose: "",
      frequency: "Twice daily",
      duration: "",
      route: "Oral",
      instructions: "",
    },
  ])
  const [followUp, setFollowUp] = useState<
    "none" | "follow1week" | "follow2weeks" | "follow1month" | "custom"
  >("follow2weeks")
  const [followUpDate, setFollowUpDate] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addDiagnosis = () => setDiagnoses((d) => [...d, ""])
  const addPrescription = () =>
    setPrescriptions((p) => [
      ...p,
      {
        medicine: "",
        dose: "",
        frequency: "Once daily",
        duration: "",
        route: "Oral",
        instructions: "",
      },
    ])

  const FOLLOW_UP_OPTIONS: Array<{
    id: "none" | "follow1week" | "follow2weeks" | "follow1month" | "custom"
    label: string
  }> = [
    { id: "none", label: "No follow-up required" },
    { id: "follow1week", label: "Follow-up in 1 week" },
    { id: "follow2weeks", label: "Follow-up in 2 weeks" },
    { id: "follow1month", label: "Follow-up in 1 month" },
    { id: "custom", label: "Custom date" },
  ]

  const handleComplete = async () => {
    setError(null)
    if (notes.trim().length < 5) {
      setError("Please enter consultation notes (at least 5 characters).")
      return
    }
    setSubmitting(true)
    try {
      const validPrescriptions = prescriptions.filter(
        (rx) => rx.medicine.trim() && rx.dose.trim() && rx.duration.trim(),
      )
      await api.professional.completeConsultation(appointment.appointmentNumber, {
        consultationNotes: notes.trim(),
        diagnoses: diagnoses.map((d) => d.trim()).filter(Boolean),
        vitalSigns: vitalSigns.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        followUp,
        followUpDate: followUp === "custom" ? followUpDate : undefined,
        prescriptions: validPrescriptions,
      })
      onComplete()
    } catch (err: any) {
      setError(err?.message || "Failed to complete consultation.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          ← Back to Appointments
        </button>
        <span className="text-gray-200">·</span>
        <h2 className="font-display text-lg font-bold" style={{ color: NAVY }}>
          Consultation — {appointment.appointmentNumber}
        </h2>
        <span className="ml-auto">
          <Badge label="Active Consultation" color="green" />
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Patient summary bar */}
      <Card className="p-4 flex items-center gap-4 mb-5 flex-wrap">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
          style={{ background: avatarColorFor(appointment.patientId) }}
        >
          {appointment.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">
              {appointment.patientName}
            </span>
            <span className="text-xs text-gray-400">{appointment.age} yrs</span>
          </div>
          <div className="flex gap-3 flex-wrap text-xs text-gray-500 mt-0.5">
            <span>{appointment.reason}</span>
            {appointment.symptoms.length > 0 && (
              <>
                <span>·</span>
                <span>Symptoms: {appointment.symptoms.join(", ")}</span>
              </>
            )}
            <span>·</span>
            <span>Allergies: {appointment.allergies}</span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Consultation notes */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Consultation Notes *
            </h3>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document your observations, examination findings, and clinical assessment..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="mt-3">
              <Field label="Vital Signs (Optional — saved as verified VITAL_SIGNS record)">
                <input
                  value={vitalSigns}
                  onChange={(e) => setVitalSigns(e.target.value)}
                  placeholder="e.g. BP 118/76 mmHg, PR 74 bpm, SpO2 99%, Temp 36.8°C"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </Field>
            </div>
          </Card>

          {/* Diagnosis */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Diagnosis</h3>
              <button
                type="button"
                onClick={addDiagnosis}
                className="text-xs font-medium flex items-center gap-1 cursor-pointer"
                style={{ color: BLUE }}
              >
                <span className="text-base leading-none">+</span> Add diagnosis
              </button>
            </div>
            <div className="space-y-2">
              {diagnoses.map((diag, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={diag}
                    onChange={(e) =>
                      setDiagnoses((prev) =>
                        prev.map((v, j) => (j === i ? e.target.value : v)),
                      )
                    }
                    placeholder={`Diagnosis ${i + 1} — include ICD code where possible`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  />
                  {diagnoses.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDiagnoses((d) => d.filter((_, j) => j !== i))
                      }
                      className="px-2 text-gray-400 hover:text-red-500 cursor-pointer p-1 rounded"
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
                type="button"
                onClick={addPrescription}
                className="text-xs font-medium flex items-center gap-1 cursor-pointer"
                style={{ color: BLUE }}
              >
                <span className="text-base leading-none">+</span> Add medication
              </button>
            </div>
            <div className="space-y-4">
              {prescriptions.map((rx, i) => (
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
                        type="button"
                        onClick={() =>
                          setPrescriptions((p) => p.filter((_, j) => j !== i))
                        }
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={rx.medicine}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i ? { ...item, medicine: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Medication name (e.g. Paracetamol)"
                      className="col-span-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      value={rx.dose}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i ? { ...item, dose: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Dosage (e.g. 500 mg)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <select
                      value={rx.frequency}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i
                              ? { ...item, frequency: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    >
                      {[
                        "Once daily",
                        "Twice daily",
                        "Three times daily",
                        "Every 6 hours",
                        "As needed",
                      ].map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                    <input
                      value={rx.duration}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i ? { ...item, duration: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Duration (e.g. 5 days)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      value={rx.route}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i ? { ...item, route: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Route (e.g. Oral)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      value={rx.instructions}
                      onChange={(e) =>
                        setPrescriptions((p) =>
                          p.map((item, j) =>
                            j === i
                              ? { ...item, instructions: e.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Special instructions (e.g. Take with food)"
                      className="col-span-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
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
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Lifestyle advice, warning signs, next steps..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed"
            />
          </Card>
        </div>

        {/* Right column — patient summary + follow-up */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Patient Summary
            </p>
            {[
              { label: "Reason", value: appointment.reason },
              {
                label: "Symptoms",
                value: appointment.symptoms.join(", ") || "None listed",
              },
              { label: "Duration", value: appointment.duration },
              { label: "Severity", value: appointment.severity },
              { label: "Conditions", value: appointment.conditions },
              { label: "Medications", value: appointment.medications || "None" },
              { label: "Allergies", value: appointment.allergies },
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
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                />
              )}
            </div>
          </Card>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              This consultation note will be digitally signed with your verified
              credentials and saved directly to the patient's immutable clinical
              record.
            </span>
          </div>

          <button
            disabled={submitting}
            onClick={handleComplete}
            className="w-full py-3.5 rounded-none text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {submitting ? "Saving Consultation..." : "Complete Consultation"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Complaint Queue ──────────────────────────────────────────────────────────

function ComplaintQueueView({
  complaints,
  onUpdated,
}: {
  complaints: DoctorComplaint[]
  onUpdated: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    complaints[0]?.id ?? null,
  )
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selected =
    complaints.find((c) => c.id === selectedId) ?? complaints[0] ?? null

  useEffect(() => {
    if (selected) {
      setNotes(selected.clinicalNotes || "")
    }
  }, [selected?.id])

  const handleAction = async (
    status: "UNDER_REVIEW" | "REFERRED_TO_SPECIALIST" | "RESOLVED",
  ) => {
    if (!selected) return
    setSaving(true)
    setFeedback(null)
    try {
      await api.professional.updateComplaint(selected.referenceId, {
        status,
        clinicalNotes: notes.trim() || undefined,
      })
      setFeedback(`Complaint ${selected.referenceId} updated to ${status.replace(/_/g, " ")}.`)
      onUpdated()
    } catch (err: any) {
      setFeedback(err?.message || "Failed to update complaint.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 mb-3">
          Complaint Queue ({complaints.length})
        </h3>
        {complaints.length === 0 ? (
          <Card className="p-8 text-center text-gray-400 text-sm">
            No patient complaints in the queue.
          </Card>
        ) : (
          complaints.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:border-blue-300 cursor-pointer ${
                selected?.id === c.id
                  ? "border-blue-400 shadow-sm"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{c.patientName}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {c.referenceId} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge
                    label={c.priority}
                    color={c.priority === "URGENT" ? "red" : "gray"}
                  />
                  <Badge
                    label={c.status.replace(/_/g, " ")}
                    color={
                      c.status === "RESOLVED"
                        ? "green"
                        : c.status === "NEW"
                          ? "blue"
                          : "yellow"
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">{c.symptoms}</p>
              <p className="text-xs text-gray-400 mt-1">
                Severity: {c.severity}
                {c.assignedDoctor ? ` · Assigned: ${c.assignedDoctor}` : ""}
              </p>
            </button>
          ))
        )}
      </div>

      {selected ? (
        <Card className="p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">
              {selected.referenceId}
            </p>
            <h3 className="font-display text-lg font-bold text-gray-900">
              {selected.patientName} ({selected.patientAge} yrs)
            </h3>
            <div className="flex gap-2 mt-1">
              <Badge
                label={selected.priority}
                color={selected.priority === "URGENT" ? "red" : "gray"}
              />
              <Badge
                label={selected.status.replace(/_/g, " ")}
                color={selected.status === "RESOLVED" ? "green" : "yellow"}
              />
            </div>
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
              {feedback}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Patient-reported symptoms
            </p>
            <p className="text-sm text-gray-800">{selected.symptoms}</p>
            <p className="text-xs text-gray-500 mt-2">
              Severity: {selected.severity}
              {selected.duration ? ` · Duration: ${selected.duration}` : ""}
            </p>
          </div>

          <Field label="Clinical notes">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
              placeholder="Document your clinical assessment..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <PrimaryBtn
              disabled={saving}
              onClick={() => handleAction("RESOLVED")}
            >
              {saving ? "Saving..." : "Record & Resolve"}
            </PrimaryBtn>
            <OutlineBtn
              disabled={saving}
              onClick={() => handleAction("REFERRED_TO_SPECIALIST")}
            >
              Refer to Specialist
            </OutlineBtn>
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

// ─── Clinical Records ─────────────────────────────────────────────────────────

function ClinicalRecordsView({
  patients,
  records,
  onCreated,
}: {
  patients: DoctorPatient[]
  records: DoctorClinicalRecord[]
  onCreated: () => void
}) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "")
  const [type, setType] = useState<ClinicalRecordTypeValue>(
    ClinicalRecordType.DIAGNOSIS,
  )
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0].id)
    }
  }, [patients, patientId])

  const handleSave = async () => {
    setMsg(null)
    if (!patientId) {
      setMsg({ ok: false, text: "Please select a patient." })
      return
    }
    if (content.trim().length < 3) {
      setMsg({ ok: false, text: "Clinical content must be at least 3 characters." })
      return
    }
    setSaving(true)
    try {
      await api.professional.createClinicalRecord({
        patientId,
        type,
        content: content.trim(),
      })
      setContent("")
      setMsg({
        ok: true,
        text: "Verified clinical record saved and synced to the patient portal.",
      })
      onCreated()
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || "Failed to save record." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-5">
        <h3 className="font-display text-lg font-bold text-gray-900">
          Create Verified Clinical Record
        </h3>
        {msg && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              msg.ok
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Patient">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
            >
              {patients.length === 0 && (
                <option value="">No registered patients yet</option>
              )}
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}y)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Record type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ClinicalRecordTypeValue)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
            >
              <option value={ClinicalRecordType.DIAGNOSIS}>Diagnosis</option>
              <option value={ClinicalRecordType.VITAL_SIGNS}>Vital Signs</option>
              <option value={ClinicalRecordType.LAB_RESULT}>Lab Result</option>
              <option value={ClinicalRecordType.TREATMENT_NOTE}>
                Treatment Note
              </option>
              <option value={ClinicalRecordType.REFERRAL}>Referral</option>
            </select>
          </Field>
        </div>
        <Field label="Clinical content">
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
            placeholder="Enter clinical findings, diagnosis, or treatment notes..."
          />
        </Field>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          This record will be marked as clinically verified and signed with your
          credentials. Patients cannot edit or delete verified records.
        </div>
        <PrimaryBtn disabled={saving || patients.length === 0} onClick={handleSave}>
          {saving ? "Saving..." : "Save Verified Record"}
        </PrimaryBtn>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-gray-900">
          Recent Verified Records ({records.length})
        </h3>
        {records.length === 0 ? (
          <p className="text-sm text-gray-400">
            Records you author will appear here.
          </p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {r.patientName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge label={r.type.replace(/_/g, " ")} color="blue" />
                    <span className="text-xs font-mono text-gray-400">
                      {r.recordNumber}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {r.content}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Verified · {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

function PrescriptionsView({
  patients,
  prescriptions,
  onChanged,
}: {
  patients: DoctorPatient[]
  prescriptions: DoctorPrescription[]
  onChanged: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "")
  const [medicine, setMedicine] = useState("")
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("Twice daily")
  const [duration, setDuration] = useState("")
  const [route, setRoute] = useState("Oral")
  const [instructions, setInstructions] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0].id)
    }
  }, [patients, patientId])

  const handleIssue = async () => {
    setMsg(null)
    if (!patientId || !medicine.trim() || !dose.trim() || !duration.trim()) {
      setMsg("Please fill patient, medication, dosage, and duration.")
      return
    }
    setSaving(true)
    try {
      await api.professional.createPrescription({
        patientId,
        medicine: medicine.trim(),
        dose: dose.trim(),
        frequency,
        duration: duration.trim(),
        route,
        instructions: instructions.trim() || undefined,
      })
      setMedicine("")
      setDose("")
      setDuration("")
      setInstructions("")
      setShowForm(false)
      setMsg("Prescription issued and synced to patient's medication tracker.")
      onChanged()
    } catch (err: any) {
      setMsg(err?.message || "Failed to issue prescription.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-gray-900">
          Prescriptions ({prescriptions.length})
        </h3>
        <PrimaryBtn onClick={() => setShowForm(!showForm)}>
          + New Prescription
        </PrimaryBtn>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
          {msg}
        </div>
      )}

      {showForm && (
        <div className="border border-blue-200 rounded-xl p-5 space-y-4 bg-blue-50/40">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient">
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Medication">
              <input
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </Field>
            <Field label="Dosage">
              <input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 1 tablet"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </Field>
            <Field label="Frequency">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
              >
                {["Once daily", "Twice daily", "Three times daily", "As needed"].map(
                  (o) => (
                    <option key={o}>{o}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Duration">
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 7 days"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </Field>
            <Field label="Route">
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
              >
                {["Oral", "IV", "Topical", "Inhaled"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Special instructions">
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with food"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </Field>
          <div className="flex gap-3">
            <OutlineBtn onClick={() => setShowForm(false)}>Cancel</OutlineBtn>
            <PrimaryBtn disabled={saving} onClick={handleIssue}>
              {saving ? "Issuing..." : "Issue Prescription"}
            </PrimaryBtn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-400">
            No prescriptions issued yet.
          </p>
        ) : (
          prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 bg-white flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {rx.patientName}{" "}
                  <span className="text-xs font-mono text-gray-400">
                    ({rx.prescriptionNumber})
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {rx.medicine} · {rx.dose} · {rx.frequency} · {rx.duration}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(rx.createdAt).toLocaleDateString()}
              </span>
              <Badge
                label={rx.status}
                color={
                  rx.status === "ACTIVE"
                    ? "green"
                    : rx.status === "COMPLETED"
                      ? "blue"
                      : "gray"
                }
              />
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

// ─── Emergency Break-Glass Queue ──────────────────────────────────────────────

function EmergenciesView({
  emergencies,
  onUpdated,
}: {
  emergencies: DoctorEmergency[]
  onUpdated: () => void
}) {
  const [busyCase, setBusyCase] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const handleRespond = async (caseNumber: string) => {
    setBusyCase(caseNumber)
    setError(null)
    try {
      await api.professional.respondEmergency(
        caseNumber,
        "On-call verified clinician accepting Break-Glass emergency response",
      )
      onUpdated()
    } catch (err: any) {
      setError(err?.message || "Unable to respond to emergency case.")
    } finally {
      setBusyCase(null)
    }
  }

  const handleResolve = async (caseNumber: string) => {
    const notes =
      resolutionNotes[caseNumber]?.trim() ||
      "Emergency stabilized and clinical handoff completed."
    setBusyCase(caseNumber)
    setError(null)
    try {
      await api.professional.resolveEmergency(caseNumber, notes)
      onUpdated()
    } catch (err: any) {
      setError(err?.message || "Unable to resolve emergency case.")
    } finally {
      setBusyCase(null)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2.5">
        <Siren className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Break-Glass Protocol (Rule C):</strong> Active emergency cases
          bypass prior doctor–patient relationships. Every emergency access,
          response, and resolution writes an immutable entry to the legal
          Emergency Audit Log.
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
          {error}
        </div>
      )}

      {emergencies.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm">
          No active Break-Glass emergency cases right now.
        </Card>
      ) : (
        emergencies.map((emg) => (
          <Card key={emg.id} className="p-5 space-y-4 border-red-200">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-red-600 font-semibold">
                    {emg.caseNumber}
                  </span>
                  <Badge
                    label={emg.status}
                    color={emg.status === "ACTIVE" ? "red" : "yellow"}
                  />
                </div>
                <h4 className="font-bold text-gray-900 mt-1">
                  {emg.patientName} · {emg.patientAge} yrs · {emg.patientPhone}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {emg.reason || "Emergency assistance requested"}
                </p>
              </div>
              <div className="flex gap-2">
                {emg.status === "ACTIVE" && (
                  <PrimaryBtn
                    small
                    disabled={busyCase === emg.caseNumber}
                    onClick={() => handleRespond(emg.caseNumber)}
                  >
                    {busyCase === emg.caseNumber
                      ? "Responding..."
                      : "Accept & Respond"}
                  </PrimaryBtn>
                )}
              </div>
            </div>

            {emg.snapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl">
                <div>
                  <span className="text-gray-400 block">Blood Group</span>
                  <strong className="text-gray-800">
                    {emg.snapshot.bloodGroup || "Not documented"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Allergies</span>
                  <strong className="text-gray-800">
                    {emg.snapshot.allergies || "None reported"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Active Meds</span>
                  <strong className="text-gray-800">
                    {emg.snapshot.activeMedsSummary || "None"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Emergency Contact</span>
                  <strong className="text-gray-800">
                    {emg.snapshot.emergencyContact
                      ? `${emg.snapshot.emergencyContact.fullName} (${emg.snapshot.emergencyContact.phoneNumber})`
                      : "None"}
                  </strong>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={resolutionNotes[emg.caseNumber] || ""}
                onChange={(e) =>
                  setResolutionNotes((prev) => ({
                    ...prev,
                    [emg.caseNumber]: e.target.value,
                  }))
                }
                placeholder="Enter resolution notes to close case..."
                className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <OutlineBtn
                small
                disabled={busyCase === emg.caseNumber}
                onClick={() => handleResolve(emg.caseNumber)}
              >
                Mark Resolved
              </OutlineBtn>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

// ─── Verification View ────────────────────────────────────────────────────────

function VerificationView({
  summary,
}: {
  summary: DashboardSummary | null
}) {
  const { user } = useAuth()
  const prof = summary?.professional

  const displayName = prof?.displayName || user?.name || "Healthcare Professional"
  const initials = user?.initials || "DR"
  const status = prof?.verificationStatus || user?.verificationStatus || "PENDING"
  const isVerified =
    status === "VERIFIED" || status === "VERIFIED_WITH_RESTRICTIONS"

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
            {initials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">
              {prof?.specialty || user?.specialty || "General Practice"} ·{" "}
              {prof?.licenceNumber || user?.licenceNumber || "Pending Licence"}
            </p>
          </div>
          <Badge
            label={status.replace(/_/g, " ")}
            color={isVerified ? "green" : status === "REJECTED" ? "red" : "yellow"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Verification state", value: status.replace(/_/g, " ") },
            {
              label: "Verified date",
              value: prof?.verifiedAt
                ? new Date(prof.verifiedAt).toLocaleDateString()
                : "Pending",
            },
            {
              label: "Licence expiry",
              value: prof?.licenceExpiry
                ? new Date(prof.licenceExpiry).toLocaleDateString()
                : "—",
            },
            {
              label: "Facility",
              value: prof?.facility || user?.facility || "—",
            },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="font-medium text-gray-800 mt-0.5 text-sm">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
      {!isVerified ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Clinical privileges locked:</strong> Your account is currently{" "}
          <strong>{status}</strong>. Once a Healthitude administrator verifies
          your medical credentials, patient appointments, clinical records, and
          prescriptions will unlock automatically.
        </div>
      ) : (
        prof &&
        prof.daysUntilLicenceExpiry <= 120 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Licence renewal:</strong> Your licence expires in{" "}
            {prof.daysUntilLicenceExpiry} days. Ensure timely revalidation to
            maintain your clinical privileges.
          </div>
        )
      )}
    </div>
  )
}

// ─── Main DoctorDashboard ─────────────────────────────────────────────────────

type DoctorView =
  | "appointments"
  | "queue"
  | "records"
  | "prescribe"
  | "emergencies"
  | "verification"

export default function DoctorDashboard() {
  const { user } = useAuth()
  const isVerified =
    user?.verificationStatus === "VERIFIED" ||
    user?.verificationStatus === "VERIFIED_WITH_RESTRICTIONS"

  const [view, setView] = useState<DoctorView>(
    isVerified ? "appointments" : "verification",
  )
  const [consultationApt, setConsultationApt] =
    useState<DoctorAppointment | null>(null)
  const [consultationDone, setConsultationDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [complaints, setComplaints] = useState<DoctorComplaint[]>([])
  const [patients, setPatients] = useState<DoctorPatient[]>([])
  const [records, setRecords] = useState<DoctorClinicalRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([])
  const [emergencies, setEmergencies] = useState<DoctorEmergency[]>([])

  const loadClinicalData = useCallback(async () => {
    if (!isVerified) return
    setLoading(true)
    setLoadError(null)
    try {
      const [dash, apts, cpls, pats, recs, rxs, emgs] = await Promise.all([
        api.professional.getDashboard(),
        api.professional.getAppointments({ tab: "all" }),
        api.professional.getComplaints(),
        api.professional.getPatients(),
        api.professional.getClinicalRecords(),
        api.professional.getPrescriptions(),
        api.professional.getEmergencies(),
      ])
      setSummary(dash)
      setAppointments(apts)
      setComplaints(cpls)
      setPatients(pats)
      setRecords(recs)
      setPrescriptions(rxs)
      setEmergencies(emgs)
    } catch (err: any) {
      setLoadError(
        err?.message ||
          "Unable to load clinical data from the Healthitude server.",
      )
    } finally {
      setLoading(false)
    }
  }, [isVerified])

  useEffect(() => {
    loadClinicalData()
  }, [loadClinicalData])

  // Rule 3.B: Unverified professionals see only the Verification view
  if (!isVerified) {
    return <VerificationView summary={summary} />
  }

  const navItems: { id: DoctorView; label: string; icon: React.ReactNode }[] = [
    {
      id: "appointments",
      label: "Appointments",
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
      id: "emergencies",
      label: `Emergencies${emergencies.length > 0 ? ` (${emergencies.length})` : ""}`,
      icon: <Siren className="w-4 h-4" />,
    },
    {
      id: "verification",
      label: "Verification",
      icon: <Shield className="w-4 h-4" />,
    },
  ]

  const handleComplete = () => {
    setConsultationDone(true)
    setConsultationApt(null)
    loadClinicalData()
  }

  if (consultationApt) {
    return (
      <ConsultationNotesView
        appointment={consultationApt}
        onComplete={handleComplete}
        onBack={() => setConsultationApt(null)}
      />
    )
  }

  const m = summary?.metrics

  return (
    <div>
      {consultationDone && (
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl border border-green-200 bg-green-50 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 text-sm">
              Consultation completed
            </p>
            <p className="text-xs text-green-600">
              Verified clinical notes, diagnoses, and prescriptions have been
              saved to the patient's record.
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

      {loadError && (
        <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-center justify-between">
          <span>{loadError}</span>
          <OutlineBtn small onClick={loadClinicalData}>
            Retry
          </OutlineBtn>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Upcoming Appointments",
            value: loading ? "…" : String(m?.upcomingAppointmentsCount ?? 0),
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            label: "Urgent Complaints",
            value: loading ? "…" : String(m?.urgentComplaintsCount ?? 0),
            icon: <AlertTriangle className="w-4 h-4" />,
            urgent: (m?.urgentComplaintsCount ?? 0) > 0,
          },
          {
            label: "Completed Today",
            value: loading ? "…" : String(m?.completedTodayCount ?? 0),
            icon: <CheckCircle2 className="w-4 h-4" />,
          },
          {
            label: "Pending Reviews",
            value: loading ? "…" : String(m?.pendingReviewsCount ?? 0),
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
        <div className="w-full lg:w-[95%] max-w-5xl flex items-center justify-start sm:justify-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-xs overflow-x-auto">
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
          appointments={appointments}
          onStartConsultation={(apt) => setConsultationApt(apt)}
          onVerifyProfile={async (patientId) => {
            await api.professional.verifyPatientHealthProfile(patientId)
          }}
          onRefresh={loadClinicalData}
        />
      )}
      {view === "queue" && (
        <ComplaintQueueView
          complaints={complaints}
          onUpdated={loadClinicalData}
        />
      )}
      {view === "records" && (
        <ClinicalRecordsView
          patients={patients}
          records={records}
          onCreated={loadClinicalData}
        />
      )}
      {view === "prescribe" && (
        <PrescriptionsView
          patients={patients}
          prescriptions={prescriptions}
          onChanged={loadClinicalData}
        />
      )}
      {view === "emergencies" && (
        <EmergenciesView
          emergencies={emergencies}
          onUpdated={loadClinicalData}
        />
      )}
      {view === "verification" && <VerificationView summary={summary} />}
    </div>
  )
}
