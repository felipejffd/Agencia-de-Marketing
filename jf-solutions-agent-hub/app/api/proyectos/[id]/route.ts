import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { projectSchema } from "@/src/lib/schemas/project"

type Params = { params: Promise<{ id: string }> }

async function getOwnedProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, client: { userId } },
    include: { client: { select: { id: true, businessName: true } } },
  })
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const project = await getOwnedProject(id, session.user.id)
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedProject(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = projectSchema.safeParse({ ...body, clientId: existing.clientId })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, status, agreement } = parsed.data
  const updated = await prisma.project.update({
    where: { id },
    data: { name, status, agreement },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await params
  const existing = await getOwnedProject(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
