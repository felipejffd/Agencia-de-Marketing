"use client"

import { useState, useRef } from "react"
import { AGENT_LABELS } from "@/src/lib/agent-prompts"

interface AgentResult {
  id: string
  status: string
  pdfUrl: string | null
  generatedAt: string | null
}

interface AgentPanelProps {
  agentType: string
  projectId: string
  initialResult: AgentResult | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pendiente",  bg: "#F3F2EE", color: "#6B6B6B" },
  running:   { label: "Generando…", bg: "#FEF9C3", color: "#854D0E" },
  completed: { label: "Completado", bg: "#ECFDF5", color: "#065F46" },
  failed:    { label: "Error",      bg: "#FEF2F2", color: "#DC2626" },
}

const ID_MARKER_RE = /^__ID__([^_]+)__END__\n?/

export default function AgentPanel({ agentType, projectId, initialResult }: AgentPanelProps) {
  const label = AGENT_LABELS[agentType] ?? agentType

  const [result, setResult] = useState<AgentResult | null>(initialResult)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [error, setError] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling(resultId: string) {
    pollRef.current = setInterval(async () => {
      const res = await fetch(
        `/api/agents/${agentType}/result?projectId=${projectId}`
      )
      if (!res.ok) return
      const data: AgentResult = await res.json()
      if (data?.status === "completed" || data?.status === "failed") {
        setResult(data)
        stopPolling()
      }
    }, 3000)
  }

  async function handleGenerate() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setError("")
    setStreamText("")
    setStreaming(true)
    setResult((prev) => prev ? { ...prev, status: "running" } : null)

    try {
      const res = await fetch(`/api/agents/${agentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Error al iniciar el agente.")
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let resultId: string | null = null
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Extract result ID from first line
        if (!resultId) {
          const match = buffer.match(ID_MARKER_RE)
          if (match) {
            resultId = match[1]
            buffer = buffer.slice(match[0].length)
            startPolling(resultId)
          } else {
            continue
          }
        }

        setStreamText(buffer)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("La conexión fue interrumpida.")
      }
    } finally {
      setStreaming(false)
    }
  }

  const currentStatus = streaming ? "running" : (result?.status ?? "pending")
  const statusStyle = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.pending

  return (
    <div
      className="border flex flex-col"
      style={{ borderColor: "#E5E4E0", backgroundColor: "#FAF9F6" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#E5E4E0", backgroundColor: "#0E0E0E" }}
      >
        <span className="text-sm font-medium" style={{ color: "#FAF9F6" }}>
          {label}
        </span>
        <span
          className="text-xs px-2 py-0.5 font-medium"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 min-h-[120px]">
        {error && (
          <p className="text-xs mb-3" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}

        {(streaming || streamText) && (
          <div
            className="text-xs font-mono overflow-y-auto max-h-48 whitespace-pre-wrap mb-3"
            style={{ color: "#0E0E0E" }}
          >
            {streamText}
            {streaming && <span style={{ color: "#BD8130" }}>▋</span>}
          </div>
        )}

        {!streaming && !streamText && currentStatus === "completed" && result?.generatedAt && (
          <p className="text-xs" style={{ color: "#8A8A8A" }}>
            Generado el{" "}
            {new Date(result.generatedAt).toLocaleDateString("es-ES")}
          </p>
        )}

        {!streaming && !streamText && currentStatus === "pending" && (
          <p className="text-xs" style={{ color: "#8A8A8A" }}>
            Haz clic en "Generar" para ejecutar este agente.
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-t"
        style={{ borderColor: "#E5E4E0" }}
      >
        <button
          onClick={handleGenerate}
          disabled={streaming}
          className="px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
        >
          {streaming ? "Generando…" : result?.status === "completed" ? "Regenerar" : "Generar"}
        </button>

        {result?.pdfUrl && !streaming && (
          <a
            href={result.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium border transition-colors"
            style={{ borderColor: "#D1CFC9", color: "#4A4A4A" }}
          >
            Descargar PDF ↗
          </a>
        )}
      </div>
    </div>
  )
}
