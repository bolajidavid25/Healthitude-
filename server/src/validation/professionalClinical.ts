import { z } from "zod"
import {
  AppointmentStatus,
  ClinicalRecordType,
  ComplaintSeverity,
  ComplaintStatus,
  PrescriptionStatus,
} from "../generated/prisma/enums"

/**
 * Query schema for GET /api/professional/appointments
 */
export const professionalAppointmentsQuerySchema = z.object({
  tab: z
    .enum(["today", "upcoming", "completed", "cancelled", "all"])
    .optional()
    .default("all"),
  status: z.nativeEnum(AppointmentStatus).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
})

export type ProfessionalAppointmentsQuery = z.infer<
  typeof professionalAppointmentsQuerySchema
>

/**
 * Body schema for PATCH /api/professional/appointments/:id/status
 */
export const updateProfessionalAppointmentStatusSchema = z
  .object({
    status: z.enum([
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ]),
    notes: z.string().trim().max(2000).optional(),
    cancellationReason: z.string().trim().max(500).optional(),
  })
  .strict()

export type UpdateProfessionalAppointmentStatusInput = z.infer<
  typeof updateProfessionalAppointmentStatusSchema
>

/**
 * Prescription item embedded inside consultation completion
 */
const consultationPrescriptionItemSchema = z.object({
  medicine: z.string().trim().min(2, "Medication name is required").max(150),
  dose: z.string().trim().min(1, "Dosage is required").max(100),
  frequency: z.string().trim().min(1, "Frequency is required").max(100),
  duration: z.string().trim().min(1, "Duration is required").max(100),
  route: z.string().trim().max(60).optional(),
  instructions: z.string().trim().max(500).optional(),
})

/**
 * Body schema for POST /api/professional/appointments/:id/complete
 * Atomically records consultation notes, diagnoses, optional vitals, prescriptions, and completes the appointment.
 */
export const completeConsultationSchema = z
  .object({
    consultationNotes: z
      .string({ required_error: "Consultation notes are required" })
      .trim()
      .min(5, "Consultation notes must be at least 5 characters")
      .max(5000, "Consultation notes cannot exceed 5000 characters"),
    diagnoses: z.array(z.string().trim().max(300)).optional().default([]),
    vitalSigns: z.string().trim().max(1000).optional(),
    recommendations: z.string().trim().max(3000).optional(),
    followUp: z
      .enum(["none", "follow1week", "follow2weeks", "follow1month", "custom"])
      .optional()
      .default("none"),
    followUpDate: z.string().trim().max(30).optional(),
    prescriptions: z
      .array(consultationPrescriptionItemSchema)
      .optional()
      .default([]),
  })
  .strict()

export type CompleteConsultationInput = z.infer<
  typeof completeConsultationSchema
>

/**
 * Query schema for GET /api/professional/complaints
 */
export const professionalComplaintsQuerySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  severity: z.nativeEnum(ComplaintSeverity).optional(),
  assignedToMe: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
})

export type ProfessionalComplaintsQuery = z.infer<
  typeof professionalComplaintsQuerySchema
>

/**
 * Body schema for PATCH /api/professional/complaints/:id
 */
export const updateProfessionalComplaintSchema = z
  .object({
    status: z.enum([
      ComplaintStatus.UNDER_REVIEW,
      ComplaintStatus.REFERRED_TO_SPECIALIST,
      ComplaintStatus.RESOLVED,
    ]),
    clinicalNotes: z.string().trim().max(4000).optional(),
  })
  .strict()

export type UpdateProfessionalComplaintInput = z.infer<
  typeof updateProfessionalComplaintSchema
>

/**
 * Body schema for POST /api/professional/clinical-records
 * Author identity is derived strictly from the authenticated verified professional session.
 */
export const professionalCreateClinicalRecordSchema = z
  .object({
    patientId: z
      .string({ required_error: "Patient ID is required" })
      .uuid("Patient ID must be a valid UUID"),
    type: z.nativeEnum(ClinicalRecordType, {
      required_error: "Clinical record type is required",
    }),
    content: z
      .string({ required_error: "Clinical content is required" })
      .trim()
      .min(3, "Clinical content must be at least 3 characters")
      .max(5000, "Clinical content cannot exceed 5000 characters"),
    attachmentName: z.string().trim().max(255).optional(),
    attachmentUrl: z.string().trim().max(500).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict()

export type ProfessionalCreateClinicalRecordInput = z.infer<
  typeof professionalCreateClinicalRecordSchema
>

/**
 * Body schema for POST /api/professional/prescriptions
 * Prescriber identity is derived strictly from the authenticated verified professional session.
 */
export const professionalCreatePrescriptionSchema = z
  .object({
    patientId: z
      .string({ required_error: "Patient ID is required" })
      .uuid("Patient ID must be a valid UUID"),
    medicine: z
      .string({ required_error: "Medication name is required" })
      .trim()
      .min(2, "Medication name must be at least 2 characters")
      .max(150),
    dose: z
      .string({ required_error: "Dosage is required" })
      .trim()
      .min(1, "Dosage is required")
      .max(100),
    frequency: z
      .string({ required_error: "Frequency is required" })
      .trim()
      .min(1, "Frequency is required")
      .max(100),
    duration: z
      .string({ required_error: "Duration is required" })
      .trim()
      .min(1, "Duration is required")
      .max(100),
    route: z.string().trim().max(60).optional(),
    instructions: z.string().trim().max(1000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict()

export type ProfessionalCreatePrescriptionInput = z.infer<
  typeof professionalCreatePrescriptionSchema
>

/**
 * Body schema for PATCH /api/professional/prescriptions/:id/status
 */
export const updatePrescriptionStatusSchema = z
  .object({
    status: z.nativeEnum(PrescriptionStatus),
  })
  .strict()

export type UpdatePrescriptionStatusInput = z.infer<
  typeof updatePrescriptionStatusSchema
>

/**
 * Body schema for POST /api/professional/emergencies/:caseNumber/access
 * Rule C: Compulsory clinical justification logged to immutable EmergencyAuditLog.
 */
export const professionalEmergencyAccessSchema = z
  .object({
    justification: z
      .string({ required_error: "Clinical justification is required" })
      .trim()
      .min(5, "Justification must be at least 5 characters")
      .max(1000),
  })
  .strict()

export type ProfessionalEmergencyAccessInput = z.infer<
  typeof professionalEmergencyAccessSchema
>

/**
 * Body schema for POST /api/professional/emergencies/:caseNumber/respond
 */
export const professionalEmergencyRespondSchema = z
  .object({
    notes: z.string().trim().max(1000).optional(),
  })
  .strict()

export type ProfessionalEmergencyRespondInput = z.infer<
  typeof professionalEmergencyRespondSchema
>

/**
 * Body schema for POST /api/professional/emergencies/:caseNumber/resolve
 */
export const professionalEmergencyResolveSchema = z
  .object({
    resolutionNotes: z
      .string({ required_error: "Resolution notes are required" })
      .trim()
      .min(3, "Resolution notes must be at least 3 characters")
      .max(2000),
  })
  .strict()

export type ProfessionalEmergencyResolveInput = z.infer<
  typeof professionalEmergencyResolveSchema
>
