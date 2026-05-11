import Link from "next/link"
import { MODULE_OPTIONS } from "@/src/lib/schemas/project"

interface Agreement {
  modules: string[]
  startDate?: string
  endDate?: string
  value?: number
}

interface ProjectCardProps {
  id: string
  name: string
  clientId: string
  clientName: string
  status: string
  agreement: Agreement
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Borrador",   bg: "#F3F2EE", color: "#6B6B6B" },
  active:    { label: "Activo",     bg: "#ECFDF5", color: "#065F46" },
  paused:    { label: "Pausado",    bg: "#FEF9C3", color: "#854D0E" },
  completed: { label: "Completado", bg: "#EFF6FF", color: "#1E40AF" },
}

export default function ProjectCard({
  id,
  name,
  clientId,
  clientName,
  status,
  agreement,
}: ProjectCardProps) {
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.draft
  const moduleLabels = MODULE_OPTIONS.filter((m) => agreement.modules.includes(m.value)).map(
    (m) => m.label
  )

  return (
    <div
      className="border p-5 flex flex-col gap-3"
      style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "#0E0E0E" }}>
            {name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>
            {clientName}
          </p>
        </div>
        <span
          className="text-xs px-2 py-0.5 font-medium shrink-0"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Módulos */}
      <div className="flex flex-wrap gap-1">
        {moduleLabels.map((label) => (
          <span
            key={label}
            className="text-xs px-2 py-0.5 border"
            style={{ borderColor: "#BD8130", color: "#BD8130" }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Fechas y valor */}
      {(agreement.startDate || agreement.endDate || agreement.value) && (
        <div className="text-xs flex gap-4" style={{ color: "#6B6B6B" }}>
          {agreement.startDate && <span>Inicio: {agreement.startDate}</span>}
          {agreement.endDate && <span>Fin: {agreement.endDate}</span>}
          {agreement.value !== undefined && (
            <span>USD {agreement.value.toLocaleString("es-ES")}</span>
          )}
        </div>
      )}

      <Link
        href={`/proyectos/${clientId}/${id}`}
        className="text-xs font-medium self-start px-3 py-1.5 border transition-colors"
        style={{ borderColor: "#BD8130", color: "#BD8130" }}
      >
        Ver proyecto →
      </Link>
    </div>
  )
}
