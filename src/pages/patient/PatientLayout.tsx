import { useState, useEffect, useCallback } from "react"
import { useNavigate, Navigate, Link, useSearchParams } from "react-router"
import logoImg from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"
import { useAuth } from "@/context/AuthContext"
import AngitiaAIWidget from "@/components/AngitiaAIWidget"
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
} from "lucide-react"

const BLUE = "#1a3fcf"
type View = "dashboard" | "notifications" | "profile"

export default function PatientLayout() {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>("dashboard")
  const [dashboardTab, setDashboardTab] = useState<string>(
    () => searchParams.get("tab") || "overview",
  )
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Keep dashboard tab synced with URL ?tab=... dynamically without reload
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      if (tabParam === "profile") {
        setView("profile")
      } else if (tabParam === "notifications") {
        setView("notifications")
      } else {
        setDashboardTab(tabParam === "medications" ? "prescriptions" : tabParam)
        setView("dashboard")
      }
    }
  }, [searchParams])

  const refreshUnreadCount = useCallback(() => {
    api.patient.notifications
      .getUnreadCount()
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {})
  }, [])

  // Live unread notification count: on mount, view change, custom event, focus, and 15s poll
  useEffect(() => {
    refreshUnreadCount()
    const onRefresh = () => refreshUnreadCount()
    window.addEventListener("healthitude:refresh-notifications", onRefresh)
    window.addEventListener("focus", onRefresh)
    const timer = setInterval(refreshUnreadCount, 15000)

    return () => {
      window.removeEventListener("healthitude:refresh-notifications", onRefresh)
      window.removeEventListener("focus", onRefresh)
      clearInterval(timer)
    }
  }, [view, refreshUnreadCount])

  const handleNotificationNavigate = useCallback(
    (tab: string) => {
      if (tab === "profile") {
        setView("profile")
        setSearchParams({ tab: "profile" }, { replace: true })
        return
      }
      const normalized = tab === "medications" ? "prescriptions" : tab
      setDashboardTab(normalized)
      setView("dashboard")
      setSearchParams({ tab: normalized }, { replace: true })
    },
    [setSearchParams],
  )

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
          {view === "dashboard" && (
            <PatientDashboard
              activeTab={dashboardTab}
              onTabChange={(t) => {
                setDashboardTab(t)
                setSearchParams({ tab: t }, { replace: true })
              }}
            />
          )}
          {view === "notifications" && (
            <NotificationsPanel
              onUnreadCountChange={setUnreadCount}
              onNavigate={handleNotificationNavigate}
            />
          )}
          {view === "profile" && <ProfilePanel role="patient" />}
        </div>
      </main>

      <AngitiaAIWidget />
    </div>
  )
}
