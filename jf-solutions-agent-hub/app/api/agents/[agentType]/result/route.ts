import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { isValidAgentType } from "@/src/lib/agent-prompts"

type Params = { params: Promise<{ agentType: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { agentType } = await params
  if (!isValidAgentType(agentType)) {
    return NextResponse.json({ error: "Tipo de agente inválido." }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId requerido." }, { status: 400 })
  }

  const result = await prisma.agentResult.findFirst({
    where: {
      projectId,
      agentType,
      project: { client: { userId: session.user.id } },
    },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      status: true,
      pdfUrl: true,
      generatedAt: true,
      errorMessage: true,
    },
  })

  return NextResponse.json(result ?? null)
}
