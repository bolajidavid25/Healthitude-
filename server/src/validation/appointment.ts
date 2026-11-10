import { z } from "zod"
import { AppointmentStatus } from "../generated/prisma/enums"

export const createAppointmentSchema = z
  .object({
    doctorName: z.string().min(1, "Doctor name is required").max(255),
    doctorId: z.string().optional(),
    department: z.string().max(100).optional(),
    type: z
      .string()
      .min(1, "Appointment type is required")
      .max(100)
      .default("General Consultation"),
    reason: z.string().min(1, "Reason for visit is required").max(255),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    time: z.string().min(1, "Time slot is required").max(50),
    symptoms: z.string().max(2000).optional(),
    duration: z.string().max(100).optional(),
    severity: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
    documents: z.array(z.string()).optional().default([]),
    referralDoc: z.string().max(255).optional(),
    schedulingUrl: z.string().url().or(z.string()).optional(),
  })
  .strict()

export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>

export const updateAppointmentIntakeSchema = z
  .object({
    symptoms: z.string().max(2000).optional(),
    duration: z.string().max(100).optional(),
    severity: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
    documents: z.array(z.string()).optional(),
    referralDoc: z.string().max(255).optional(),
  })
  .strict()

export type UpdateAppointmentIntakeInput = z.infer<typeof updateAppointmentIntakeSchema>

export const rescheduleAppointmentSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    time: z.string().min(1, "Time slot is required").max(50),
    reason: z.string().max(500).optional(),
  })
  .strict()

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>

export const cancelAppointmentSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict()
  .optional()
  .default({})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>
