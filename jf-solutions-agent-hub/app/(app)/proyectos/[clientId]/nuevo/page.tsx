import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import ProjectForm from "@/src/components/projects/ProjectForm"

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function NuevoProyectoPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { clientId } = await params

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
  })
  if (!client) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/proyectos/${clientId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Proyectos de {client.businessName}
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Nuevo proyecto
        </h1>
      </div>

      <ProjectForm mode="create" clientId={clientId} />
    </div>
  )
}
