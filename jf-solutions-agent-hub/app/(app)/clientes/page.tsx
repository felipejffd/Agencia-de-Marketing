import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import ClientTable from "@/src/components/clients/ClientTable"

export default async function ClientesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      industry: true,
      country: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#0E0E0E" }}>
            Clientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado
            {clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
        >
          + Nuevo cliente
        </Link>
      </div>

      <ClientTable clients={clients} />
    </div>
  )
}
