import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const [
    totalClients,
    totalProjects,
    activeProjects,
    completedDeliveries,
    projectsWithBrief,
    recentProjects,
  ] = await Promise.all([
    prisma.client.count({ where: { userId } }),

    prisma.project.count({ where: { client: { userId } } }),

    prisma.project.count({
      where: { client: { userId }, status: "active" },
    }),

    prisma.agentResult.count({
      where: { status: "completed", project: { client: { userId } } },
    }),

    prisma.brief.count({
      where: {
        interviewData: { not: {} },
        project: { client: { userId } },
      },
    }),

    prisma.project.findMany({
      where: { client: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: { select: { id: true, businessName: true } } },
    }),
  ])

  const conversionRate =
    totalProjects > 0 ? Math.round((projectsWithBrief / totalProjects) * 100) : 0

  const STATUS_LABELS: Record<string, string> = {
    draft: "Borrador",
    active: "Activo",
    paused: "Pausado",
    completed: "Completado",
  }

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    draft:     { color: "#6B6B6B", bg: "#F3F2EE" },
    active:    { color: "#065F46", bg: "#ECFDF5" },
    paused:    { color: "#854D0E", bg: "#FEF9C3" },
    completed: { color: "#1E40AF", bg: "#EFF6FF" },
  }

  const stats = [
    {
      label: "Clientes",
      value: totalClients,
      description: "Total registrados",
      href: "/clientes",
    },
    {
      label: "Proyectos activos",
      value: activeProjects,
      description: `de ${totalProjects} totales`,
      href: null,
    },
    {
      label: "Entregas completadas",
      value: completedDeliveries,
      description: "Resultados de agentes",
      href: null,
    },
    {
      label: "Tasa de conversión",
      value: `${conversionRate}%`,
      description: "Proyectos con brief",
      href: null,
    },
  ]

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "#0E0E0E" }}>
          Bienvenido, {session.user?.name?.split(" ")[0] ?? "Usuario"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A8A8A" }}>
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border p-5"
            style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
          >
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A8A8A" }}>
              {stat.label}
            </p>
            <p className="text-3xl font-semibold" style={{ color: "#BD8130" }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
              {stat.description}
            </p>
            {stat.href && (
              <Link
                href={stat.href}
                className="text-xs mt-2 inline-block"
                style={{ color: "#BD8130" }}
              >
                Ver todos →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#0E0E0E" }}>
            Proyectos recientes
          </h2>
          <Link
            href="/clientes/nuevo"
            className="px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
          >
            + Nuevo cliente
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div
            className="py-12 text-center border"
            style={{ borderColor: "#E5E4E0", color: "#8A8A8A" }}
          >
            <p className="text-sm mb-3">No hay proyectos aún.</p>
            <Link
              href="/clientes/nuevo"
              className="text-xs px-4 py-2 border"
              style={{ borderColor: "#BD8130", color: "#BD8130" }}
            >
              Crear primer cliente
            </Link>
          </div>
        ) : (
          <div className="border" style={{ borderColor: "#E5E4E0" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#0E0E0E", color: "#FAF9F6" }}>
                  {["Proyecto", "Cliente", "Estado", "Fecha"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project: typeof recentProjects[0], i) => {
                  const sc = STATUS_COLORS[project.status] ?? STATUS_COLORS.draft
                  return (
                    <tr
                      key={project.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#FAF9F6" : "#F3F2EE",
                        borderBottom: "1px solid #E5E4E0",
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "#0E0E0E" }}>
                        <Link
                          href={`/proyectos/${project.client.id}/${project.id}`}
                          className="hover:underline"
                          style={{ color: "#0E0E0E" }}
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#4A4A4A" }}>
                        <Link
                          href={`/clientes/${project.client.id}`}
                          className="hover:underline"
                          style={{ color: "#4A4A4A" }}
                        >
                          {project.client.businessName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 font-medium"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          {STATUS_LABELS[project.status] ?? project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B6B6B" }}>
                        {new Date(project.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
