import { prisma } from "../config/prisma"
import { AppError } from "../errors/AppError"
import { NotificationType } from "../generated/prisma/enums"

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  eventId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  link?: string | null
}

export interface FormattedNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  body: string // Alias for UI compatibility
  read: boolean
  readAt: string | null
  eventId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  link?: string | null
  time: string // Relative display string e.g. "2 hours ago"
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  items: FormattedNotification[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24)
    return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function mapNotificationToFormatted(n: any): FormattedNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    body: n.message,
    read: n.read,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    eventId: n.eventId,
    referenceType: n.referenceType,
    referenceId: n.referenceId,
    link: n.link,
    time: formatRelativeTime(n.createdAt),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }
}

/**
 * Creates an in-app notification idempotently.
 * Rule 8: Created only after business operation succeeds.
 * Rule 9: Prevents duplicates using eventId.
 */
export async function createNotification(
  data: CreateNotificationInput,
): Promise<FormattedNotification> {
  // Idempotency: If eventId is provided, check if already recorded
  if (data.eventId) {
    const existing = await prisma.notification.findUnique({
      where: {
        userId_eventId: {
          userId: data.userId,
          eventId: data.eventId,
        },
      },
    })
    if (existing) {
      return mapNotificationToFormatted(existing)
    }
  }

  try {
    const created = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        eventId: data.eventId || null,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        link: data.link || null,
      },
    })
    return mapNotificationToFormatted(created)
  } catch (err: any) {
    // If unique constraint P2002 was triggered concurrently, return the existing record
    if (err.code === "P2002" && data.eventId) {
      const existing = await prisma.notification.findUnique({
        where: {
          userId_eventId: {
            userId: data.userId,
            eventId: data.eventId,
          },
        },
      })
      if (existing) {
        return mapNotificationToFormatted(existing)
      }
    }
    throw err
  }
}

/**
 * Retrieves paginated notifications for an authenticated patient.
 * Rule 6: Derived strictly from authenticated patient ID.
 * Rule 7: Cross-patient data isolation.
 */
export async function getPatientNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
): Promise<NotificationListResponse> {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 20))
  const skip = (page - 1) * limit

  const whereClause: any = { userId }
  if (options.unreadOnly) {
    whereClause.read = false
  }

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: whereClause,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ])

  return {
    items: items.map(mapNotificationToFormatted),
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  }
}

/**
 * Retrieves the count of unread notifications for the patient.
 */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<{ unreadCount: number }> {
  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  })
  return { unreadCount }
}

/**
 * Marks an individual notification as read.
 * Rule 7: Enforces patient ownership (IDOR defense).
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
): Promise<FormattedNotification> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw AppError.notFound("Notification not found")
  }

  if (notification.userId !== userId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to access another patient's notification",
    )
  }

  if (notification.read) {
    return mapNotificationToFormatted(notification)
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  })

  return mapNotificationToFormatted(updated)
}

/**
 * Marks all unread notifications of the current patient as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<{ updatedCount: number; unreadCount: number }> {
  const updateResult = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  })

  return {
    updatedCount: updateResult.count,
    unreadCount: 0,
  }
}

/**
 * Dismisses or deletes a notification from the patient's inbox.
 * Rule 7: Enforces patient ownership (IDOR defense).
 * Rule 15: Deleting a notification does NOT delete underlying business records.
 */
export async function deletePatientNotification(
  userId: string,
  notificationId: string,
): Promise<{ success: boolean; id: string }> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw AppError.notFound("Notification not found")
  }

  if (notification.userId !== userId) {
    throw AppError.forbidden(
      "Access denied: You are not authorized to delete another patient's notification",
    )
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  })

  return { success: true, id: notificationId }
}
