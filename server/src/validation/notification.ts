import { z } from "zod"
import { NotificationType } from "../generated/prisma/enums"

export const getNotificationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "Page must be a positive integer greater than or equal to 1",
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1"),
})

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>
