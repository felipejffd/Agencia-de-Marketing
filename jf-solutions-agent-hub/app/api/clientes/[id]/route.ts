import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { clientSchema } from "@/src/lib/schemas/client"

type Params = { params: Promise<{ id: string }> }

async function getOwnedClient(id: string, userId: string) {
  return prisma.client.findFirst({ where: { id, userId } })
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const client = await getOwnedClient(id, session.user.id)
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedClient(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const updated = await prisma.client.update({
    where: { id },
    data: {
      businessName: data.businessName,
      industry: data.industry ?? null,
      country: data.country ?? null,
      email: data.email || null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedClient(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 })
  }

  await prisma.client.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
