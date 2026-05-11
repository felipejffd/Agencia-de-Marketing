import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import ClientForm from "@/src/components/clients/ClientForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const client = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!client) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Clientes
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          {client.businessName}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>
          Cliente desde {new Date(client.createdAt).toLocaleDateString("es-ES")}
        </p>
      </div>

      <ClientForm
        mode="edit"
        clientId={client.id}
        defaultValues={{
          businessName: client.businessName,
          industry: client.industry ?? undefined,
          country: client.country ?? undefined,
          email: client.email ?? undefined,
          phone: client.phone ?? undefined,
          notes: client.notes ?? undefined,
        }}
      />
    </div>
  )
}
