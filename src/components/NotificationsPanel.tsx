import { useState, useEffect, useCallback } from "react"
import {
  api,
  type NotificationItem,
  type NotificationTypeValue,
} from "@/utils/api"
import {
  Calendar,
  RotateCcw,
  XCircle,
  Stethoscope,
  FileEdit,
  FileText,
  Pill,
  AlertTriangle,
  Bell,
  Check,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"

interface NotificationsPanelProps {
  onUnreadCountChange?: (count: number) => void
}

export default function NotificationsPanel({
  onUnreadCountChange,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.patient.notifications.getAll({
        unreadOnly: filter === "unread",
      })
      setNotifications(res.items)
      setUnreadCount(res.unreadCount)
      onUnreadCountChange?.(res.unreadCount)
    } catch (err: any) {
      console.error("[NotificationsPanel] Failed to load notifications:", err)
      setError(
        err?.message || "Failed to load notifications. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }, [filter, onUnreadCountChange])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleMarkAsRead(id: string) {
    setActionLoadingId(id)
    try {
      const updated = await api.patient.notifications.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: updated.readAt } : n,
        ),
      )
      setUnreadCount((c) => {
        const next = Math.max(0, c - 1)
        onUnreadCountChange?.(next)
        return next
      })
    } catch (err: any) {
      console.error("[NotificationsPanel] Error marking as read:", err)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0 || isMarkingAll) return
    setIsMarkingAll(true)
    try {
      await api.patient.notifications.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        })),
      )
      setUnreadCount(0)
      onUnreadCountChange?.(0)
    } catch (err: any) {
      console.error("[NotificationsPanel] Error marking all as read:", err)
    } finally {
      setIsMarkingAll(false)
    }
  }

  async function handleDelete(id: string) {
    setActionLoadingId(id)
    try {
      await api.patient.notifications.delete(id)
      const target = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.read) {
        setUnreadCount((c) => {
          const next = Math.max(0, c - 1)
          onUnreadCountChange?.(next)
          return next
        })
      }
    } catch (err: any) {
      console.error("[NotificationsPanel] Error dismissing notification:", err)
    } finally {
      setActionLoadingId(null)
    }
  }

  function getNotificationBadge(type: NotificationTypeValue) {
    switch (type) {
      case "APPOINTMENT_CONFIRMED":
        return {
          icon: <Calendar className="w-5 h-5 text-blue-600" />,
          color: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Appointment",
        }
      case "APPOINTMENT_RESCHEDULED":
        return {
          icon: <RotateCcw className="w-5 h-5 text-indigo-600" />,
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
          label: "Rescheduled",
        }
      case "APPOINTMENT_CANCELLED":
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          color: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Cancelled",
        }
      case "COMPLAINT_SUBMITTED":
        return {
          icon: <Stethoscope className="w-5 h-5 text-amber-600" />,
          color: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Complaint",
        }
      case "COMPLAINT_UPDATED":
        return {
          icon: <FileEdit className="w-5 h-5 text-purple-600" />,
          color: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Review Update",
        }
      case "CLINICAL_RECORD_ADDED":
        return {
          icon: <FileText className="w-5 h-5 text-teal-600" />,
          color: "bg-teal-50 text-teal-700 border-teal-200",
          label: "Clinical Record",
        }
      case "PRESCRIPTION_ADDED":
        return {
          icon: <Pill className="w-5 h-5 text-emerald-600" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Prescription",
        }
      case "EMERGENCY_ALERT":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          color: "bg-red-50 text-red-700 border-red-200",
          label: "Emergency",
        }
      default:
        return {
          icon: <Bell className="w-5 h-5 text-gray-600" />,
          color: "bg-gray-50 text-gray-700 border-gray-200",
          label: "Notification",
        }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with your appointments, medical records, and health
            consultations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="p-2 rounded-none text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAll || loading}
            className="btn-underline !text-xs !py-1.5 !px-3 font-medium"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isMarkingAll ? "Marking..." : "Mark all as read"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            filter === "all"
              ? "bg-[#1a3fcf] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
            filter === "unread"
              ? "bg-[#1a3fcf] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Unread Only {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-medium text-red-700">{error}</span>
          </div>
          <button
            onClick={loadNotifications}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-none text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && notifications.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            {filter === "unread" ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <Bell className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {filter === "unread"
              ? "You're all caught up! Switch to All Notifications to view your activity history."
              : "Updates regarding your appointments, health complaints, prescriptions, and records will appear here."}
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => {
            const badge = getNotificationBadge(n.type)
            const isActing = actionLoadingId === n.id

            return (
              <div
                key={n.id}
                className={`group relative bg-white rounded-xl border p-5 transition-all duration-150 hover:shadow-md ${
                  !n.read
                    ? "border-blue-200 bg-gradient-to-r from-blue-50/30 via-white to-white shadow-sm"
                    : "border-gray-100 opacity-90 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${badge.color}`}
                  >
                    {badge.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold text-gray-900 text-sm">
                        {n.title}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {!n.read && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white tracking-wide">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-gray-100/60 text-xs text-gray-400">
                      <span>{n.time}</span>
                      {n.referenceId && (
                        <span className="font-mono text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                          {n.referenceId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 self-start">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        disabled={isActing}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={isActing}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
