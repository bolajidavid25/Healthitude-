import { z } from "zod"

/**
 * Validation schema for provider discovery query parameters.
 */
export const providerQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(100).optional(),
  consultType: z.string().trim().max(50).optional(),
  verified: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => (typeof val === "boolean" ? val : val === "true"))
    .optional(),
  limit: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(50),
  offset: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(z.number().int().min(0))
    .optional()
    .default(0),
})

export type ProviderQueryInput = z.infer<typeof providerQuerySchema>
