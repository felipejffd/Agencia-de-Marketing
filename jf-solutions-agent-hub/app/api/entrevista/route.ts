import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { streamText } from "ai"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { claude } from "@/src/lib/anthropic"

const SYSTEM_PROMPT = `Eres un agente especializado en marketing digital. Conduces entrevistas estructuradas para entender el negocio de un cliente y crear un brief de marketing completo.

Sigue este orden de preguntas, una a la vez, adaptando el lenguaje según las respuestas:
1. ¿Cuál es el negocio y qué problema resuelve para sus clientes?
2. ¿Quién es su cliente ideal? (edad, perfil, necesidades)
3. ¿Cuál es la meta principal del proyecto? (ventas, visibilidad, comunidad…)
4. ¿Tienen alguna idea o concepto creativo que quieran explorar?
5. ¿Qué tono de comunicación prefieren? (profesional, cercano, aspiracional, humorístico…)
6. ¿Quiénes son sus principales competidores y qué los diferencia?

Después de la última respuesta, genera un resumen estructurado en JSON con esta forma exacta, precedido por la etiqueta [BRIEF_DATA]:
[BRIEF_DATA]
{
  "businessDescription": "...",
  "targetAudience": "...",
  "mainGoal": "...",
  "creativeIdea": "...",
  "tone": "...",
  "competitors": "...",
  "additionalNotes": "..."
}

Responde siempre en español. Sé conciso y amigable.`

type ChatMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, messages = [] } = body as {
    projectId: string
    messages: ChatMessage[]
  }

  if (!projectId) {
    return NextResponse.json({ error: "projectId requerido." }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId: session.user.id } },
  })
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  const lastUserMessage = messages.at(-1)

  const result = streamText({
    model: claude,
    system: SYSTEM_PROMPT,
    messages,
    onFinish: async ({ text }) => {
      const saves: Array<{ projectId: string; role: string; message: string }> = []

      if (lastUserMessage?.role === "user") {
        saves.push({ projectId, role: "user", message: lastUserMessage.content })
      }
      saves.push({ projectId, role: "assistant", message: text })

      await prisma.conversationLog.createMany({ data: saves })

      const briefMatch = text.match(/\[BRIEF_DATA\]\s*(\{[\s\S]*?\})\s*$/)
      if (briefMatch) {
        try {
          const interviewData = JSON.parse(briefMatch[1])
          await prisma.brief.upsert({
            where: { projectId },
            create: { projectId, interviewData },
            update: { interviewData, updatedAt: new Date() },
          })
        } catch {
          // JSON parse failed — skip brief creation
        }
      }
    },
  })

  return result.toTextStreamResponse()
}
