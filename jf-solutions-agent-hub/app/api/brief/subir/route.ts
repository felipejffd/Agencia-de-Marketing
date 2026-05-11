import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

const BUCKET = "briefs-and-results"
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const formData = await req.formData()
  const projectId = formData.get("projectId") as string | null
  const file = formData.get("file") as File | null

  if (!projectId || !file) {
    return NextResponse.json({ error: "projectId y file son requeridos." }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permiten archivos PDF." }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar los 10 MB." }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId: session.user.id } },
  })
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 500 })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `uploaded/${projectId}/${timestamp}-${safeName}`
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`

  const buffer = await file.arrayBuffer()

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  })

  if (!uploadRes.ok) {
    const body = await uploadRes.text()
    console.error("Supabase upload error:", body)
    return NextResponse.json({ error: "Error al subir el archivo a Supabase." }, { status: 500 })
  }

  const fileUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`

  const uploadedBrief = await prisma.uploadedBrief.upsert({
    where: { projectId },
    create: { projectId, fileUrl },
    update: { fileUrl, uploadedAt: new Date() },
  })

  return NextResponse.json({
    fileUrl: uploadedBrief.fileUrl,
    uploadedAt: uploadedBrief.uploadedAt,
  })
}
