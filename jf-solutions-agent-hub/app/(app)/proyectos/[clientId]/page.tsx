import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import ProjectCard from "@/src/components/projects/ProjectCard"

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ProyectosClientePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { clientId } = await params

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
  })
  if (!client) notFound()

  const projects = await prisma.project.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/clientes"
            className="text-xs uppercase tracking-wide"
            style={{ color: "#8A8A8A" }}
          >
            ← Clientes
          </Link>
          <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
            Proyectos — {client.businessName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
            {projects.length} proyecto{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/proyectos/${clientId}/nuevo`}
          className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
        >
          + Nuevo proyecto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div
          className="py-16 text-center border"
          style={{ borderColor: "#E5E4E0", color: "#8A8A8A" }}
        >
          No hay proyectos para este cliente. Crea el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p: typeof projects[0]) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              clientId={clientId}
              clientName={client.businessName}
              status={p.status}
              agreement={p.agreement as { modules: string[]; startDate?: string; endDate?: string; value?: number }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
