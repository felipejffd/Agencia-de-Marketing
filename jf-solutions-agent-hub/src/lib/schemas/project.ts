import { z } from "zod"

export const MODULE_OPTIONS = [
  { value: "strategy", label: "Estrategia" },
  { value: "content", label: "Contenido" },
  { value: "scripts", label: "Guiones" },
  { value: "ads", label: "Publicidad" },
  { value: "analytics", label: "Analítica" },
  { value: "web", label: "Web" },
] as const

export type ModuleValue = (typeof MODULE_OPTIONS)[number]["value"]

export const agreementSchema = z.object({
  modules: z.array(z.string()).min(1, "Selecciona al menos un módulo"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.coerce.number().nonnegative().optional(),
})

export const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1, "El nombre del proyecto es requerido").max(200),
  status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
  agreement: agreementSchema,
})

export type ProjectInput = z.infer<typeof projectSchema>
export type AgreementInput = z.infer<typeof agreementSchema>
