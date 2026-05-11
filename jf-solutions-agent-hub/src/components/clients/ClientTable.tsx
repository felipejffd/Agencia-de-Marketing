"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Client {
  id: string
  businessName: string
  industry: string | null
  country: string | null
  email: string | null
  phone: string | null
}

interface ClientTableProps {
  clients: Client[]
}

export default function ClientTable({ clients }: ClientTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(id)
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
    setDeletingId(null)

    if (res.ok) {
      router.refresh()
    }
  }

  if (clients.length === 0) {
    return (
      <div
        className="py-16 text-center border"
        style={{ borderColor: "#E5E4E0", color: "#8A8A8A" }}
      >
        No hay clientes aún. Crea el primero.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#0E0E0E", color: "#FAF9F6" }}>
            {["Negocio", "Industria", "País", "Email", "Teléfono", "Acciones"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client, i) => (
            <tr
              key={client.id}
              style={{
                backgroundColor: i % 2 === 0 ? "#FAF9F6" : "#F3F2EE",
                borderBottom: "1px solid #E5E4E0",
              }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: "#0E0E0E" }}>
                {client.businessName}
              </td>
              <td className="px-4 py-3" style={{ color: "#4A4A4A" }}>
                {client.industry ?? "—"}
              </td>
              <td className="px-4 py-3" style={{ color: "#4A4A4A" }}>
                {client.country ?? "—"}
              </td>
              <td className="px-4 py-3" style={{ color: "#4A4A4A" }}>
                {client.email ?? "—"}
              </td>
              <td className="px-4 py-3" style={{ color: "#4A4A4A" }}>
                {client.phone ?? "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    href={`/clientes/${client.id}`}
                    className="px-3 py-1 text-xs font-medium border transition-colors"
                    style={{ borderColor: "#BD8130", color: "#BD8130" }}
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id, client.businessName)}
                    disabled={deletingId === client.id}
                    className="px-3 py-1 text-xs font-medium border transition-colors disabled:opacity-50"
                    style={{ borderColor: "#DC2626", color: "#DC2626" }}
                  >
                    {deletingId === client.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
