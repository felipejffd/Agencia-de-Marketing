import React from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import BriefPDF from "@/src/components/brief/BriefPDF"

interface GenerateBriefPDFOptions {
  clientName: string
  projectName: string
  projectId: string
  interviewData: Record<string, string>
}

const BUCKET = "briefs-and-results"

async function uploadToSupabase(buffer: Buffer, path: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase env vars not configured.")
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase upload failed (${res.status}): ${body}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`
}

export async function generateBriefPDF({
  clientName,
  projectName,
  projectId,
  interviewData,
}: GenerateBriefPDFOptions): Promise<string> {
  const generatedAt = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const element = React.createElement(BriefPDF, {
    clientName,
    projectName,
    generatedAt,
    interviewData,
  }) as React.ReactElement<DocumentProps>

  const buffer = await renderToBuffer(element)

  const timestamp = Date.now()
  const path = `briefs/${projectId}/brief-${timestamp}.pdf`

  const publicUrl = await uploadToSupabase(buffer, path)
  return publicUrl
}
