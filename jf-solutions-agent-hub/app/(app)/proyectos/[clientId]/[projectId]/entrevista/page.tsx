"use client"

import { useState, useRef, useEffect, use } from "react"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Props {
  params: Promise<{ clientId: string; projectId: string }>
}

export default function EntrevistaPage({ params }: Props) {
  const { clientId, projectId } = use(params)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const [briefSaved, setBriefSaved] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendToApi(history: Message[]) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStreaming(true)

    // Add placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/entrevista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, messages: history }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Error al conectar con el agente. Intenta de nuevo.",
          }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: fullText }
          return updated
        })
      }

      if (fullText.includes("[BRIEF_DATA]")) {
        setBriefSaved(true)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: "La conexión fue interrumpida.",
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  function startInterview() {
    setStarted(true)
    sendToApi([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const newHistory = [...messages, userMessage]
    setInput("")
    setMessages(newHistory)
    await sendToApi(newHistory)
  }

  const interviewDone = briefSaved

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <Link
          href={`/proyectos/${clientId}/${projectId}`}
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Proyecto
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Entrevista
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#8A8A8A" }}>
          El agente te hará preguntas para generar el brief de marketing.
        </p>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto border p-4 space-y-4 mb-4"
        style={{ borderColor: "#E5E4E0", backgroundColor: "#FAFAF8" }}
      >
        {!started && (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={startInterview}
              className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
            >
              Iniciar entrevista
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] px-4 py-3 text-sm whitespace-pre-wrap"
              style={
                msg.role === "user"
                  ? { backgroundColor: "#0E0E0E", color: "#FAF9F6" }
                  : { backgroundColor: "#FFFFFF", color: "#0E0E0E", border: "1px solid #E5E4E0" }
              }
            >
              {msg.role === "assistant" && msg.content.includes("[BRIEF_DATA]")
                ? msg.content.split("[BRIEF_DATA]")[0].trim()
                : msg.content}
              {msg.role === "assistant" && msg.content === "" && streaming && (
                <span style={{ color: "#BD8130" }}>▋</span>
              )}
            </div>
          </div>
        ))}

        {interviewDone && (
          <div
            className="text-sm px-4 py-3 text-center"
            style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}
          >
            ✓ Entrevista completada. El brief ha sido guardado automáticamente.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {started && !interviewDone && (
        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            placeholder={streaming ? "El agente está escribiendo..." : "Tu respuesta…"}
            className="flex-1 px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#BD8130]"
            style={{
              borderColor: "#D1CFC9",
              color: "#0E0E0E",
              backgroundColor: streaming ? "#F5F4F0" : "#FFFFFF",
            }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#BD8130", color: "#FAF9F6" }}
          >
            Enviar
          </button>
        </form>
      )}

      {interviewDone && (
        <div className="shrink-0 flex gap-3">
          <Link
            href={`/proyectos/${clientId}/${projectId}`}
            className="px-5 py-2 text-sm font-medium"
            style={{ backgroundColor: "#0E0E0E", color: "#FAF9F6" }}
          >
            Ver proyecto
          </Link>
          <Link
            href={`/proyectos/${clientId}/${projectId}/brief`}
            className="px-5 py-2 text-sm font-medium border"
            style={{ borderColor: "#BD8130", color: "#BD8130" }}
          >
            Ver brief generado
          </Link>
        </div>
      )}
    </div>
  )
}
