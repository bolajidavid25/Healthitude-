import { useState, useEffect, useCallback } from "react"
import {
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  Plus,
  RefreshCw,
} from "lucide-react"
import { api, type ProfessionalItem } from "@/utils/api"

const BLUE = "#1a3fcf"

type AdminView = "users" | "verification" | "pricing" | "audit"

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

const professionals = [
  {
    name: "Dr. Yaw Mensah",
    profession: "Doctor",
    specialty: "Cardiology",
    licence: "GMA-2019-07341",
    status: "UNDER_REVIEW",
    submitted: "Sep 10, 2026",
  },
  {
    name: "Nurse Esi Darko",
    profession: "Nurse",
    specialty: "Perioperative",
    licence: "GNC-2022-01892",
    status: "PENDING",
    submitted: "Sep 13, 2026",
  },
  {
    name: "Pharm. Kwame Adu",
    profession: "Pharmacist",
    specialty: "Clinical Pharmacy",
    licence: "PC-2020-05510",
    status: "PENDING",
    submitted: "Sep 14, 2026",
  },
]

const auditEvents = [
  {
    time: "Sep 14, 2026 · 09:42",
    actor: "Dr. K. Boateng",
    action: "CLINICAL_RECORD_WRITE",
    target: "Patient: Ama Mensah",
    severity: "normal",
  },
  {
    time: "Sep 14, 2026 · 08:15",
    actor: "Ama Mensah",
    action: "BREAK_GLASS_INITIATED",
    target: "Emergency Case #EMG-2026-0041",
    severity: "high",
  },
  {
    time: "Sep 13, 2026 · 16:30",
    actor: "Admin",
    action: "PROFESSIONAL_VERIFIED",
    target: "Dr. Efua Asante",
    severity: "normal",
  },
  {
    time: "Sep 13, 2026 · 14:00",
    actor: "Dr. K. Boateng",
    action: "PRESCRIPTION_ISSUED",
    target: "Patient: Kweku Osei · RX-2026-0840",
    severity: "normal",
  },
  {
    time: "Sep 12, 2026 · 11:20",
    actor: "System",
    action: "CREDENTIAL_EXPIRY_WARNING",
    target: "Dr. K. Boateng · Licence expires Dec 31",
    severity: "warn",
  },
]

// Ordered highest → lowest precedence (as per final spec)
const categories = [
  {
    rank: 1,
    code: "NURSING_MOTHER",
    name: "Nursing / Breastfeeding Mother",
    patients: 230,
    verifiedRate: 92,
    requiresEvidence: true,
  },
  {
    rank: 2,
    code: "ELDERLY",
    name: "Elderly",
    patients: 720,
    verifiedRate: 88,
    requiresEvidence: true,
  },
  {
    rank: 3,
    code: "STUDENT",
    name: "Student",
    patients: 2340,
    verifiedRate: 87,
    requiresEvidence: true,
  },
  {
    rank: 4,
    code: "CIVIL_SERVANT",
    name: "Civil Servant",
    patients: 1850,
    verifiedRate: 91,
    requiresEvidence: true,
  },
  {
    rank: 5,
    code: "CORPORATE",
    name: "Corporate / Company Member",
    patients: 890,
    verifiedRate: 98,
    requiresEvidence: true,
  },
  {
    rank: 6,
    code: "NHIS",
    name: "NHIS User",
    patients: 4210,
    verifiedRate: 94,
    requiresEvidence: true,
  },
  {
    rank: 7,
    code: "INSURANCE",
    name: "Insurance Member",
    patients: 340,
    verifiedRate: 96,
    requiresEvidence: true,
  },
  {
    rank: 8,
    code: "GENERAL",
    name: "General Patient",
    patients: 8920,
    verifiedRate: 100,
    requiresEvidence: false,
  },
]

const pricingPlans: Record<string, {
  service: string
  standard: string
  patient: string
  partner: string
  healthitude: string
}[]> = {
  NURSING_MOTHER: [
    {
      service: "General Consultation",
      standard: "₦10,000",
      patient: "₦1,500",
      partner: "₦7,000",
      healthitude: "₦1,500",
    },
    {
      service: "Specialist Consultation",
      standard: "₦15,000",
      patient: "₦2,000",
      partner: "₦10,500",
      healthitude: "₦2,500",
    },
    {
      service: "Follow-up Visit",
      standard: "₦7,000",
      patient: "₦500",
      partner: "₦5,300",
      healthitude: "₦1,200",
    },
  ],
  NHIS: [
    {
      service: "General Consultation",
      standard: "₦10,000",
      patient: "₦2,000",
      partner: "₦6,500",
      healthitude: "₦1,500",
    },
    {
      service: "Specialist Consultation",
      standard: "₦15,000",
      patient: "₦3,000",
      partner: "₦9,500",
      healthitude: "₦2,500",
    },
    {
      service: "Follow-up Visit",
      standard: "₦7,000",
      patient: "₦1,000",
      partner: "₦4,800",
      healthitude: "₦1,200",
    },
  ],
  STUDENT: [
    {
      service: "General Consultation",
      standard: "₦10,000",
      patient: "₦3,000",
      partner: "₦5,500",
      healthitude: "₦1,500",
    },
    {
      service: "Specialist Consultation",
      standard: "₦15,000",
      patient: "₦5,000",
      partner: "₦7,500",
      healthitude: "₦2,500",
    },
    {
      service: "Follow-up Visit",
      standard: "₦7,000",
      patient: "₦2,000",
      partner: "₦3,800",
      healthitude: "₦1,200",
    },
  ],
  GENERAL: [
    {
      service: "General Consultation",
      standard: "₦10,000",
      patient: "₦10,000",
      partner: "₦0",
      healthitude: "₦0",
    },
    {
      service: "Specialist Consultation",
      standard: "₦15,000",
      patient: "₦15,000",
      partner: "₦0",
      healthitude: "₦0",
    },
    {
      service: "Follow-up Visit",
      standard: "₦7,000",
      patient: "₦7,000",
      partner: "₦0",
      healthitude: "₦0",
    },
  ],
}

function PricingAdmin() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [editingPrecedence, setEditingPrecedence] = useState(false)

  const plan = pricingPlans[selectedCategory.code] || pricingPlans["GENERAL"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-gray-900">
            Patient Categories & Pricing Plans
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Every patient has exactly one active billing category. Prices are
            configured here — not stored on the patient record.
          </p>
        </div>
        <button
          className="btn-fill-slide !px-4 !py-2 !text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Price</span>
        </button>
      </div>

      {/* Precedence order */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-800">
              Category Precedence Order
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              When a patient qualifies for multiple categories, Healthitude
              assigns the highest-ranked one. This order is configurable.
            </p>
          </div>
          <button
            onClick={() => setEditingPrecedence(!editingPrecedence)}
            className="btn-underline !text-xs !px-3 !py-1.5"
          >
            {editingPrecedence ? "Save Order" : "Edit Order"}
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.code}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedCategory.code === c.code
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-100 hover:border-blue-200"
              }`}
              onClick={() => setSelectedCategory(c)}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background:
                    c.rank === 1 ? "#dc2626" : c.rank <= 3 ? "#d97706" : BLUE,
                }}
              >
                {c.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {c.code}
                  {c.requiresEvidence ? " · Evidence required" : " · Default"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {c.patients.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">patients</p>
              </div>
              <div className="w-24">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Verified</span>
                  <span className="font-medium text-gray-700">
                    {c.verifiedRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.verifiedRate}%`, background: BLUE }}
                  />
                </div>
              </div>
              {editingPrecedence && (
                <div className="flex flex-col gap-0.5 ml-2">
                  <button className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 cursor-pointer">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <ArrowUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>
            Higher rank = assigned first when patient qualifies for multiple
            categories
          </span>
        </p>
      </div>

      {/* Pricing plan for selected category */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">
              {selectedCategory.name} — Pricing Plan
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Effective Jan 1, 2026 · Prices are not stored on the patient
              record
            </p>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-none border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Edit Plan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  "Service",
                  "Standard Rate",
                  "Patient Pays",
                  "Partner / Programme",
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
              {plan.map((row) => (
                <tr
                  key={row.service}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.service}
                  </td>
                  <td className="px-4 py-3 text-gray-400 line-through">
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
          Patient responsibility + Partner/programme coverage + Healthitude fee
          = Standard rate. Exact splits are business decisions configured here
          by admin.
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Architecture note:</strong> Patient records store only the
        category code (e.g.{" "}
        <code className="font-mono bg-blue-100 px-1 rounded">NHIS</code>).
        Prices are resolved at service time by looking up the active Pricing
        Plan for that category — never hard-coded on the patient.
      </div>
    </div>
  )
}

function statusBadgeColor(
  status: string,
): "green" | "blue" | "yellow" | "red" | "gray" {
  if (status === "VERIFIED") return "green"
  if (status === "VERIFIED_WITH_RESTRICTIONS") return "blue"
  if (status === "UNDER_REVIEW" || status === "PENDING") return "yellow"
  if (status === "REJECTED" || status === "SUSPENDED" || status === "REVOKED")
    return "red"
  return "gray"
}

export default function AdminPanel() {
  const [view, setView] = useState<AdminView>("verification")
  const [profList, setProfList] = useState<ProfessionalItem[]>([])
  const [auditList, setAuditList] = useState<any[]>([])
  const [selectedProId, setSelectedProId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  )
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState("")
  const [restrictions, setRestrictions] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userSearch, setUserSearch] = useState("")

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profsRes, auditRes] = await Promise.all([
        api.admin.getProfessionals(),
        api.admin.getAuditLogs({ limit: 50 }),
      ])
      const loadedProfs = profsRes?.data?.professionals || []
      const loadedLogs =
        auditRes?.data?.logs || (auditRes?.data as any)?.auditLogs || []
      setProfList(loadedProfs)
      setAuditList(loadedLogs)
      if (!selectedProId && loadedProfs.length > 0) {
        const firstPending = loadedProfs.find(
          (p) =>
            p.verificationStatus === "PENDING" ||
            p.verificationStatus === "UNDER_REVIEW",
        )
        setSelectedProId((firstPending || loadedProfs[0]).id)
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load administrator data. Please ensure you are signed in as an administrator.",
      )
    } finally {
      setLoading(false)
    }
  }, [selectedProId])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const selectedPro =
    profList.find((p) => p.id === selectedProId) || profList[0] || null

  const handleReviewAction = async (
    action: "VERIFY" | "VERIFY_WITH_RESTRICTIONS" | "REJECT" | "SUSPEND" | "REINSTATE",
  ) => {
    if (!selectedPro) return
    setActionMsg(null)

    if (
      (action === "REJECT" || action === "SUSPEND") &&
      reason.trim().length < 3
    ) {
      setActionMsg({
        ok: false,
        text: "Please enter a justification reason in the reason field before rejecting or suspending.",
      })
      return
    }

    if (action === "VERIFY_WITH_RESTRICTIONS" && restrictions.trim().length < 3) {
      setActionMsg({
        ok: false,
        text: "Please specify the practice restrictions before approving with restrictions.",
      })
      return
    }

    setSubmitting(true)
    try {
      // State machine requires PENDING -> UNDER_REVIEW before VERIFY / VERIFY_WITH_RESTRICTIONS
      if (
        selectedPro.verificationStatus === "PENDING" &&
        (action === "VERIFY" || action === "VERIFY_WITH_RESTRICTIONS")
      ) {
        await api.admin.reviewProfessional(selectedPro.id, {
          action: "START_REVIEW",
          notes: notes.trim() || "Started administrator credential review.",
        })
      }

      const res = await api.admin.reviewProfessional(selectedPro.id, {
        action,
        reason: reason.trim() || undefined,
        restrictions: restrictions.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setActionMsg({
        ok: true,
        text:
          res.message ||
          `Updated Dr. ${selectedPro.firstName} ${selectedPro.lastName} successfully.`,
      })
      setNotes("")
      setReason("")
      setRestrictions("")
      await loadAdminData()
    } catch (err: any) {
      setActionMsg({
        ok: false,
        text: err?.message || "Failed to submit verification decision.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = profList.filter(
    (p) =>
      p.verificationStatus === "PENDING" ||
      p.verificationStatus === "UNDER_REVIEW",
  ).length
  const verifiedCount = profList.filter(
    (p) =>
      p.verificationStatus === "VERIFIED" ||
      p.verificationStatus === "VERIFIED_WITH_RESTRICTIONS",
  ).length

  const filteredProfs = profList.filter((p) => {
    if (!userSearch.trim()) return true
    const q = userSearch.toLowerCase()
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.specialty || "").toLowerCase().includes(q) ||
      p.licenceNumber.toLowerCase().includes(q)
    )
  })

  const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    {
      id: "verification",
      label: `Verification Review${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "users",
      label: "Professionals Directory",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "pricing",
      label: "Pricing & Categories",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "audit",
      label: `Audit Log (${auditList.length})`,
      icon: <FileText className="w-4 h-4" />,
    },
  ]

  return (
    <div>
      {error && (
        <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadAdminData}
            className="text-xs font-semibold text-red-700 underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Professionals",
            value: loading ? "…" : String(profList.length),
            icon: <Users className="w-4 h-4 text-blue-600" />,
          },
          {
            label: "Pending Verifications",
            value: loading ? "…" : String(pendingCount),
            icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
            warn: pendingCount > 0,
          },
          {
            label: "Verified Professionals",
            value: loading ? "…" : String(verifiedCount),
            icon: <Users className="w-4 h-4 text-blue-600" />,
          },
          {
            label: "Audit Log Entries",
            value: loading ? "…" : String(auditList.length),
            icon: <FileText className="w-4 h-4 text-amber-600" />,
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
                  s.warn ? "bg-amber-50" : "bg-blue-50"
                }`}
              >
                {s.icon}
              </div>
            </div>
            <p
              className={`text-2xl font-bold ${
                s.warn ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

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

      {view === "users" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-800">
              Registered Healthcare Professionals ({filteredProfs.length})
            </h3>
            <div className="flex items-center gap-2">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                placeholder="Search name, email, licence..."
              />
              <button
                onClick={loadAdminData}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {[
                    "Name",
                    "Specialty",
                    "Licence",
                    "Verification",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProfs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No professionals found.
                    </td>
                  </tr>
                ) : (
                  filteredProfs.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          Dr. {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {u.specialty || "General Practice"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {u.licenceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={u.verificationStatus.replace(/_/g, " ")}
                          color={statusBadgeColor(u.verificationStatus)}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedProId(u.id)
                            setView("verification")
                          }}
                          className="text-blue-600 hover:underline text-xs font-medium cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "verification" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-gray-900">
                Verification Queue ({profList.length})
              </h3>
              <button
                onClick={loadAdminData}
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {profList.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                No professionals registered yet.
              </div>
            ) : (
              profList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProId(p.id)
                    setActionMsg(null)
                  }}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-blue-300 ${
                    selectedPro?.id === p.id
                      ? "border-blue-400 shadow-sm"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        Dr. {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.category} · {p.specialty || "General Practice"} ·{" "}
                        {p.facility || "—"}
                      </p>
                      <p className="text-xs font-mono text-gray-400 mt-1">
                        {p.licenceNumber}
                      </p>
                    </div>
                    <Badge
                      label={p.verificationStatus.replace(/_/g, " ")}
                      color={statusBadgeColor(p.verificationStatus)}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Registered {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {selectedPro ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900">
                    Review: Dr. {selectedPro.firstName} {selectedPro.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedPro.email}</p>
                </div>
                <Badge
                  label={selectedPro.verificationStatus.replace(/_/g, " ")}
                  color={statusBadgeColor(selectedPro.verificationStatus)}
                />
              </div>

              {actionMsg && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    actionMsg.ok
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {actionMsg.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Category", value: selectedPro.category },
                  {
                    label: "Specialty",
                    value: selectedPro.specialty || "General Practice",
                  },
                  { label: "Licence", value: selectedPro.licenceNumber },
                  {
                    label: "Regulatory Body",
                    value: selectedPro.regulatoryBody || "—",
                  },
                  { label: "Facility", value: selectedPro.facility || "—" },
                  {
                    label: "Licence Expiry",
                    value: selectedPro.licenceExpiry
                      ? new Date(selectedPro.licenceExpiry).toLocaleDateString()
                      : "—",
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-medium text-gray-800 mt-0.5 text-xs">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewer notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this verification decision..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Restrictions (only for Restrict)
                  </label>
                  <input
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    placeholder="e.g. Telemedicine only"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Reason (required for Reject / Suspend)
                  </label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    placeholder="e.g. Unverifiable licence number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={submitting}
                  onClick={() => handleReviewAction("VERIFY")}
                  className="py-2.5 rounded-none text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Verify"}
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleReviewAction("VERIFY_WITH_RESTRICTIONS")}
                  className="py-2.5 rounded-none text-white text-sm font-medium bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Restrict
                </button>
                <button
                  disabled={submitting}
                  onClick={() =>
                    handleReviewAction(
                      selectedPro.verificationStatus === "VERIFIED" ||
                        selectedPro.verificationStatus ===
                          "VERIFIED_WITH_RESTRICTIONS"
                        ? "SUSPEND"
                        : "REJECT",
                    )
                  }
                  className="py-2.5 rounded-none text-white text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {selectedPro.verificationStatus === "VERIFIED" ||
                  selectedPro.verificationStatus ===
                    "VERIFIED_WITH_RESTRICTIONS"
                    ? "Suspend"
                    : "Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm p-6">
              Select a professional to review
            </div>
          )}
        </div>
      )}

      {view === "pricing" && <PricingAdmin />}

      {view === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-gray-900">
              Audit & Security Log ({auditList.length})
            </h3>
            <button
              onClick={loadAdminData}
              className="btn-rise !px-4 !py-2 !text-sm text-white font-semibold"
            >
              Refresh
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {auditList.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  No administrative audit events recorded yet.
                </div>
              ) : (
                auditList.map((e: any) => (
                  <div
                    key={e.id}
                    className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                      e.severity === "high" || e.severity === "critical"
                        ? "border-l-4 border-red-400"
                        : ""
                    }`}
                  >
                    <div className="text-xs text-gray-400 font-mono min-w-[160px]">
                      {new Date(e.createdAt).toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {String(e.action || "").replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {e.targetName || e.targetType}
                        {e.targetId ? ` · ${e.targetId}` : ""}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      by{" "}
                      <strong className="text-gray-700">
                        {e.adminEmail || e.adminId}
                      </strong>
                    </div>
                    {e.severity && e.severity !== "normal" && (
                      <Badge
                        label={String(e.severity).toUpperCase()}
                        color="red"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
