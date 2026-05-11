"use client"

import { useState, useRef, use } from "react"
import Link from "next/link"

interface Props {
  params: Promise<{ clientId: string; projectId: string }>
}

export default function SubirBriefPage({ params }: Props) {
  const { clientId, projectId } = use(params)

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<"idle" | "uploading" | "done">("idle")
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const selected = e.target.files?.[0] ?? null
    if (!selected) return

    if (selected.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.")
      setFile(null)
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("El archivo no puede superar los 10 MB.")
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setError("")
    setLoading(true)
    setProgress("uploading")

    const formData = new FormData()
    formData.append("projectId", projectId)
    formData.append("file", file)

    const res = await fetch("/api/brief/subir", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Error al subir el archivo.")
      setProgress("idle")
      return
    }

    setFileUrl(data.fileUrl)
    setUploadedAt(new Date(data.uploadedAt).toLocaleDateString("es-ES"))
    setProgress("done")
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href={`/proyectos/${clientId}/${projectId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Proyecto
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Subir Brief diligenciado
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
          Solo PDF, máximo 10 MB.
        </p>
      </div>

      {progress === "done" ? (
        <div
          className="border p-6 space-y-4"
          style={{ borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" }}
        >
          <p className="text-sm font-medium" style={{ color: "#065F46" }}>
            ✓ Brief subido correctamente{uploadedAt ? ` · ${uploadedAt}` : ""}
          </p>
          <div className="flex gap-3">
            <a
              href={fileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium border"
              style={{ borderColor: "#0E0E0E", color: "#0E0E0E" }}
            >
              Ver PDF ↗
            </a>
            <button
              onClick={() => {
                setProgress("idle")
                setFile(null)
                setError("")
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="px-4 py-2 text-sm font-medium border"
              style={{ borderColor: "#D1CFC9", color: "#6B6B6B" }}
            >
              Re-subir
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            style={{
              borderColor: file ? "#BD8130" : "#D1CFC9",
              backgroundColor: file ? "#FDF6EC" : "#FAF9F6",
            }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div>
                <p className="text-sm font-medium" style={{ color: "#BD8130" }}>
                  {file.name}
                </p>
                <p className="text-xs mt-1" style={{ color: "#8A8A8A" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm" style={{ color: "#4A4A4A" }}>
                  Haz clic para seleccionar un PDF
                </p>
                <p className="text-xs mt-1" style={{ color: "#8A8A8A" }}>
                  Máximo 10 MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <p
              className="text-sm px-3 py-2"
              style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}
            >
              {error}
            </p>
          )}

          {/* Progress bar */}
          {progress === "uploading" && (
            <div className="w-full h-1" style={{ backgroundColor: "#E5E4E0" }}>
              <div
                className="h-1 animate-pulse"
                style={{ width: "60%", backgroundColor: "#BD8130" }}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className="px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
            >
              {loading ? "Subiendo..." : "Subir PDF"}
            </button>
            <Link
              href={`/proyectos/${clientId}/${projectId}`}
              className="px-5 py-2 text-sm font-medium border"
              style={{ borderColor: "#D1CFC9", color: "#6B6B6B" }}
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
