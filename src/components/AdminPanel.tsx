import { useState } from "react"
import {
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  Plus,
} from "lucide-react"

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

export default function AdminPanel() {
  const [view, setView] = useState<AdminView>("users")
  const [selectedPro, setSelectedPro] =
    useState<typeof professionals[0] | null>(null)

  const navItems: { id: AdminView label: string icon: React.ReactNode }[] = [
    {
      id: "users",
      label: "User Management",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "verification",
      label: "Verification Review",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "pricing",
      label: "Pricing & Categories",
      icon: <CreditCard className="w-4 h-4" />,
    },
    { id: "audit", label: "Audit Log", icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Users",
            value: "18,500",
            icon: <Users className="w-4 h-4 text-blue-600" />,
          },
          {
            label: "Pending Verifications",
            value: "12",
            icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
            warn: true,
          },
          {
            label: "Active Professionals",
            value: "2,401",
            icon: <Users className="w-4 h-4 text-blue-600" />,
          },
          {
            label: "Open Audit Items",
            value: "3",
            icon: <FileText className="w-4 h-4 text-amber-600" />,
            warn: true,
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
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">All Users</h3>
            <input
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              placeholder="Search users..."
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  "Name",
                  "Role",
                  "Category",
                  "Status",
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
              {[
                {
                  name: "Ama Mensah",
                  role: "Patient",
                  category: "NHIS",
                  status: "Active",
                  joined: "Mar 2024",
                },
                {
                  name: "Dr. Kofi Boateng",
                  role: "Doctor",
                  category: "—",
                  status: "Active",
                  joined: "Jan 2022",
                },
                {
                  name: "Kweku Osei",
                  role: "Patient",
                  category: "General",
                  status: "Active",
                  joined: "Jun 2025",
                },
                {
                  name: "Nurse Afua Darko",
                  role: "Nurse",
                  category: "—",
                  status: "Active",
                  joined: "Aug 2023",
                },
                {
                  name: "Abena Frempong",
                  role: "Patient",
                  category: "Student",
                  status: "Active",
                  joined: "Sep 2026",
                },
              ].map((u) => (
                <tr key={u.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.role}</td>
                  <td className="px-4 py-3 text-gray-500">{u.category}</td>
                  <td className="px-4 py-3">
                    <Badge label={u.status} color="green" />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.joined}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline text-xs mr-3">
                      View
                    </button>
                    <button className="text-red-500 hover:underline text-xs">
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "verification" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold text-gray-900">
              Verification Queue
            </h3>
            {professionals.map((p) => (
              <div
                key={p.name}
                onClick={() => setSelectedPro(p)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-blue-300 ${
                  selectedPro?.name === p.name
                    ? "border-blue-400"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.profession} · {p.specialty}
                    </p>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      {p.licence}
                    </p>
                  </div>
                  <Badge
                    label={p.status}
                    color={p.status === "UNDER_REVIEW" ? "yellow" : "gray"}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Submitted {p.submitted}
                </p>
              </div>
            ))}
          </div>

          {selectedPro ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
              <h3 className="font-display text-lg font-bold text-gray-900">
                Review: {selectedPro.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Profession", value: selectedPro.profession },
                  { label: "Specialty", value: selectedPro.specialty },
                  { label: "Licence", value: selectedPro.licence },
                  { label: "Submitted", value: selectedPro.submitted },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Evidence documents
                </p>
                <div className="space-y-2">
                  {[
                    "National ID",
                    "Professional Licence",
                    "Qualification Certificate",
                  ].map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm text-gray-600">{doc}</span>
                      <button className="text-blue-600 text-xs hover:underline">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewer notes
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this verification decision..."
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="py-2 rounded-none text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors">
                  Verify
                </button>
                <button className="py-2 rounded-none text-white text-sm font-medium bg-amber-500 hover:bg-amber-600 transition-colors">
                  Restrict
                </button>
                <button className="py-2 rounded-none text-white text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors">
                  Reject
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
              Audit & Security Log
            </h3>
            <button className="btn-rise !px-4 !py-2 !text-sm text-white font-semibold">
              Export
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {auditEvents.map((e, i) => (
                <div
                  key={i}
                  className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    e.severity === "high"
                      ? "border-l-4 border-red-400"
                      : e.severity === "warn"
                        ? "border-l-4 border-amber-400"
                        : ""
                  }`}
                >
                  <div className="text-xs text-gray-400 font-mono min-w-[160px]">
                    {e.time}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800 text-sm">
                      {e.action.replace(/_/g, " ")}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{e.target}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    by <strong className="text-gray-700">{e.actor}</strong>
                  </div>
                  {e.severity !== "normal" && (
                    <Badge
                      label={e.severity === "high" ? "HIGH" : "WARNING"}
                      color={e.severity === "high" ? "red" : "yellow"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
