import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { streamText } from "ai"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { claude } from "@/src/lib/anthropic"
import {
  isValidAgentType,
  getAgentPrompt,
} from "@/src/lib/agent-prompts"
import { generateAgentPDF } from "@/src/lib/agent-pdf-generator"

type Params = { params: Promise<{ agentType: string }> }

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { agentType } = await params

  if (!isValidAgentType(agentType)) {
    return NextResponse.json({ error: "Tipo de agente inválido." }, { status: 400 })
  }

  const { projectId } = await req.json()
  if (!projectId) {
    return NextResponse.json({ error: "projectId requerido." }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId: session.user.id } },
    include: {
      client: { select: { businessName: true } },
      brief: true,
      uploadedBrief: true,
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  const agreement = project.agreement as { modules: string[] }
  if (!agreement.modules.includes(agentType)) {
    return NextResponse.json(
      { error: `El módulo "${agentType}" no está incluido en el acuerdo.` },
      { status: 403 }
    )
  }

  const interviewData = (project.brief?.interviewData ?? {}) as Record<string, string>

  const prompt = getAgentPrompt(agentType, {
    ...interviewData,
    uploadedContent: project.uploadedBrief?.content ?? undefined,
  })

  // Create result record before streaming
  const agentResult = await prisma.agentResult.create({
    data: { projectId, agentType, status: "running" },
  })

  const streamResult = streamText({
    model: claude,
    prompt,
    onFinish: async ({ text }) => {
      try {
        const pdfUrl = await generateAgentPDF({
          agentType,
          clientName: project.client.businessName,
          projectName: project.name,
          projectId,
          resultId: agentResult.id,
          content: text,
        })
        await prisma.agentResult.update({
          where: { id: agentResult.id },
          data: {
            content: text,
            pdfUrl,
            status: "completed",
            generatedAt: new Date(),
          },
        })
      } catch (err) {
        console.error("Agent PDF generation error:", err)
        await prisma.agentResult.update({
          where: { id: agentResult.id },
          data: {
            status: "failed",
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          },
        })
      }
    },
  })

  // Prepend result ID marker then pipe Claude's text stream
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  ;(async () => {
    await writer.write(encoder.encode(`__ID__${agentResult.id}__END__\n`))
    for await (const chunk of streamResult.textStream) {
      await writer.write(encoder.encode(chunk))
    }
    await writer.close()
  })()

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
