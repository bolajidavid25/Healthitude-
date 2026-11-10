import { useState } from "react"
import { useNavigate, Navigate } from "react-router"
import logoImg from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"
import { useAuth, type ProfRole } from "@/context/AuthContext"
import DoctorDashboard from "@/components/DoctorDashboard"
import AdminPanel from "@/components/AdminPanel"
import ProfilePanel from "@/components/ProfilePanel"
import { LayoutDashboard, Bell, Settings, LogOut, Menu, X } from "lucide-react"

const BLUE = "#1a3fcf"
type View = "dashboard" | "notifications" | "profile"

const ROLE_COLOR: Record<ProfRole, string> = {
  doctor: "#16a34a",
  nurse: "#0ea5e9",
  pharmacist: "#7c3aed",
  admin: "#dc2626",
}

const ROLE_LABEL: Record<ProfRole, string> = {
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  admin: "Administrator",
}

const notifications = [
  {
    time: "1 hour ago",
    title: "New complaint assigned",
    body: "Patient Ama Mensah has submitted a new complaint — CPL-0041 assigned to you.",
    read: false,
  },
  {
    time: "3 hours ago",
    title: "Verification approved",
    body: "Your professional credentials have been verified. Clinical privileges are now active.",
    read: false,
  },
  {
    time: "Yesterday",
    title: "Appointment reminder",
    body: "You have 4 appointments scheduled for tomorrow starting at 9:00 AM.",
    read: true,
  },
]

export default function ProfLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const profRoles: ProfRole[] = ["doctor", "nurse", "pharmacist", "admin"]
  if (!user || !profRoles.includes(user.role as ProfRole)) {
    return <Navigate to="/professional/login" replace />
  }

  const role = user.role as ProfRole
  const color = ROLE_COLOR[role]

  function handleLogout() {
    logout()
    navigate("/professional/login")
  }

  const dashLabel = role === "admin" ? "Administration" : "Clinical Dashboard"

  const navItems: { id: View label: string icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: dashLabel,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: "profile",
      label: "Profile & Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ]

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <img
          src={logoImg}
          alt="Healthitude"
          className="h-8 object-contain object-left"
        />
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
            style={{ background: color }}
          >
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {user.name}
            </p>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: color + "18", color }}
            >
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id)
              setMobileMenuOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-150 cursor-pointer ${
              view === item.id
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            style={view === item.id ? { background: BLUE } : {}}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-2.5">
        <p className="text-xs text-gray-400 text-center">
          Phase 1 · v1.0.0 · Professional Portal
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-none text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: "#f7f9ff" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-gray-100 bg-white z-20 shadow-[1px_0_10px_rgba(13,27,75,0.03)]">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col border-r border-gray-100 bg-white z-50 transition-transform duration-300 md:hidden shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-[0_1px_3px_rgba(13,27,75,0.02)]">
          <div className="w-[94%] max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-display font-bold text-gray-900 text-lg">
                  {view === "dashboard"
                    ? dashLabel
                    : view === "notifications"
                      ? "Notifications"
                      : "Profile & Settings"}
                </h1>
                <p className="text-xs text-gray-500">
                  Oct 22, 2026 · Healthitude Professional Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("notifications")}
                className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: color }}
                title={user.name}
              >
                {user.initials}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {view === "dashboard" && role === "admin" && <AdminPanel />}
          {view === "dashboard" &&
            role !== "admin" &&
            role === "pharmacist" && (
              <div className="space-y-6 max-w-5xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Active Prescriptions",
                      value: "142",
                      accent: true,
                    },
                    { label: "Pending Fills", value: "18" },
                    { label: "Refill Reminders", value: "9" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-xl p-5 border shadow-sm ${
                        s.accent
                          ? "border-blue-200 bg-blue-50/50"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                        {s.label}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          s.accent ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-3">
                    Medication Workflow
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your clinical scope covers prescription review, dispensing,
                    and medication counselling within your authorized scope.
                  </p>
                </div>
              </div>
            )}
          {view === "dashboard" && (role === "doctor" || role === "nurse") && (
            <DoctorDashboard />
          )}
          {view === "notifications" && (
            <div className="space-y-4 max-w-4xl">
              <h2 className="font-display text-xl font-bold text-gray-900">
                Notifications
              </h2>
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${
                    !n.read
                      ? "border-blue-200 bg-blue-50/20"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {!n.read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      )}
                      <span className="font-medium text-gray-800 text-sm">
                        {n.title}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {n.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {view === "profile" && <ProfilePanel role={role} />}
        </div>
      </main>
    </div>
  )
}
