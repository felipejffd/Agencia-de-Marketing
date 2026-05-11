"use client"

import { useState } from "react"

interface BriefActionsProps {
  projectId: string
  existingPdfUrl: string | null
}

export default function BriefActions({ projectId, existingPdfUrl }: BriefActionsProps) {
  const [loading, setLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(existingPdfUrl)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true)
    setError("")

    const res = await fetch("/api/brief/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Error al generar el PDF.")
      return
    }

    setPdfUrl(data.pdfUrl)
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm px-3 py-2" style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
        >
          {loading
            ? "Generando PDF..."
            : pdfUrl
            ? "Regenerar Brief PDF"
            : "Generar Brief PDF"}
        </button>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm font-medium border transition-colors"
            style={{ borderColor: "#0E0E0E", color: "#0E0E0E" }}
          >
            Descargar PDF ↗
          </a>
        )}
      </div>

      {pdfUrl && (
        <p className="text-xs" style={{ color: "#8A8A8A" }}>
          PDF disponible. Haz clic en "Descargar" para abrirlo.
        </p>
      )}
    </div>
  )
}
