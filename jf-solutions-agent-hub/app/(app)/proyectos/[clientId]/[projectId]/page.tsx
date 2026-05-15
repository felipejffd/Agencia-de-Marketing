import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { MODULE_OPTIONS } from "@/src/lib/schemas/project"

interface Props {
  params: Promise<{ clientId: string; projectId: string }>
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
}

export default async function ProyectoDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { clientId, projectId } = await params

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId, client: { userId: session.user.id } },
    include: {
      client: { select: { businessName: true } },
      brief: true,
      uploadedBrief: true,
    },
  })
  if (!project) notFound()

  const agreement = project.agreement as {
    modules: string[]
    startDate?: string
    endDate?: string
    value?: number
  }

  const moduleLabels = MODULE_OPTIONS.filter((m: typeof MODULE_OPTIONS[0]) => agreement.modules.includes(m.value)).map(
    (m: typeof MODULE_OPTIONS[0]) => m.label
  )

  const hasBrief = !!project.brief?.interviewData
  const hasUpload = !!project.uploadedBrief?.fileUrl

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/proyectos/${clientId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← {project.client.businessName}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-semibold" style={{ color: "#0E0E0E" }}>
            {project.name}
          </h1>
          <span
            className="text-xs px-2 py-0.5 font-medium"
            style={{ backgroundColor: "#F3F2EE", color: "#6B6B6B" }}
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "#8A8A8A" }}>
          Creado el {new Date(project.createdAt).toLocaleDateString("es-ES")}
        </p>
      </div>

      {/* Acuerdo */}
      <section
        className="border p-5 mb-6"
        style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: "#0E0E0E" }}
        >
          Acuerdo
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A8A8A" }}>
              Módulos contratados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {moduleLabels.map((label: string) => (
                <span
                  key={label}
                  className="text-xs px-2 py-0.5 border"
                  style={{ borderColor: "#BD8130", color: "#BD8130" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {(agreement.startDate || agreement.endDate || agreement.value !== undefined) && (
            <div
              className="grid grid-cols-3 gap-4 pt-2 border-t"
              style={{ borderColor: "#E5E4E0" }}
            >
              {agreement.startDate && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#8A8A8A" }}>
                    Inicio
                  </p>
                  <p className="text-sm" style={{ color: "#0E0E0E" }}>
                    {agreement.startDate}
                  </p>
                </div>
              )}
              {agreement.endDate && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#8A8A8A" }}>
                    Fin
                  </p>
                  <p className="text-sm" style={{ color: "#0E0E0E" }}>
                    {agreement.endDate}
                  </p>
                </div>
              )}
              {agreement.value !== undefined && (
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#8A8A8A" }}>
                    Valor
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#0E0E0E" }}>
                    USD {agreement.value.toLocaleString("es-ES")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Brief status */}
      <section
        className="border p-5 mb-6"
        style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: "#0E0E0E" }}
        >
          Estado del Brief
        </h2>

        <div className="space-y-3">
          {/* Interview / generated brief */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "#0E0E0E" }}>
                Brief generado por entrevista
              </p>
              {hasBrief && project.brief?.pdfUrl && (
                <a
                  href={project.brief.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                  style={{ color: "#BD8130" }}
                >
                  Ver PDF ↗
                </a>
              )}
            </div>
            {hasBrief ? (
              <Link
                href={`/proyectos/${clientId}/${projectId}/brief`}
                className="text-xs px-3 py-1.5 border font-medium"
                style={{ borderColor: "#065F46", color: "#065F46" }}
              >
                ✓ Ver brief
              </Link>
            ) : (
              <Link
                href={`/proyectos/${clientId}/${projectId}/entrevista`}
                className="text-xs px-3 py-1.5 border font-medium"
                style={{ borderColor: "#BD8130", color: "#BD8130" }}
              >
                Completar entrevista
              </Link>
            )}
          </div>

          <div className="border-t" style={{ borderColor: "#E5E4E0" }} />

          {/* Uploaded brief */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "#0E0E0E" }}>
                Brief diligenciado (PDF)
              </p>
              {hasUpload && project.uploadedBrief?.uploadedAt && (
                <p className="text-xs" style={{ color: "#8A8A8A" }}>
                  Subido el{" "}
                  {new Date(project.uploadedBrief.uploadedAt).toLocaleDateString("es-ES")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {hasUpload && (
                <a
                  href={project.uploadedBrief!.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 border font-medium"
                  style={{ borderColor: "#D1CFC9", color: "#4A4A4A" }}
                >
                  Ver ↗
                </a>
              )}
              <Link
                href={`/proyectos/${clientId}/${projectId}/subir`}
                className="text-xs px-3 py-1.5 border font-medium"
                style={
                  hasUpload
                    ? { borderColor: "#D1CFC9", color: "#6B6B6B" }
                    : { borderColor: "#BD8130", color: "#BD8130" }
                }
              >
                {hasUpload ? "Re-subir" : "Subir brief"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "#0E0E0E" }}
        >
          Acciones del proyecto
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Entrevista",
              href: `/proyectos/${clientId}/${projectId}/entrevista`,
              description: "Iniciar entrevista con el agente",
            },
            {
              label: "Ver Brief",
              href: `/proyectos/${clientId}/${projectId}/brief`,
              description: "Brief generado con IA",
            },
            {
              label: "Subir Brief",
              href: `/proyectos/${clientId}/${projectId}/subir`,
              description: "Subir brief diligenciado en PDF",
            },
            {
              label: "Resultados",
              href: `/proyectos/${clientId}/${projectId}/resultados`,
              description: "Ver outputs de los agentes",
            },
          ].map((action: { label: string; href: string; description: string }) => (
            <Link
              key={action.label}
              href={action.href}
              className="border p-4 flex flex-col gap-1 transition-colors hover:border-[#BD8130] group"
              style={{ borderColor: "#E5E4E0" }}
            >
              <span
                className="text-sm font-medium group-hover:text-[#BD8130] transition-colors"
                style={{ color: "#0E0E0E" }}
              >
                {action.label}
              </span>
              <span className="text-xs" style={{ color: "#8A8A8A" }}>
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Editar */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: "#E5E4E0" }}>
        <Link
          href={`/proyectos/${clientId}/${projectId}/editar`}
          className="text-xs px-4 py-2 border font-medium"
          style={{ borderColor: "#D1CFC9", color: "#6B6B6B" }}
        >
          Editar proyecto
        </Link>
      </div>
    </div>
  )
}
