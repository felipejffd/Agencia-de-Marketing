import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import BriefActions from "./BriefActions"

interface Props {
  params: Promise<{ clientId: string; projectId: string }>
}

export default async function BriefPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { clientId, projectId } = await params

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId, client: { userId: session.user.id } },
    include: {
      client: { select: { businessName: true } },
      brief: true,
    },
  })

  if (!project) notFound()

  const brief = project.brief
  const interviewData = brief?.interviewData as Record<string, string> | null

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/proyectos/${clientId}/${projectId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Proyecto
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Brief — {project.name}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
          {project.client.businessName}
        </p>
      </div>

      {!brief || !interviewData ? (
        <div
          className="border p-8 text-center"
          style={{ borderColor: "#E5E4E0" }}
        >
          <p className="text-sm mb-4" style={{ color: "#4A4A4A" }}>
            No hay datos de entrevista aún.
          </p>
          <Link
            href={`/proyectos/${clientId}/${projectId}/entrevista`}
            className="px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
          >
            Completar entrevista
          </Link>
        </div>
      ) : (
        <>
          {/* Interview data preview */}
          <div
            className="border p-6 mb-6 space-y-5"
            style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
          >
            {[
              { key: "businessDescription", label: "Descripción del negocio" },
              { key: "targetAudience", label: "Audiencia objetivo" },
              { key: "mainGoal", label: "Meta principal" },
              { key: "creativeIdea", label: "Idea creativa" },
              { key: "tone", label: "Tono de comunicación" },
              { key: "competitors", label: "Competidores" },
              { key: "additionalNotes", label: "Notas adicionales" },
            ].map(({ key, label }: { key: string; label: string }) =>
              interviewData[key] ? (
                <div key={key}>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "#BD8130" }}
                  >
                    {label}
                  </p>
                  <p className="text-sm" style={{ color: "#0E0E0E" }}>
                    {interviewData[key]}
                  </p>
                </div>
              ) : null
            )}
          </div>

          {/* Actions */}
          <BriefActions projectId={projectId} existingPdfUrl={brief.pdfUrl ?? null} />
        </>
      )}
    </div>
  )
}
