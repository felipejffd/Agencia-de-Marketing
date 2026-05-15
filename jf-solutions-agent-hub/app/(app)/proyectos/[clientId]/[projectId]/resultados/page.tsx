import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { MODULE_OPTIONS } from "@/src/lib/schemas/project"
import AgentPanel from "@/src/components/agents/AgentPanel"

interface Props {
  params: Promise<{ clientId: string; projectId: string }>
}

export default async function ResultadosPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { clientId, projectId } = await params

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId, client: { userId: session.user.id } },
    include: {
      client: { select: { businessName: true } },
      agentResults: {
        orderBy: { generatedAt: "desc" },
      },
    },
  })
  if (!project) notFound()

  const agreement = project.agreement as { modules: string[] }

  // Only show panels for modules in agreement
  const activeModules = MODULE_OPTIONS.filter((m) =>
    agreement.modules.includes(m.value)
  )

  // Get latest result per agent type
  const latestResultByType = project.agentResults.reduce<
    Record<string, (typeof project.agentResults)[0]>
  >((acc: Record<string, (typeof project.agentResults)[0]>, r) => {
    if (!acc[r.agentType]) acc[r.agentType] = r
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/proyectos/${clientId}/${projectId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Proyecto
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Resultados — {project.name}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
          {project.client.businessName} · {activeModules.length} módulo
          {activeModules.length !== 1 ? "s" : ""} contratado
          {activeModules.length !== 1 ? "s" : ""}
        </p>
      </div>

      {activeModules.length === 0 ? (
        <div
          className="py-16 text-center border"
          style={{ borderColor: "#E5E4E0", color: "#8A8A8A" }}
        >
          No hay módulos en el acuerdo.{" "}
          <Link
            href={`/proyectos/${clientId}/${projectId}/editar`}
            style={{ color: "#BD8130" }}
          >
            Editar proyecto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeModules.map((mod: typeof MODULE_OPTIONS[0]) => {
            const latest = latestResultByType[mod.value] ?? null
            return (
              <AgentPanel
                key={mod.value}
                agentType={mod.value}
                projectId={projectId}
                initialResult={
                  latest
                    ? {
                        id: latest.id,
                        status: latest.status,
                        pdfUrl: latest.pdfUrl,
                        generatedAt: latest.generatedAt?.toISOString() ?? null,
                      }
                    : null
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
