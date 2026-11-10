import { Request, Response } from "express"
import { getNotificationsQuerySchema } from "../validation/notification"
import {
  getPatientNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deletePatientNotification,
} from "../services/notificationService"

/**
 * GET /api/patient/notifications
 * Retrieves paginated notifications for the authenticated patient.
 */
export async function getPatientNotificationsHandler(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.id
  const query = getNotificationsQuerySchema.parse(req.query)

  const result = await getPatientNotifications(userId, query)

  return res.status(200).json({
    status: "success",
    data: result,
  })
}

/**
 * GET /api/patient/notifications/unread-count
 * Retrieves the unread notification count for the header bell badge.
 */
export async function getUnreadNotificationCountHandler(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.id
  const result = await getUnreadNotificationCount(userId)

  return res.status(200).json({
    status: "success",
    data: result,
  })
}

/**
 * PATCH /api/patient/notifications/:id/read
 * Marks an individual notification as read.
 */
export async function markNotificationReadHandler(req: Request, res: Response) {
  const userId = (req as any).user.id
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  const result = await markNotificationAsRead(userId, id)

  return res.status(200).json({
    status: "success",
    message: "Notification marked as read",
    data: result,
  })
}

/**
 * PATCH /api/patient/notifications/mark-all-read
 * Marks all unread notifications for the patient as read.
 */
export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.id

  const result = await markAllNotificationsAsRead(userId)

  return res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
    data: result,
  })
}

/**
 * DELETE /api/patient/notifications/:id
 * Dismisses/deletes an individual notification from the patient's inbox.
 */
export async function deleteNotificationHandler(req: Request, res: Response) {
  const userId = (req as any).user.id
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  const result = await deletePatientNotification(userId, id)

  return res.status(200).json({
    status: "success",
    message: "Notification dismissed successfully",
    data: result,
  })
}
