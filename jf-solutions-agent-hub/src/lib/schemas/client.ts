import { z } from "zod"

export const clientSchema = z.object({
  businessName: z.string().min(1, "El nombre del negocio es requerido").max(200),
  industry: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
