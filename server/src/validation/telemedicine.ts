import { z } from "zod"

/**
 * Validation schema for initiating a telemedicine video consultation.
 */
export const startTelemedicineSchema = z
  .object({
    deviceType: z.string().max(100).optional(),
    browser: z.string().max(100).optional(),
  })
  .optional()

/**
 * Validation schema for ending a telemedicine session.
 */
export const endTelemedicineSchema = z
  .object({
    exitReason: z.string().max(255).optional(),
    feedback: z.string().max(500).optional(),
  })
  .optional()

export type StartTelemedicineInput = z.infer<typeof startTelemedicineSchema>
export type EndTelemedicineInput = z.infer<typeof endTelemedicineSchema>
