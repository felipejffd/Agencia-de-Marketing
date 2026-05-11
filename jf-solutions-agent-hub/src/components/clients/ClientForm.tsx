"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ClientInput } from "@/src/lib/schemas/client"

interface FieldErrors {
  businessName?: string[]
  industry?: string[]
  country?: string[]
  email?: string[]
  phone?: string[]
  notes?: string[]
}

interface ClientFormProps {
  mode: "create" | "edit"
  clientId?: string
  defaultValues?: Partial<ClientInput>
}

const inputClass =
  "w-full px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#BD8130]"

const labelClass = "block text-xs font-medium uppercase tracking-wide mb-1"

export default function ClientForm({ mode, clientId, defaultValues = {} }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalError("")
    setFieldErrors({})
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value.trim()

    const body: ClientInput = {
      businessName: getValue("businessName"),
      industry: getValue("industry") || undefined,
      country: getValue("country") || undefined,
      email: getValue("email") || undefined,
      phone: getValue("phone") || undefined,
      notes: getValue("notes") || undefined,
    }

    const url = mode === "create" ? "/api/clientes" : `/api/clientes/${clientId}`
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

    router.push("/clientes")
    router.refresh()
  }

  const field = (
    name: keyof ClientInput,
    label: string,
    type: string = "text",
    required = false
  ) => (
    <div>
      <label htmlFor={name} className={labelClass} style={{ color: "#0E0E0E" }}>
        {label} {required && <span style={{ color: "#BD8130" }}>*</span>}
      </label>
      {name === "notes" ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          defaultValue={defaultValues[name] ?? ""}
          className={inputClass}
          style={{ borderColor: fieldErrors[name] ? "#DC2626" : "#D1CFC9", color: "#0E0E0E" }}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValues[name] ?? ""}
          className={inputClass}
          style={{ borderColor: fieldErrors[name] ? "#DC2626" : "#D1CFC9", color: "#0E0E0E" }}
        />
      )}
      {fieldErrors[name] && (
        <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
          {fieldErrors[name]![0]}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {field("businessName", "Nombre del negocio", "text", true)}
      {field("industry", "Industria")}
      {field("country", "País")}
      {field("email", "Email", "email")}
      {field("phone", "Teléfono", "tel")}
      {field("notes", "Notas")}

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
            ? "Crear cliente"
            : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-medium border transition-colors"
          style={{ borderColor: "#D1CFC9", color: "#0E0E0E", backgroundColor: "transparent" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
