import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { clientSchema } from "@/src/lib/schemas/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

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

  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
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
  const client = await prisma.client.create({
    data: {
      userId: session.user.id,
      businessName: data.businessName,
      industry: data.industry ?? null,
      country: data.country ?? null,
      email: data.email || null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    },
  })

  return NextResponse.json(client, { status: 201 })
}
