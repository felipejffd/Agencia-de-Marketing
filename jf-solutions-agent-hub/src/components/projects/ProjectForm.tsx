"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MODULE_OPTIONS } from "@/src/lib/schemas/project"
import type { ProjectInput } from "@/src/lib/schemas/project"

interface ProjectFormProps {
  clientId: string
  mode: "create" | "edit"
  projectId?: string
  defaultValues?: Partial<ProjectInput>
}

const inputClass =
  "w-full px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#BD8130]"

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Completado" },
]

export default function ProjectForm({
  clientId,
  mode,
  projectId,
  defaultValues = {},
}: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const defaultModules =
    (defaultValues.agreement?.modules as string[] | undefined) ?? []

  const [selectedModules, setSelectedModules] = useState<string[]>(defaultModules)

  function toggleModule(value: string) {
    setSelectedModules((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalError("")
    setFieldErrors({})

    if (selectedModules.length === 0) {
      setFieldErrors({ "agreement.modules": ["Selecciona al menos un módulo"] })
      return
    }

    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value.trim()

    const body = {
      clientId,
      name: getValue("name"),
      status: getValue("status"),
      agreement: {
        modules: selectedModules,
        startDate: getValue("startDate") || undefined,
        endDate: getValue("endDate") || undefined,
        value: getValue("value") ? Number(getValue("value")) : undefined,
      },
    }

    const url = mode === "create" ? "/api/proyectos" : `/api/proyectos/${projectId}`
    const method = mode === "create" ? "POST" : "PUT"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setFieldErrors(data.issues ?? {})
      setGlobalError(data.error ?? "Error al guardar.")
      return
    }

    router.push(`/proyectos/${clientId}`)
    router.refresh()
  }

  const agreement = defaultValues.agreement

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Nombre */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium uppercase tracking-wide mb-1"
          style={{ color: "#0E0E0E" }}
        >
          Nombre del proyecto <span style={{ color: "#BD8130" }}>*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues.name ?? ""}
          className={inputClass}
          style={{ borderColor: fieldErrors.name ? "#DC2626" : "#D1CFC9", color: "#0E0E0E" }}
        />
        {fieldErrors.name && (
          <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Estado */}
      <div>
        <label
          htmlFor="status"
          className="block text-xs font-medium uppercase tracking-wide mb-1"
          style={{ color: "#0E0E0E" }}
        >
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status ?? "draft"}
          className={inputClass}
          style={{ borderColor: "#D1CFC9", color: "#0E0E0E" }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Módulos */}
      <div>
        <p
          className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: "#0E0E0E" }}
        >
          Módulos contratados <span style={{ color: "#BD8130" }}>*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODULE_OPTIONS.map((mod) => {
            const checked = selectedModules.includes(mod.value)
            return (
              <label
                key={mod.value}
                className="flex items-center gap-2 px-3 py-2 border cursor-pointer text-sm transition-colors"
                style={{
                  borderColor: checked ? "#BD8130" : "#D1CFC9",
                  backgroundColor: checked ? "#FDF6EC" : "transparent",
                  color: "#0E0E0E",
                }}
              >
                <input
                  type="checkbox"
                  value={mod.value}
                  checked={checked}
                  onChange={() => toggleModule(mod.value)}
                  className="accent-[#BD8130]"
                />
                {mod.label}
              </label>
            )
          })}
        </div>
        {fieldErrors["agreement.modules"] && (
          <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
            {fieldErrors["agreement.modules"][0]}
          </p>
        )}
      </div>

      {/* Fechas y valor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-xs font-medium uppercase tracking-wide mb-1"
            style={{ color: "#0E0E0E" }}
          >
            Fecha inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={agreement?.startDate ?? ""}
            className={inputClass}
            style={{ borderColor: "#D1CFC9", color: "#0E0E0E" }}
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-xs font-medium uppercase tracking-wide mb-1"
            style={{ color: "#0E0E0E" }}
          >
            Fecha fin
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={agreement?.endDate ?? ""}
            className={inputClass}
            style={{ borderColor: "#D1CFC9", color: "#0E0E0E" }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="value"
          className="block text-xs font-medium uppercase tracking-wide mb-1"
          style={{ color: "#0E0E0E" }}
        >
          Valor del contrato (USD)
        </label>
        <input
          id="value"
          name="value"
          type="number"
          min="0"
          step="0.01"
          defaultValue={agreement?.value ?? ""}
          className={inputClass}
          style={{ borderColor: "#D1CFC9", color: "#0E0E0E" }}
        />
      </div>

      {globalError && (
        <p className="text-sm px-3 py-2" style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}>
          {globalError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
        >
          {loading
            ? "Guardando..."
            : mode === "create"
            ? "Crear proyecto"
            : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-medium border"
          style={{ borderColor: "#D1CFC9", color: "#0E0E0E" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
