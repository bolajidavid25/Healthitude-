import { useState, useEffect, useCallback } from "react"

import {
  api,
  PatientDashboardResponse,
  ComplaintRecord,
  ClinicalRecordItem,
  PrescriptionItem,
  AppointmentItem,
  ProviderItem,
  TelemedicineSessionItem,
  PatientPricingResponse,
  PatientEmergencyStatusResponse,
  EmergencyCaseItem,
  EmergencySnapshot,
  EmergencyAuditLogItem,
} from "@/utils/api"
import TelemedicineFlow from "@/components/TelemedicineFlow"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  Activity,
  FileText,
  Pill,
  Calendar,
  Video,
  Search,
  CreditCard,
  AlertTriangle,
  Check,
  CheckCircle2,
  X,
  MapPin,
  Building2,
  Globe,
  MessageSquare,
  Mic,
  MicOff,
  VideoOff,
  CameraOff,
  ArrowRight,
  Send,
} from "lucide-react"

type PatientView = "overview" | "complaints" | "records" | "prescriptions" | "appointments" | "providers" | "telemedicine" | "pricing" | "emergency"

const BLUE = "#1a3fcf"

function Badge({
  label,
  color,
}: {
  label: string
  color: "green" | "blue" | "yellow" | "red" | "gray"
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              accent ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function OverviewPanel() {
  const [dashboard, setDashboard] = useState<PatientDashboardResponse | null>(
    null,
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getDashboard()
      setDashboard(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard overview.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 border border-gray-100 bg-white h-28 flex flex-col justify-between"
            >
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-7 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 h-44" />
        <div className="bg-white rounded-xl border border-gray-100 p-5 h-44" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
        <p className="text-red-700 font-semibold text-sm">
          {error || "Unable to display dashboard overview"}
        </p>
        <p className="text-xs text-red-500">
          Please verify your connection and that the backend server is
          reachable.
        </p>
        <button
          onClick={loadDashboard}
          className="btn-rise !px-4 !py-2 !text-xs text-white font-semibold"
        >
          Retry
        </button>
      </div>
    )
  }

  const { metrics, vitals, careTeam } = dashboard
  const hasVitals = vitals.items && vitals.items.length > 0
  const hasCareTeam = careTeam && careTeam.length > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Complaints"
          value={String(metrics.activeComplaintsCount)}
          sub={
            metrics.activeComplaintsCount > 0
              ? `${metrics.underReviewComplaintsCount} under review`
              : "No active complaints"
          }
          icon={<Activity className="w-4 h-4" />}
          accent={metrics.activeComplaintsCount > 0}
        />
        <StatCard
          label="Medications"
          value={String(metrics.medicationsCount)}
          sub={metrics.medicationsSummary}
          icon={<Pill className="w-4 h-4" />}
        />
        <StatCard
          label="Next Appointment"
          value={metrics.nextAppointment?.date || "None scheduled"}
          sub={
            metrics.nextAppointment
              ? `${metrics.nextAppointment.doctor} · ${metrics.nextAppointment.time}`
              : "No upcoming visits"
          }
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Billing Category"
          value={metrics.category.label}
          sub={`${metrics.category.verificationStatus} · 1 active category`}
          icon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      {/* Vitals */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            Recent Vitals
            <span
              className={`text-xs font-normal ml-2 inline-flex items-center gap-1 ${
                vitals.clinicallyVerified ? "text-green-600" : "text-gray-400"
              }`}
            >
              {vitals.clinicallyVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Clinically verified</span>
                </>
              ) : (
                <span>Pending clinical verification</span>
              )}
            </span>
          </h3>
          {vitals.verifiedAt && (
            <span className="text-xs text-gray-400">
              Verified: {new Date(vitals.verifiedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {hasVitals ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {vitals.items.map((v) => (
              <div
                key={v.label}
                className="p-4 rounded-lg bg-gray-50 border border-gray-100"
              >
                <p className="text-xs text-gray-500 mb-1">{v.label}</p>
                <p className="text-xl font-bold text-gray-800">
                  {v.value}{" "}
                  <span className="text-xs font-normal text-gray-500">
                    {v.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm font-medium text-gray-600">
              No clinical vitals recorded yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your vital signs (Blood Pressure, Heart Rate, Temperature, SpO₂)
              will appear here once recorded and verified during a consultation.
            </p>
          </div>
        )}
      </div>

      {/* Primary Doctor / Care Team */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Care Team</h3>
        {hasCareTeam ? (
          <div className="space-y-3">
            {careTeam.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: BLUE }}
                >
                  {p.name.split(" ")[1]?.[0] || p.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.role} · {p.specialty}
                  </p>
                </div>
                <Badge
                  label={p.status}
                  color={p.status === "VERIFIED" ? "green" : "yellow"}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm font-medium text-gray-600">
              No care team assigned yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              A primary doctor will be assigned when you book an appointment or
              submit a clinical complaint.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ComplaintsPanel() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [symptoms, setSymptoms] = useState("")
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe">(
    "Moderate",
  )
  const [duration, setDuration] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getComplaints()
      setComplaints(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load complaints.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      setFormError("Please describe your symptoms in at least 3 characters.")
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      await api.patient.createComplaint({
        symptoms: symptoms.trim(),
        severity: severity,
        duration: duration.trim() || undefined,
      })
      setSymptoms("")
      setSeverity("Moderate")
      setDuration("")
      setShowForm(false)
      await loadComplaints()
    } catch (err: any) {
      setFormError(
        err?.message || "Failed to submit complaint. Please check your inputs.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor: Record<string, "blue" | "yellow" | "green" | "gray"> = {
    UNDER_REVIEW: "blue",
    REFERRED_TO_SPECIALIST: "yellow",
    RESOLVED: "green",
    NEW: "gray",
  }

  const formatSeverity = (sev: string) => {
    if (!sev) return ""
    return sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Complaints & Symptoms
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError(null)
          }}
          className="btn-glow !px-4 !py-2 !text-sm text-white font-semibold"
        >
          {showForm ? "Cancel" : "New Complaint"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-blue-200 p-5 space-y-4 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800">Submit New Complaint</h3>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your symptoms <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what you're experiencing (e.g., persistent headache, fever, fatigue)..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as "Mild" | "Moderate" | "Severe")
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Optional)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3 days, 2 weeks"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setFormError(null)
              }}
              className="btn-underline !px-4 !py-2 !text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-send !px-4 !py-2 !text-sm text-white font-semibold"
            >
              <span>{submitting ? "Submitting..." : "Submit Complaint"}</span>
              <ArrowRight className="w-4 h-4 btn-arrow" />
            </button>
          </div>
        </form>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span>{error}</span>
          </div>
          <button
            onClick={loadComplaints}
            className="text-xs font-semibold text-red-800 underline hover:text-red-950 px-2 py-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 w-2/3">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded-full w-24"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && complaints.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">
            No complaints reported
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You haven't submitted any complaints or symptoms yet. If you are
            unwell or notice symptoms, click "+ New Complaint" above to inform
            your clinical care team.
          </p>
        </div>
      )}

      {/* Complaints List */}
      {!loading && !error && complaints.length > 0 && (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-gray-400">
                    {c.referenceId || c.id}
                  </span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {c.symptoms}
                  </p>
                </div>
                <Badge
                  label={
                    c.status === "NEW"
                      ? "Submitted"
                      : c.status.replace(/_/g, " ")
                  }
                  color={statusColor[c.status] || "gray"}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{formatDate(c.createdAt)}</span>
                <span>·</span>
                <span>
                  Severity:{" "}
                  <strong className="text-gray-700">
                    {formatSeverity(c.severity)}
                  </strong>
                </span>
                {c.duration && (
                  <>
                    <span>·</span>
                    <span>
                      Duration:{" "}
                      <strong className="text-gray-700">{c.duration}</strong>
                    </span>
                  </>
                )}
                <span>·</span>
                <span>
                  Doctor:{" "}
                  <strong className="text-gray-700">
                    {c.assignedDoctor || "Pending triage"}
                  </strong>
                </span>
              </div>
              {c.clinicalNotes && (
                <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-gray-700">
                  <span className="font-semibold text-blue-900">
                    Clinical Review:
                  </span>{" "}
                  {c.clinicalNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecordsPanel() {
  const [records, setRecords] = useState<ClinicalRecordItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [showCorrectionNotice, setShowCorrectionNotice] =
    useState<boolean>(false)

  const categories = [
    { id: "ALL", label: "All Records" },
    { id: "DIAGNOSIS", label: "Diagnosis" },
    { id: "VITAL_SIGNS", label: "Vital Signs" },
    { id: "LAB_RESULT", label: "Lab Results" },
    { id: "TREATMENT_NOTE", label: "Treatment" },
    { id: "REFERRAL", label: "Referrals" },
  ]

  const loadRecords = useCallback(async (cat?: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getClinicalRecords(
        cat && cat !== "ALL" ? cat : undefined,
      )
      setRecords(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load clinical records.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecords(selectedCategory)
  }, [selectedCategory, loadRecords])

  const typeConfig: Record<string, { label: string badgeColor: string }> = {
    DIAGNOSIS: {
      label: "Diagnosis",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    },
    VITAL_SIGNS: {
      label: "Vital Signs",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    },
    LAB_RESULT: {
      label: "Lab Result",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    TREATMENT_NOTE: {
      label: "Treatment Note",
      badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    },
    REFERRAL: {
      label: "Referral",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Clinical Records
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Read-only · Clinically verified</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === c.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadRecords(selectedCategory)}
            className="text-xs font-semibold text-red-800 underline hover:text-red-950 px-2 py-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-3 bg-gray-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">
            {selectedCategory === "ALL"
              ? "No clinical records found"
              : "No records found in this category"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Clinical records are created and signed by authorized healthcare
            professionals during consultations and lab reviews. Verified entries
            will appear here.
          </p>
        </div>
      )}

      {/* Records List */}
      {!loading && !error && records.length > 0 && (
        <div className="space-y-3">
          {records.map((r) => {
            const cfg = typeConfig[r.type] || {
              label: r.type,
              badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
            }
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded border ${cfg.badgeColor}`}
                    >
                      {cfg.label}
                    </span>
                    {r.verified && (
                      <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-400">
                      · {r.recordNumber}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {r.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 text-xs text-gray-500">
                  <p>
                    Recorded by{" "}
                    <strong className="text-gray-700">{r.author}</strong>
                    {r.authorRole ? ` (${r.authorRole})` : ""}
                  </p>
                  {r.attachmentUrl && (
                    <a
                      href={`/api/patient/records/${r.id}/attachment`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span>{r.attachmentName || "View Attachment"}</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Clinical Correction Advisory */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Need a correction?</strong> Clinically verified records can only
        be modified by your healthcare provider. Submit a correction request to
        your primary doctor.
        <button
          onClick={() => setShowCorrectionNotice(!showCorrectionNotice)}
          className="ml-3 text-amber-700 underline text-xs font-semibold hover:text-amber-900"
        >
          {showCorrectionNotice ? "Dismiss" : "Request correction"}
        </button>
        {showCorrectionNotice && (
          <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-900 space-y-1">
            <p>
              In accordance with healthcare governance regulations, clinical
              records are immutable legal documents. To request an amendment or
              correction:
            </p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              <li>
                Navigate to the <strong>Complaints & Symptoms</strong> tab and
                submit a new inquiry specifying the record number.
              </li>
              <li>
                Or discuss the record directly with your provider during your
                next scheduled consultation.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function PrescriptionsPanel() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const loadPrescriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getPrescriptions()
      setPrescriptions(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load prescriptions.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  const handleRecordAdherence = async (
    rxId: string,
    status: "TAKEN" | "SKIPPED",
  ) => {
    setLoggingId(rxId)
    setActionMessage(null)
    try {
      const updated = await api.patient.recordAdherence(rxId, { status })
      setPrescriptions((prev) =>
        prev.map((item) =>
          item.id === rxId || item.prescriptionNumber === rxId ? updated : item,
        ),
      )
      setActionMessage(
        status === "TAKEN"
          ? "Today's dose marked as taken."
          : "Today's dose marked as skipped.",
      )
    } catch (err: any) {
      setError(err?.message || "Failed to record medication adherence.")
    } finally {
      setLoggingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Prescriptions & Medication
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Clinician-prescribed · Patient adherence tracking</span>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-green-600 hover:text-green-800 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span>{error}</span>
          </div>
          <button
            onClick={loadPrescriptions}
            className="text-xs font-semibold text-red-800 underline hover:text-red-950 px-2 py-1 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-100 rounded w-64"></div>
              <div className="h-10 bg-gray-50 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">
            No active prescriptions found
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Clinician-issued prescriptions and dosage instructions will appear
            here following a medical consultation or complaint review.
          </p>
        </div>
      )}

      {!loading && !error && prescriptions.length > 0 && (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const todayAdherence =
              rx.adherence && rx.adherence.length > 0
                ? rx.adherence[rx.adherence.length - 1]
                : null
            const isLoggingThis = loggingId === rx.id

            return (
              <div
                key={rx.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-gray-400">
                      {rx.prescriptionNumber || rx.id}
                    </span>
                    <h4 className="font-semibold text-gray-800 mt-0.5">
                      {rx.medicine}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {rx.dose} · {rx.frequency} · {rx.duration}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Prescribed by {rx.prescriber}
                    </p>
                    {rx.instructions && (
                      <p className="text-xs text-blue-700 bg-blue-50/70 border border-blue-100 rounded-md px-2.5 py-1 mt-2 inline-block">
                        <strong>Instructions:</strong> {rx.instructions}
                      </p>
                    )}
                  </div>
                  <Badge
                    label={rx.status}
                    color={rx.status === "ACTIVE" ? "blue" : "green"}
                  />
                </div>

                {rx.status === "ACTIVE" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">
                        Adherence (last 7 days)
                      </p>
                      <div className="flex items-center gap-2">
                        {todayAdherence === null ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={isLoggingThis}
                              onClick={() =>
                                handleRecordAdherence(rx.id, "TAKEN")
                              }
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 text-green-700" />
                              <span>Taken today</span>
                            </button>
                            <button
                              disabled={isLoggingThis}
                              onClick={() =>
                                handleRecordAdherence(rx.id, "SKIPPED")
                              }
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5 text-gray-600" />
                              <span>Skipped</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className={
                                todayAdherence === true
                                  ? "text-green-700 font-medium inline-flex items-center gap-1"
                                  : "text-red-600 font-medium inline-flex items-center gap-1"
                              }
                            >
                              {todayAdherence === true ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Taken today</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  <span>Skipped</span>
                                </>
                              )}
                            </span>
                            <button
                              disabled={isLoggingThis}
                              onClick={() =>
                                handleRecordAdherence(
                                  rx.id,
                                  todayAdherence === true ? "SKIPPED" : "TAKEN",
                                )
                              }
                              className="text-xs text-blue-600 underline hover:text-blue-800 cursor-pointer disabled:opacity-50"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {rx.adherence.map((taken, i) => {
                        const isToday = i === rx.adherence.length - 1
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (isToday) {
                                handleRecordAdherence(
                                  rx.id,
                                  taken === true ? "SKIPPED" : "TAKEN",
                                )
                              }
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                              taken === true
                                ? "bg-green-100 text-green-700"
                                : taken === false
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-400"
                            } ${
                              isToday
                                ? "cursor-pointer ring-2 ring-blue-400 ring-offset-1"
                                : "cursor-default"
                            }`}
                            title={
                              isToday
                                ? `Today: ${
                                    taken === true
                                      ? "Taken (click to toggle)"
                                      : taken === false
                                        ? "Skipped (click to toggle)"
                                        : "Click to log"
                                  }`
                                : taken === true
                                  ? "Taken"
                                  : taken === false
                                    ? "Skipped"
                                    : "No record"
                            }
                          >
                            {taken === true ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : taken === false ? (
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              "—"
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Clinical Governance Notice */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1">
        <p className="font-semibold">Prescription & Adherence Policy</p>
        <p className="text-blue-800 leading-relaxed">
          Prescriptions are legally binding medical orders signed by licensed
          practitioners and cannot be modified or deleted by patients. You can
          record your daily dose adherence here to help your doctor track the
          effectiveness of your treatment.
        </p>
      </div>
    </div>
  )
}

const VISIT_REASONS = [
  "General consultation",
  "Fever",
  "Headache",
  "Stomach problem",
  "Skin problem",
  "Medication issue",
  "Follow-up",
  "Maternal care",
  "Mental health",
  "Other",
]

function AppointmentsPanel({
  preselectedDoctor,
  initialBookingOpen,
  onResetPreselection,
}: {
  preselectedDoctor?: string | null
  initialBookingOpen?: boolean
  onResetPreselection?: () => void
} = {}) {
  const [aptTab, setAptTab] = useState<"upcoming" | "completed" | "cancelled">(
    "upcoming",
  )
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // Booking & Intake State
  const [booking, setBooking] = useState(false)
  const [bookedApt, setBookedApt] = useState<AppointmentItem | null>(null)
  const [intake, setIntake] = useState(false)
  const [visitReason, setVisitReason] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Kofi Boateng")
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [bookingTime, setBookingTime] = useState("10:00 AM")
  const [submittingBooking, setSubmittingBooking] = useState(false)

  useEffect(() => {
    if (initialBookingOpen) {
      if (preselectedDoctor) {
        setSelectedDoctor(preselectedDoctor)
      }
      setBooking(true)
      onResetPreselection?.()
    }
  }, [initialBookingOpen, preselectedDoctor, onResetPreselection])

  // Intake Form State
  const [intakeSymptoms, setIntakeSymptoms] = useState("")
  const [intakeDuration, setIntakeDuration] = useState("")
  const [intakeSeverity, setIntakeSeverity] = useState("Moderate")
  const [intakeNotes, setIntakeNotes] = useState("")
  const [submittingIntake, setSubmittingIntake] = useState(false)

  // Reschedule Modal State
  const [reschedulingApt, setReschedulingApt] =
    useState<AppointmentItem | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("10:00 AM")
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  // Cancel Modal State
  const [cancellingApt, setCancellingApt] = useState<AppointmentItem | null>(
    null,
  )
  const [cancelReason, setCancelReason] = useState("")
  const [submittingCancel, setSubmittingCancel] = useState(false)

  // Details Modal State
  const [detailsApt, setDetailsApt] = useState<AppointmentItem | null>(null)

  // Telemedicine In-App Session State (Step 9)
  const [activeTeleSession, setActiveTeleSession] =
    useState<TelemedicineSessionItem | null>(null)
  const [startingTeleId, setStartingTeleId] = useState<string | null>(null)
  const [endedTeleSession, setEndedTeleSession] =
    useState<TelemedicineSessionItem | null>(null)
  const [callElapsed, setCallElapsed] = useState<number>(0)
  const [callMuted, setCallMuted] = useState(false)
  const [callCamOff, setCallCamOff] = useState(false)
  const [endingCall, setEndingCall] = useState(false)

  useEffect(() => {
    let timer: any
    if (activeTeleSession) {
      timer = setInterval(() => {
        setCallElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [activeTeleSession])

  const formatCallDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartTelemedicine = async (apt: AppointmentItem) => {
    setStartingTeleId(apt.id)
    setError(null)
    try {
      const session = await api.patient.startTelemedicine(apt.id, {
        deviceType: "Desktop Browser",
        browser:
          typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
      })
      setActiveTeleSession(session)
      setCallElapsed(0)
      setCallMuted(false)
      setCallCamOff(false)
    } catch (err: any) {
      setError(err?.message || "Failed to start telemedicine session.")
    } finally {
      setStartingTeleId(null)
    }
  }

  const handleEndTelemedicine = async () => {
    if (!activeTeleSession) return
    setEndingCall(true)
    setError(null)
    try {
      const ended = await api.patient.endTelemedicine(
        activeTeleSession.sessionId,
        {
          exitReason: "Patient concluded video consultation",
        },
      )
      setActiveTeleSession(null)
      setEndedTeleSession(ended)
      loadAppointments(aptTab)
    } catch (err: any) {
      setError(err?.message || "Failed to end telemedicine session.")
    } finally {
      setEndingCall(false)
    }
  }

  const statusColor = {
    CONFIRMED: "green",
    PENDING_CONFIRMATION: "yellow",
    COMPLETED: "gray",
    CANCELLED: "red",
    NO_SHOW: "red",
  } as const

  const loadAppointments = useCallback(
    async (tab: "upcoming" | "completed" | "cancelled") => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.patient.getAppointments(tab)
        setAppointments(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load appointments.")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadAppointments(aptTab)
  }, [aptTab, loadAppointments])

  const handleStartBooking = async () => {
    if (!visitReason) return
    setSubmittingBooking(true)
    setError(null)
    try {
      let department = "General Practice"
      if (selectedDoctor.includes("Asante") || selectedDoctor.includes("Ade"))
        department = "Cardiology"
      else if (selectedDoctor.includes("Samuel")) department = "Pediatrics"
      else if (selectedDoctor.includes("Mensah")) department = "Dermatology"
      else if (selectedDoctor.includes("Kwame")) department = "Neurology"

      const created = await api.patient.createAppointment({
        doctorName: selectedDoctor,
        department,
        type: "General Consultation",
        reason: visitReason,
        date: bookingDate,
        time: bookingTime,
      })
      setBookedApt(created)
      setBooking(false)
      setIntake(true)
    } catch (err: any) {
      setError(err?.message || "Failed to book appointment.")
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleSubmitIntake = async () => {
    if (!bookedApt) return
    setSubmittingIntake(true)
    setError(null)
    try {
      await api.patient.submitAppointmentIntake(bookedApt.id, {
        symptoms: intakeSymptoms,
        duration: intakeDuration,
        severity: intakeSeverity,
        notes: intakeNotes,
      })
      setIntake(false)
      setBookedApt(null)
      setIntakeSymptoms("")
      setIntakeDuration("")
      setIntakeNotes("")
      setVisitReason("")
      setActionFeedback(
        "Appointment confirmed and clinical intake submitted successfully.",
      )
      setAptTab("upcoming")
      loadAppointments("upcoming")
    } catch (err: any) {
      setError(err?.message || "Failed to submit clinical intake.")
    } finally {
      setSubmittingIntake(false)
    }
  }

  const handleConfirmReschedule = async () => {
    if (!reschedulingApt || !rescheduleDate || !rescheduleTime) return
    setSubmittingReschedule(true)
    setError(null)
    try {
      await api.patient.rescheduleAppointment(reschedulingApt.id, {
        date: rescheduleDate,
        time: rescheduleTime,
        reason: rescheduleReason,
      })
      setReschedulingApt(null)
      setRescheduleReason("")
      setActionFeedback(
        `Appointment ${reschedulingApt.id} rescheduled successfully.`,
      )
      loadAppointments(aptTab)
    } catch (err: any) {
      setError(err?.message || "Failed to reschedule appointment.")
    } finally {
      setSubmittingReschedule(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancellingApt) return
    setSubmittingCancel(true)
    setError(null)
    try {
      await api.patient.cancelAppointment(cancellingApt.id, cancelReason)
      setCancellingApt(null)
      setCancelReason("")
      setActionFeedback(`Appointment ${cancellingApt.id} cancelled.`)
      loadAppointments(aptTab)
    } catch (err: any) {
      setError(err?.message || "Failed to cancel appointment.")
    } finally {
      setSubmittingCancel(false)
    }
  }

  if (intake && bookedApt) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIntake(false)
              setBookedApt(null)
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
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
          </button>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Appointment Intake
          </h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Appointment confirmed with <strong>{bookedApt.doctor}</strong> on{" "}
          <strong>
            {bookedApt.date} ({bookedApt.time})
          </strong>
          . Complete your intake so your provider can review your symptoms
          before the consultation.
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for visit <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Confirmed:{" "}
              <strong className="text-gray-600">{bookedApt.reason}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your symptoms or complaint
            </label>
            <textarea
              rows={3}
              value={intakeSymptoms}
              onChange={(e) => setIntakeSymptoms(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What are you experiencing?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                value={intakeDuration}
                onChange={(e) => setIntakeDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3 days, 2 weeks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={intakeSeverity}
                onChange={(e) => setIntakeSeverity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes
            </label>
            <textarea
              rows={2}
              value={intakeNotes}
              onChange={(e) => setIntakeNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Any other details your provider should know"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIntake(false)
                setBookedApt(null)
              }}
              className="px-5 py-3 rounded-lg border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              Skip Intake for Now
            </button>
            <button
              disabled={submittingIntake}
              onClick={handleSubmitIntake}
              className="flex-1 py-3 rounded-none text-white font-semibold text-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              style={{ background: BLUE }}
            >
              {submittingIntake ? "Submitting..." : "Submit Intake & Finish"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (booking) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBooking(false)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
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
          </button>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Book Appointment
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              What do you need help with?{" "}
              <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VISIT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setVisitReason(r)}
                  className={`px-3 py-2.5 rounded-lg text-sm text-left transition-all border cursor-pointer ${
                    visitReason === r
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select provider
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              <option value="Dr. Kofi Boateng">
                Dr. Kofi Boateng — General Practice (Accra)
              </option>
              <option value="Dr. Efua Asante">
                Dr. Efua Asante — Cardiology (Accra)
              </option>
              <option value="Dr. Ama Bentil">
                Dr. Ama Bentil — General Practice (Accra)
              </option>
              <option value="Dr. Samuel Osei">
                Dr. Samuel Osei — Pediatrics (Accra)
              </option>
              <option value="Dr. Sarah Johnson">
                Dr. Sarah Johnson — General Practice (Accra)
              </option>
              <option value="Dr. Michael Ade">
                Dr. Michael Ade — Cardiology (Lagos)
              </option>
              <option value="Dr. Afia Mensah">
                Dr. Afia Mensah — Dermatology (Kumasi)
              </option>
              <option value="Dr. Kwame Osei">
                Dr. Kwame Osei — Neurology (Accra)
              </option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time Slot
              </label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            Scheduling is recorded directly in your patient health record and
            synchronized with provider clinical schedules.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBooking(false)}
              className="btn-underline px-5 !py-3 !text-sm"
            >
              Cancel
            </button>
            <button
              disabled={!visitReason || submittingBooking}
              onClick={handleStartBooking}
              className="btn-glow flex-1 !py-3 !text-sm text-white font-semibold"
            >
              {submittingBooking
                ? "Booking..."
                : "Confirm & Continue to Intake"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gray-900">
          Appointments
        </h2>
        <button
          onClick={() => setBooking(true)}
          className="btn-rise !px-4 !py-2 !text-sm text-white font-semibold"
        >
          Book Appointment
        </button>
      </div>

      {actionFeedback && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{actionFeedback}</span>
          </span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-green-600 hover:text-green-800 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadAppointments(aptTab)}
            className="text-xs font-semibold text-red-800 underline hover:text-red-950 px-2 py-1 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1">
        {(["upcoming", "completed", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setAptTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${
              aptTab === t ? "text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
            style={aptTab === t ? { background: BLUE } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && !error && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-2">
          <p className="text-sm font-medium text-gray-600">
            No {aptTab} appointments.
          </p>
          <p className="text-xs text-gray-400">
            {aptTab === "upcoming"
              ? "You do not have any upcoming visits scheduled. Use '+ Book Appointment' to schedule a consultation."
              : `Your past ${aptTab} appointments will appear here.`}
          </p>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map((a) => {
            const dateParts = a.date.split(" ")
            const monthText = dateParts[0] || ""
            const dayText = dateParts[1]?.replace(",", "") || ""

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[56px]">
                    <p className="text-xs text-gray-400">{monthText}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dayText}
                    </p>
                    <p className="text-xs text-gray-400">{a.time}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{a.type}</p>
                    <p className="text-sm text-gray-500">{a.doctor}</p>
                    <span className="text-xs font-mono text-gray-400">
                      {a.id}
                    </span>
                  </div>
                  <Badge
                    label={a.status.replace(/_/g, " ")}
                    color={
                      statusColor[(a.status as keyof typeof statusColor)] ||
                      "gray"
                    }
                  />
                </div>

                {aptTab === "upcoming" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    {(a.status === "CONFIRMED" ||
                      a.status === "PENDING_CONFIRMATION") && (
                      <button
                        disabled={startingTeleId === a.id}
                        onClick={() => handleStartTelemedicine(a)}
                        className="btn-ripple !px-3.5 !py-1.5 !text-xs flex items-center gap-1.5 text-white font-semibold"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>
                          {startingTeleId === a.id
                            ? "Connecting..."
                            : "Join Video Consultation"}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setReschedulingApt(a)
                        setRescheduleDate(a.rawDate)
                        setRescheduleTime(a.time)
                      }}
                      className="btn-underline !px-3 !py-1.5 !text-xs"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setCancellingApt(a)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDetailsApt(a)}
                      className="btn-fill-slide !px-3 !py-1.5 !text-xs ml-auto"
                    >
                      View details
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-gray-500">
              Select a new date and time for your consultation with{" "}
              <strong>{reschedulingApt.doctor}</strong> ({reschedulingApt.id}).
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Time Slot
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reason for Rescheduling
                </label>
                <input
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Work commitment, schedule conflict"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setReschedulingApt(null)}
                className="btn-underline !px-4 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button
                disabled={submittingReschedule || !rescheduleDate}
                onClick={handleConfirmReschedule}
                className="btn-glow !px-4 !py-2 !text-xs text-white font-semibold"
              >
                {submittingReschedule ? "Updating..." : "Save Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg">
              Cancel Appointment
            </h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel your appointment with{" "}
              <strong>{cancellingApt.doctor}</strong> on {cancellingApt.date} (
              {cancellingApt.time})?
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you are cancelling..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setCancellingApt(null)}
                className="btn-underline !px-4 !py-2 !text-xs"
              >
                Keep Appointment
              </button>
              <button
                disabled={submittingCancel}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-none text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {submittingCancel ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">
                Appointment Details
              </h3>
              <Badge
                label={detailsApt.status.replace(/_/g, " ")}
                color={
                  statusColor[
                    (detailsApt.status as keyof typeof statusColor)
                  ] || "gray"
                }
              />
            </div>
            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p>
                <strong>Reference:</strong>{" "}
                <span className="font-mono">{detailsApt.id}</span>
              </p>
              <p>
                <strong>Provider:</strong> {detailsApt.doctor}
              </p>
              <p>
                <strong>Type:</strong> {detailsApt.type}
              </p>
              <p>
                <strong>Reason:</strong> {detailsApt.reason}
              </p>
              <p>
                <strong>Scheduled:</strong> {detailsApt.date} at{" "}
                {detailsApt.time}
              </p>
              {detailsApt.symptoms && (
                <p>
                  <strong>Symptoms:</strong> {detailsApt.symptoms}
                </p>
              )}
              {detailsApt.duration && (
                <p>
                  <strong>Duration:</strong> {detailsApt.duration}
                </p>
              )}
              {detailsApt.severity && (
                <p>
                  <strong>Severity:</strong> {detailsApt.severity}
                </p>
              )}
              {detailsApt.notes && (
                <p>
                  <strong>Notes:</strong> {detailsApt.notes}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setDetailsApt(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                style={{ background: BLUE }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Telemedicine Video Consultation Room (Step 9) */}
      {activeTeleSession && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0f1e] text-white">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d1424]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Healthitude · Secure Telemedicine Room
                </p>
                <p className="text-[10px] text-white/50 font-mono">
                  {activeTeleSession.sessionNumber} ·{" "}
                  {activeTeleSession.appointmentNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-white/70">Connected</span>
                <span className="font-mono text-green-400 font-bold ml-1">
                  {formatCallDuration(callElapsed)}
                </span>
              </div>
              <span className="text-xs text-white/40 hidden md:inline">
                256-bit Encrypted
              </span>
            </div>
          </div>

          {/* Main Stage */}
          <div className="flex flex-1 overflow-hidden">
            {/* Remote Clinician Stream */}
            <div className="flex-1 relative flex items-center justify-center bg-[#0d1526]">
              <div className="text-center p-6 max-w-sm">
                <div className="w-28 h-28 mx-auto rounded-full bg-blue-700/80 border-4 border-blue-500/30 flex items-center justify-center text-3xl font-bold text-white shadow-2xl mb-4">
                  {activeTeleSession.doctorName
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className="font-bold text-lg text-white">
                  {activeTeleSession.doctorName}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  {activeTeleSession.department || "Consultant Physician"}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium mt-3 border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  Encrypted Video & Audio Active
                </div>
              </div>

              {/* Patient Self-View PiP */}
              <div className="absolute top-5 right-5 w-36 h-28 rounded-xl border border-white/20 bg-slate-800/90 shadow-2xl flex items-center justify-center overflow-hidden">
                {callCamOff ? (
                  <div className="text-center flex flex-col items-center">
                    <CameraOff className="w-6 h-6 text-white/50 mb-1" />
                    <p className="text-[10px] text-white/50">Camera Off</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white mx-auto">
                      YOU
                    </div>
                    <p className="text-[10px] text-white/70 mt-1 font-medium">
                      {activeTeleSession.patientName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Context */}
            <div className="hidden lg:flex w-80 flex-col border-l border-white/10 bg-[#111827] overflow-y-auto p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Patient Details
                </p>
                <p className="text-sm font-semibold text-white">
                  {activeTeleSession.patientName}
                </p>
                <p className="text-xs text-white/50 font-mono mt-0.5">
                  ID: {activeTeleSession.patientId}
                </p>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Appointment
                </p>
                <p className="text-xs text-white/80">
                  <strong className="text-white">Ref:</strong>{" "}
                  {activeTeleSession.appointmentNumber}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  <strong className="text-white">Doctor:</strong>{" "}
                  {activeTeleSession.doctorName}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  <strong className="text-white">Room:</strong>{" "}
                  {activeTeleSession.roomName}
                </p>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Clinical Notice
                </p>
                <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                  This telemedicine consultation is protected by end-to-end
                  encryption. Clinical notes and prescriptions will be completed
                  and signed by your physician following the call.
                </p>
              </div>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0a0f1e]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCallMuted((m) => !m)}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-xl transition-all cursor-pointer ${
                  callMuted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {callMuted ? (
                  <MicOff className="w-5 h-5 text-red-400" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
                <span className="text-[10px] font-medium">
                  {callMuted ? "Unmute" : "Mute"}
                </span>
              </button>

              <button
                onClick={() => setCallCamOff((c) => !c)}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-xl transition-all cursor-pointer ${
                  callCamOff
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {callCamOff ? (
                  <VideoOff className="w-5 h-5 text-red-400" />
                ) : (
                  <Video className="w-5 h-5 text-white" />
                )}
                <span className="text-[10px] font-medium">
                  {callCamOff ? "Start Cam" : "Stop Cam"}
                </span>
              </button>
            </div>

            <button
              disabled={endingCall}
              onClick={handleEndTelemedicine}
              className="px-6 py-3 rounded-none text-white font-bold text-sm bg-red-600 hover:bg-red-700 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {endingCall ? "Ending Call..." : "End Consultation"}
            </button>
          </div>
        </div>
      )}

      {/* Consultation Concluded Modal (Step 9) */}
      {endedTeleSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                Consultation Concluded
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your video session with{" "}
                <strong>{endedTeleSession.doctorName}</strong> has ended.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Session Number:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {endedTeleSession.sessionNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Appointment:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {endedTeleSession.appointmentNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Duration:</span>
                <span className="font-semibold text-green-700">
                  {endedTeleSession.formattedDuration || "00:00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Session Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                  ENDED
                </span>
              </div>
            </div>

            {/* Clinical Governance Notice */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">
                Clinical Note & Follow-up Governance
              </p>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Doctor clinical notes, official diagnoses, and verified
                prescriptions are authored and digitally signed by your
                healthcare provider. They will appear in your{" "}
                <strong>Medical Records</strong> once finalized. Your
                appointment status remains confirmed.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setEndedTeleSession(null)}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
                style={{ background: BLUE }}
              >
                Return to Appointments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProviderDiscoveryPanel({ onBookProvider }: {
  onBookProvider?: (doctorName: string) => void
} = {}) {
  const [search, setSearch] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [consultType, setConsultType] = useState("")
  const [providers, setProviders] = useState<ProviderItem[]>([])
  const [specialties, setSpecialties] = useState<string[]>([
    "General Practice",
    "Cardiology",
    "Pediatrics",
    "Neurology",
    "Dermatology",
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileProvider, setProfileProvider] = useState<ProviderItem | null>(
    null,
  )

  useEffect(() => {
    let active = true
    const fetchProviders = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.patient.providers.getAll({
          search: search.trim() || undefined,
          specialty: specialty || undefined,
          consultType: consultType || undefined,
        })
        if (active) {
          setProviders(data.providers)
          if (data.specialties && data.specialties.length > 0) {
            setSpecialties(data.specialties)
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load verified providers.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchProviders, search ? 300 : 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search, specialty, consultType])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">
          Find a Provider
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Only verified, active professionals with the appropriate scope appear
          here.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => {
              setSearch("")
              setSpecialty("")
              setConsultType("")
            }}
            className="text-red-800 font-semibold underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, specialty, facility, or location..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={consultType}
            onChange={(e) => setConsultType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All consultation types</option>
            <option value="In-person">In-person</option>
            <option value="Video">Video</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {loading
            ? "Searching providers..."
            : `${providers.length} provider${
                providers.length !== 1 ? "s" : ""
              } found`}
        </p>
        {(search || specialty || consultType) && (
          <button
            onClick={() => {
              setSearch("")
              setSpecialty("")
              setConsultType("")
            }}
            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Provider cards */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">
            Loading verified healthcare providers...
          </p>
        </div>
      ) : providers.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-sm font-medium text-gray-600">
            No verified providers found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search terms or clearing your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <div
              key={p.id || p.name}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{ background: BLUE }}
                >
                  {p.avatar ||
                    p.name
                      .split(" ")
                      .slice(1)
                      .map((n: string) => n[0])
                      .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    {p.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <svg
                          className="w-3 h-3"
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
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 font-medium mt-0.5">
                    {p.specialty}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.qualifications} · {p.experience} experience
                  </p>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                      {p.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                      {p.facility}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                      {p.languages}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                      {p.availability}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                      {p.consultType}
                    </span>
                    <span className="font-medium text-gray-700">
                      Fee: {p.fee}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => onBookProvider?.(p.name)}
                    className="btn-glow !px-4 !py-2 !text-sm text-white font-semibold whitespace-nowrap"
                  >
                    Book
                  </button>
                  <button
                    onClick={() => setProfileProvider(p)}
                    className="btn-fill-slide !px-4 !py-2 !text-sm whitespace-nowrap"
                  >
                    View profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Profile Details Modal */}
      {profileProvider && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: BLUE }}
                >
                  {profileProvider.avatar ||
                    profileProvider.name
                      .split(" ")
                      .slice(1)
                      .map((n) => n[0])
                      .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {profileProvider.name}
                    </h3>
                    {profileProvider.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <svg
                          className="w-3 h-3"
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
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    {profileProvider.specialty}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profileProvider.qualifications}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileProvider(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed border border-gray-100">
              {profileProvider.bio}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Experience
                </span>
                <span>{profileProvider.experience}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Facility
                </span>
                <span>{profileProvider.facility}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Location
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                  {profileProvider.location}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Languages
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                  {profileProvider.languages}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Availability
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{" "}
                  {profileProvider.availability}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Consultation Fee
                </span>
                <span className="font-bold text-gray-900">
                  {profileProvider.fee}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setProfileProvider(null)}
                className="btn-underline flex-1 !py-2.5 !text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const docName = profileProvider.name
                  setProfileProvider(null)
                  onBookProvider?.(docName)
                }}
                className="btn-glow flex-1 !py-2.5 !text-sm text-white font-semibold"
              >
                Book Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyPanel() {
  const [emergencyData, setEmergencyData] =
    useState<PatientEmergencyStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [initiating, setInitiating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [simulatingResponse, setSimulatingResponse] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadEmergency = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getEmergency()
      setEmergencyData(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load emergency status.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmergency()
  }, [loadEmergency])

  const handleInitiateEmergency = async () => {
    setInitiating(true)
    setActionSuccess(null)
    setError(null)
    try {
      await api.patient.initiateEmergency({
        reason:
          "Patient initiated Break-Glass emergency request from patient dashboard",
      })
      await loadEmergency()
      setActionSuccess(
        "Break-Glass emergency initiated! Responding doctors alerted.",
      )
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setError(err?.message || "Failed to initiate emergency request.")
    } finally {
      setInitiating(false)
    }
  }

  const handleConfirmCancel = async () => {
    setCancelling(true)
    setError(null)
    try {
      await api.patient.cancelEmergency({
        reason: cancelReason || "Cancelled by patient",
      })
      setCancelModalOpen(false)
      setCancelReason("")
      await loadEmergency()
      setActionSuccess("Emergency request cancelled successfully.")
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setError(err?.message || "Failed to cancel emergency request.")
    } finally {
      setCancelling(false)
    }
  }

  const handleSimulateDoctorResponse = async () => {
    if (!emergencyData?.activeCase) return
    setSimulatingResponse(true)
    setError(null)
    try {
      await api.patient.respondEmergency(emergencyData.activeCase.caseNumber, {
        responderName: "Dr. Ama Bentil",
        responderId: "doc-ama-bentil-001",
        responderRole: "Verified GP",
        notes: "Accepted on-call emergency dispatch",
      })
      await loadEmergency()
      setActionSuccess(
        "Dr. Ama Bentil (Verified GP) accepted the emergency case.",
      )
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setError(err?.message || "Failed to simulate responder.")
    } finally {
      setSimulatingResponse(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-96"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="h-4 bg-gray-100 rounded w-80 mx-auto"></div>
          <div className="h-12 bg-gray-200 rounded-xl w-48 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error && !emergencyData) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Emergency Break-Glass Access
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Request immediate assistance from a verified qualified doctor. Use
            only for genuine emergencies.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Unable to load emergency services
          </p>
          <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadEmergency}
            className="px-4 py-2 rounded-none text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: BLUE }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const activeCase = emergencyData?.activeCase
  const snapshot = emergencyData?.snapshot
  const history = emergencyData?.history || []
  const auditLogs = emergencyData?.auditLogs || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">
          Emergency Break-Glass Access
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Request immediate assistance from a verified qualified doctor. Use
          only for genuine emergencies.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {!activeCase ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.194-.833-2.964 0L4.27 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
              Initiate Break-Glass Emergency
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              A verified qualified doctor will be alerted immediately. In
              accordance with your signed Break-Glass consent, your controlled
              emergency health snapshot will be shared with the responding
              doctor automatically.
            </p>
          </div>

          {snapshot && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left max-w-lg mx-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Emergency Snapshot Preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <span>
                  <strong>Blood group:</strong> {snapshot.bloodGroup}
                </span>
                <span>
                  <strong>Allergies:</strong> {snapshot.allergies}
                </span>
                <span>
                  <strong>Last BP:</strong> {snapshot.lastBP}
                </span>
                <span>
                  <strong>Active Meds:</strong> {snapshot.activeMedsCount}
                </span>
                <span className="col-span-2 text-gray-500 mt-1">
                  <strong>Contact:</strong>{" "}
                  {snapshot.emergencyContact
                    ? `${snapshot.emergencyContact.fullName} (${snapshot.emergencyContact.relationship})`
                    : "None on file"}
                </span>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleInitiateEmergency}
              disabled={initiating}
              className="px-8 py-3.5 rounded-none text-white font-bold text-sm bg-red-600 hover:bg-red-700 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {initiating
                ? "Alerting Emergency Responders..."
                : "Request Emergency Help"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-300 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-semibold text-red-800 text-base">
                EMERGENCY ACTIVE — Case #{activeCase.caseNumber}
              </span>
            </div>
            <span className="text-xs text-red-600 font-mono">
              Initiated: {new Date(activeCase.createdAt).toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm text-red-700 leading-relaxed">
            {activeCase.status === "ACTIVE"
              ? "Verified qualified doctors have been alerted. Awaiting a valid responder to accept your emergency case."
              : `Your case has been accepted by ${activeCase.responderName}. Clinical emergency assessment in progress.`}
          </p>

          {/* Controlled Emergency Snapshot */}
          {snapshot && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  Emergency Snapshot shared with responder:
                </p>
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {snapshot.clinicallyVerified
                    ? "Clinically Verified"
                    : "Patient-Reported"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                <div>
                  <strong>Blood group:</strong> {snapshot.bloodGroup}
                </div>
                <div>
                  <strong>Allergies:</strong> {snapshot.allergies}
                </div>
                <div>
                  <strong>Last Vital Signs:</strong> {snapshot.lastBP}
                </div>
                <div>
                  <strong>Active Meds:</strong> {snapshot.activeMedsCount} (
                  {snapshot.activeMedsSummary})
                </div>
                <div className="sm:col-span-2 text-gray-600 mt-1 pt-1 border-t border-gray-100">
                  <strong>Emergency Contact:</strong>{" "}
                  {snapshot.emergencyContact
                    ? `${snapshot.emergencyContact.fullName} (${snapshot.emergencyContact.relationship}) · ${snapshot.emergencyContact.phoneNumber}`
                    : "None on file"}
                </div>
              </div>
            </div>
          )}

          {/* Responder Display */}
          {activeCase.status === "RESPONDED" && activeCase.responderName ? (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-red-200">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {activeCase.responderName
                  .split(" ")
                  .slice(1)
                  .map((n) => n[0])
                  .join("") || "DR"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {activeCase.responderName} is responding
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {activeCase.responderRole || "Verified GP"} · Accepted{" "}
                  {activeCase.respondedAt
                    ? new Date(activeCase.respondedAt).toLocaleTimeString()
                    : "recently"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-red-200">
              <span className="text-xs text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Awaiting clinician acceptance...
              </span>
              <button
                onClick={handleSimulateDoctorResponse}
                disabled={simulatingResponse}
                className="px-3 py-1 rounded-none text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {simulatingResponse
                  ? "Connecting..."
                  : "Accept as Dr. Ama Bentil"}
              </button>
            </div>
          )}

          <button
            onClick={() => setCancelModalOpen(true)}
            className="w-full py-2.5 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer"
          >
            Cancel Emergency Request
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg">
              Cancel Emergency Request
            </h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel your active emergency case?
              Responding doctors will be notified of the cancellation.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cancellation reason (optional)
              </label>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Symptoms improved, accidental trigger"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-none text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Access History */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">
            Emergency Access History &amp; Audit Trail
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable legal medical record of all Break-Glass emergency
            requests, responder assignments, and clinical accesses.
          </p>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 py-3">
            No previous emergency access events.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-start justify-between flex-wrap gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">
                      {h.caseNumber}
                    </span>
                    <Badge
                      label={h.status}
                      color={
                        h.status === "ACTIVE"
                          ? "red"
                          : h.status === "RESPONDED"
                            ? "blue"
                            : h.status === "RESOLVED"
                              ? "green"
                              : "gray"
                      }
                    />
                  </div>
                  <p className="text-gray-600">
                    {h.reason || "Patient emergency request"}
                  </p>
                  <p className="text-gray-400">
                    Initiated: {new Date(h.createdAt).toLocaleDateString()} at{" "}
                    {new Date(h.createdAt).toLocaleTimeString()}
                    {h.responderName && ` · Responder: ${h.responderName}`}
                    {h.cancelledAt &&
                      ` · Cancelled: ${new Date(h.cancelledAt).toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Trail Events */}
        {auditLogs.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Break-Glass Audit Events
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-white rounded border border-gray-100 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400">
                      by {log.actor} ({log.actorRole})
                    </span>
                    <span className="text-gray-400">· {log.target}</span>
                  </div>
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
          <strong>Legal Compliance:</strong> Break-Glass emergency records and
          responder access logs are permanently recorded in PostgreSQL and
          cannot be deleted.
        </div>
      </div>
    </div>
  )
}

function PricingPanel() {
  const [pricingData, setPricingData] = useState<PatientPricingResponse | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Category Change Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [nhisIdInput, setNhisIdInput] = useState<string>("")
  const [submittingChange, setSubmittingChange] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null)

  const fetchPricing = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.patient.getPricing()
      setPricingData(data)
      if (!selectedCategory && data.category) {
        setSelectedCategory(data.category.code)
        if (data.category.nhisId) {
          setNhisIdInput(data.category.nhisId)
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load pricing and coverage details.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  const handleOpenModal = () => {
    if (pricingData?.category) {
      setSelectedCategory(pricingData.category.code)
      setNhisIdInput(pricingData.category.nhisId || "")
    }
    setChangeError(null)
    setChangeSuccess(null)
    setIsModalOpen(true)
  }

  const handleSubmitCategoryChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    if (selectedCategory === "NHIS" && !nhisIdInput.trim()) {
      setChangeError(
        "NHIS identification number is required for the NHIS User category.",
      )
      return
    }

    setSubmittingChange(true)
    setChangeError(null)
    setChangeSuccess(null)

    try {
      const updated = await api.patient.updateCategory({
        category: selectedCategory,
        nhisId: selectedCategory === "NHIS" ? nhisIdInput.trim() : undefined,
      })
      setPricingData(updated)
      setChangeSuccess(
        "Category update request submitted. Status is now PENDING review.",
      )
      setTimeout(() => {
        setIsModalOpen(false)
        setChangeSuccess(null)
      }, 1500)
    } catch (err: any) {
      setChangeError(
        err?.message || "Failed to submit category update request.",
      )
    } finally {
      setSubmittingChange(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-80"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-7 bg-gray-200 rounded w-40"></div>
              <div className="h-3 bg-gray-100 rounded w-64"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-gray-50 rounded-lg"></div>
            <div className="h-16 bg-gray-50 rounded-lg"></div>
            <div className="h-16 bg-gray-50 rounded-lg"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-50 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !pricingData) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Pricing & Coverage
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your single active billing category determines the pricing applied
            to all Healthitude services.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Unable to load pricing information
          </p>
          <p className="text-xs text-red-600 max-w-md mx-auto">
            {error ||
              "Please check your network connection and verify backend connectivity."}
          </p>
          <button
            onClick={fetchPricing}
            className="px-4 py-2 rounded-none text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: BLUE }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  const { category, plan, allCategories } = pricingData

  const getPartnerColHeader = (code: string) => {
    switch (code) {
      case "NHIS":
        return "NHIS Covers"
      case "INSURANCE":
        return "Insurance Covers"
      case "STUDENT":
        return "Student Subsidy"
      case "NURSING_MOTHER":
        return "Maternal Subsidy"
      case "ELDERLY":
        return "Elderly Subsidy"
      case "CIVIL_SERVANT":
        return "Govt Subsidy"
      case "CORPORATE":
        return "Corporate Covers"
      default:
        return "Partner Coverage"
    }
  }

  const statusBadgeColor: "green" | "yellow" | "red" =
    category.verificationStatus === "VERIFIED"
      ? "green"
      : category.verificationStatus === "PENDING"
        ? "yellow"
        : "red"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">
          Pricing & Coverage
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your single active billing category determines the pricing applied to
          all Healthitude services.
        </p>
      </div>

      {/* Category card */}
      <div className="bg-white rounded-xl border border-blue-200 p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
              Active Pricing Category
            </p>
            <h3 className="font-display text-2xl font-bold text-gray-900">
              {category.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{category.evidence}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              label={category.verificationStatus}
              color={statusBadgeColor}
            />
            <button
              onClick={handleOpenModal}
              className="btn-fill-slide !px-3 !py-1.5 !text-xs font-medium"
            >
              Request Category Change
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Hierarchy Precedence</p>
            <p className="font-medium text-gray-800 mt-0.5">
              Rank #{category.rank} of {allCategories.length}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">NHIS / Supporting ID</p>
            <p className="font-medium text-gray-800 mt-0.5">
              {category.nhisId || "None Required / Standard"}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Category code</p>
            <p className="font-mono font-medium text-gray-800 mt-0.5">
              {category.code}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>Single Primary Category Invariant:</strong> You have exactly
          one active primary billing category recorded in PostgreSQL. Category
          change requests require administrative review before verified copay
          rates are applied.
        </div>
      </div>

      {/* Separation note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
            Pricing Category
          </p>
          <p className="font-semibold text-blue-900">{category.name}</p>
          <p className="text-xs text-blue-600 mt-1">
            Determines your financial copay &amp; partner subsidies
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Clinical Priority
          </p>
          <p className="font-semibold text-gray-700">ROUTINE</p>
          <p className="text-xs text-gray-400 mt-1">
            Set by your doctor based strictly on medical need (independent of
            billing status)
          </p>
        </div>
      </div>

      {/* Pricing plan table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-800">{plan.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Effective from {plan.effectiveFrom} ({plan.currency})
            </p>
          </div>
          <span className="text-xs text-gray-400">
            Prices set by Healthitude · Phase 1 Canonical Rates
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  "Service",
                  "Standard Rate",
                  "Your Responsibility",
                  getPartnerColHeader(category.code),
                  "Healthitude Fee",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plan.services.map((row) => (
                <tr
                  key={row.service}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.service}
                  </td>
                  <td className="px-4 py-3 text-gray-500 line-through">
                    {row.standard}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-700">
                    {row.patient}
                  </td>
                  <td className="px-4 py-3 text-green-700">{row.partner}</td>
                  <td className="px-4 py-3 text-gray-500">{row.healthitude}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Standard Rate strictly equals the mathematical sum of Your
          Responsibility, Partner Coverage, and Healthitude Fee. Prices are set
          by Healthitude clinical administration.
        </div>
      </div>

      {/* Request Category Change Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg">
              Request Billing Category Change
            </h3>
            <p className="text-xs text-gray-500">
              Select your eligible billing category. In accordance with clinical
              governance rules, category changes reset verification status to{" "}
              <strong>PENDING</strong> until reviewed by administration.
            </p>

            {changeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {changeError}
              </div>
            )}

            {changeSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
                {changeSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitCategoryChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {allCategories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}{" "}
                      {c.requiresEvidence
                        ? "(Requires ID / Evidence)"
                        : "(Standard)"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory === "NHIS" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    NHIS Identification Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nhisIdInput}
                    onChange={(e) => setNhisIdInput(e.target.value)}
                    placeholder="e.g. NHIS-2026-9901"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Official NHIS membership card number required for
                    verification.
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-800">
                <strong>Governance Rule:</strong> Category deletion is strictly
                blocked. Every patient maintains exactly one primary active
                category.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingChange}
                  className="btn-underline !px-4 !py-2 !text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChange}
                  className="btn-send !px-4 !py-2 !text-xs text-white font-semibold disabled:opacity-50"
                >
                  <span>{submittingChange ? "Submitting..." : "Submit Request"}</span>
                  <ArrowRight className="w-3.5 h-3.5 btn-arrow" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AIAssistantPanel() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am the Healthitude AI Health Assistant. I can help you find general health information, understand medical terms, or navigate the platform. I cannot diagnose conditions, prescribe medication, or override your doctor's advice.",
    },
  ])
  const [input, setInput] = useState("")

  const suggestions = [
    "What does hypertension mean?",
    "How should I take my Ibuprofen?",
    "When should I see a doctor for a headache?",
    "What is a referral?",
  ]

  const send = () => {
    if (!input.trim()) return
    setMessages((m) => [
      ...m,
      { role: "user", text: input },
      {
        role: "assistant",
        text: "Thank you for your question. For accurate medical advice specific to your condition, please consult with your assigned primary doctor through the Complaints section. I can provide general health information — please note this is educational only and not a diagnosis or prescription.",
      },
    ])
    setInput("")
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">
          AI Health Assistant
        </h2>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>
            Educational information only. Not a diagnosis, prescription, or
            substitute for professional medical care.
          </span>
        </p>
      </div>

      <div
        className="bg-white rounded-xl border border-gray-100 flex flex-col"
        style={{ minHeight: "360px" }}
      >
        <div
          className="flex-1 p-4 space-y-3 overflow-y-auto"
          style={{ maxHeight: "320px" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "text-white" : "bg-gray-100 text-gray-700"
                }`}
                style={m.role === "user" ? { background: BLUE } : {}}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask a health question..."
          />
          <button
            onClick={send}
            className="btn-send !px-4 !py-2 !text-sm text-white font-semibold"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5 btn-arrow" />
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Suggested questions
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs px-3 py-1.5 border border-blue-200 rounded-full text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const [view, setView] = useState<PatientView>("overview")
  const [preselectedDoctor, setPreselectedDoctor] = useState<string | null>(
    null,
  )
  const [openBookingOnApt, setOpenBookingOnApt] = useState(false)

  const navItems: { id: PatientView label: string icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "complaints",
      label: "Complaints",
      icon: <Activity className="w-4 h-4" />,
    },
    { id: "records", label: "Records", icon: <FileText className="w-4 h-4" /> },
    {
      id: "prescriptions",
      label: "Medications",
      icon: <Pill className="w-4 h-4" />,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "telemedicine",
      label: "Telemedicine",
      icon: <Video className="w-4 h-4" />,
    },
    {
      id: "providers",
      label: "Find a Provider",
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: "pricing",
      label: "Pricing & Coverage",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ]

  return (
    <div>
      {/* Sub-nav */}
      <div className="w-full flex justify-center mb-6">
        <div className="w-full lg:w-[92%] max-w-6xl flex items-center justify-start sm:justify-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-xs overflow-x-auto">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                view === n.id
                  ? n.id === "emergency"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-white shadow-xs"
                  : n.id === "emergency"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              style={
                view === n.id && n.id !== "emergency"
                  ? { background: BLUE }
                  : {}
              }
            >
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {view === "overview" && <OverviewPanel />}
      {view === "complaints" && <ComplaintsPanel />}
      {view === "records" && <RecordsPanel />}
      {view === "prescriptions" && <PrescriptionsPanel />}
      {view === "appointments" && (
        <AppointmentsPanel
          preselectedDoctor={preselectedDoctor}
          initialBookingOpen={openBookingOnApt}
          onResetPreselection={() => {
            setPreselectedDoctor(null)
            setOpenBookingOnApt(false)
          }}
        />
      )}
      {view === "telemedicine" && <TelemedicineFlow />}
      {view === "providers" && (
        <ProviderDiscoveryPanel
          onBookProvider={(docName) => {
            setPreselectedDoctor(docName)
            setOpenBookingOnApt(true)
            setView("appointments")
          }}
        />
      )}
      {view === "pricing" && <PricingPanel />}
      {view === "emergency" && <EmergencyPanel />}
    </div>
  )
}
