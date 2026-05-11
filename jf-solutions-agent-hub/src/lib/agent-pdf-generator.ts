import React from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import AgentResultPDF from "@/src/components/agents/AgentResultPDF"
import { AGENT_LABELS } from "@/src/lib/agent-prompts"

const BUCKET = "briefs-and-results"

interface GenerateAgentPDFOptions {
  agentType: string
  clientName: string
  projectName: string
  projectId: string
  resultId: string
  content: string
}

export async function generateAgentPDF({
  agentType,
  clientName,
  projectName,
  projectId,
  resultId,
  content,
}: GenerateAgentPDFOptions): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase env vars not configured.")

  const agentLabel = AGENT_LABELS[agentType] ?? agentType

  const generatedAt = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const element = React.createElement(AgentResultPDF, {
    agentLabel,
    clientName,
    projectName,
    generatedAt,
    content,
  }) as React.ReactElement<DocumentProps>

  const buffer = await renderToBuffer(element)

  const timestamp = Date.now()
  const path = `agent-results/${projectId}/${agentType}-${resultId}-${timestamp}.pdf`
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`

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
    throw new Error(`Supabase upload failed (${uploadRes.status}): ${body}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`
}
