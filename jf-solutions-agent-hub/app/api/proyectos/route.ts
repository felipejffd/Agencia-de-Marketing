import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { projectSchema } from "@/src/lib/schemas/project"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId")

  const projects = await prisma.project.findMany({
    where: {
      client: { userId: session.user.id },
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { businessName: true } } },
  })

  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const body = await req.json()
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { clientId, name, status, agreement } = parsed.data

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
  })
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 })
  }

  const project = await prisma.project.create({
    data: { clientId, name, status, agreement },
  })

  return NextResponse.json(project, { status: 201 })
}
