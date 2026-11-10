import { useState, useRef, useEffect } from "react"
import { useNavigate, Navigate, Link } from "react-router"
import logoImg from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"
import { useAuth } from "@/context/AuthContext"
import AngitiaIcon from "@/components/AngitiaIcon"
import PatientDashboard from "@/components/PatientDashboard"
import ProfilePanel from "@/components/ProfilePanel"
import NotificationsPanel from "@/components/NotificationsPanel"
import { api } from "@/utils/api"
import {
  LayoutDashboard,
  Bell,
  Settings,
  Video,
  LogOut,
  Menu,
  X,
  Send,
  AlertCircle,
} from "lucide-react"

const BLUE = "#1a3fcf"
type View = "dashboard" | "notifications" | "profile"

const SUGGESTIONS = [
  "What does hypertension mean?",
  "How should I take Ibuprofen?",
  "When should I see a doctor for a headache?",
  "What is a referral?",
]

function AIFloatingChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am Angitia — Healthitude's health assistant. I can explain medical terms, help you understand your records, or guide you around the platform. I cannot diagnose, prescribe, or replace your doctor.",
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setMessages((m) => [
      ...m,
      { role: "user", text: msg },
      {
        role: "assistant",
        text: "Thank you for your question. For medical advice specific to your condition, please consult your doctor via the Complaints section. I can only provide general health information — this is educational and not a diagnosis or prescription.",
      },
    ])
    setInput("")
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ width: "360px", height: "500px" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: BLUE }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <AngitiaIcon size={18} color="white" pulseColor="#bfdbfe" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">
                  Angitia
                </p>
                <p className="text-white/60 text-xs">
                  Educational only · Not a diagnosis
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label="Close Angitia chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warning */}
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            Not a substitute for professional medical advice.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-snug ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-700 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: BLUE } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2.5 flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask a health question..."
            />
            <button
              onClick={() => send()}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 flex-shrink-0 cursor-pointer"
              style={{ background: BLUE }}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-150 hover:shadow-xl active:scale-[0.98] cursor-pointer"
        style={{
          background: open
            ? "#374151"
            : `linear-gradient(135deg, ${BLUE}, #0ea5e9)`,
        }}
        aria-label="Angitia assistant"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <AngitiaIcon size={30} color="white" pulseColor="#bfdbfe" />
        )}
      </button>
    </>
  )
}

export default function PatientLayout() {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>("dashboard")
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load unread count on mount and when view changes
  useEffect(() => {
    let mounted = true
    api.patient.notifications
      .getUnreadCount()
      .then((res) => {
        if (mounted) setUnreadCount(res.unreadCount)
      })
      .catch((err) =>
        console.error("[PatientLayout] Error loading unread count:", err),
      )

    return () => {
      mounted = false
    }
  }, [view])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3fcf]" />
      </div>
    )
  }

  if (!user || user.role !== "patient")
    return <Navigate to="/patient/login" replace />

  async function handleLogout() {
    await logout()
    navigate("/patient/login")
  }

  const navItems: { id: View label: string icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "My Health",
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: BLUE }}
          >
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {user.name}
            </p>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: BLUE + "18", color: BLUE }}
            >
              Patient
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
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-150 cursor-pointer ${
              view === item.id
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            style={view === item.id ? { background: BLUE } : {}}
          >
            <div className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.id === "notifications" && unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  view === item.id
                    ? "bg-white text-blue-700"
                    : "bg-red-500 text-white"
                }`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-2.5">
        <Link
          to="/telemedicine"
          className="btn-ripple !w-full !py-2.5 !text-sm text-white font-semibold flex items-center justify-center gap-2"
        >
          <Video className="w-4 h-4" />
          <span>Start Telemedicine</span>
        </Link>
        <p className="text-xs text-gray-400 pt-1 text-center">
          Phase 1 · v1.0.0 · Patient Portal
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

      {/* Mobile Drawer Backdrop & Drawer */}
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

      {/* Main Layout */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 shadow-[0_1px_3px_rgba(13,27,75,0.02)]">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
                    ? "My Health Dashboard"
                    : view === "notifications"
                      ? "Notifications"
                      : "Profile & Settings"}
                </h1>
                <p className="text-xs text-gray-500">
                  Oct 22, 2026 · Healthitude Patient Portal
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
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: BLUE }}
                title={user.name}
              >
                {user.initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {view === "dashboard" && <PatientDashboard />}
          {view === "notifications" && (
            <NotificationsPanel onUnreadCountChange={setUnreadCount} />
          )}
          {view === "profile" && <ProfilePanel role="patient" />}
        </div>
      </main>

      <AIFloatingChat />
    </div>
  )
}
