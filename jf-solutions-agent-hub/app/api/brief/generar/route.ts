import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { generateBriefPDF } from "@/src/lib/pdf-generator"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { projectId } = await req.json()
  if (!projectId) {
    return NextResponse.json({ error: "projectId requerido." }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId: session.user.id } },
    include: { client: { select: { businessName: true } }, brief: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  if (!project.brief?.interviewData) {
    return NextResponse.json(
      { error: "Completa la entrevista antes de generar el brief." },
      { status: 422 }
    )
  }

  try {
    const pdfUrl = await generateBriefPDF({
      clientName: project.client.businessName,
      projectName: project.name,
      projectId: project.id,
      interviewData: project.brief.interviewData as Record<string, string>,
    })

    await prisma.brief.update({
      where: { projectId },
      data: { pdfUrl },
    })

    return NextResponse.json({ pdfUrl })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json(
      { error: "Error al generar el PDF. Verifica la configuración de Supabase." },
      { status: 500 }
    )
  }
}
