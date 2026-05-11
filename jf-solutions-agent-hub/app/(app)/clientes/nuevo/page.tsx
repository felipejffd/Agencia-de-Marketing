import Link from "next/link"
import ClientForm from "@/src/components/clients/ClientForm"

export default function NuevoClientePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-xs uppercase tracking-wide"
          style={{ color: "#8A8A8A" }}
        >
          ← Clientes
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "#0E0E0E" }}>
          Nuevo cliente
        </h1>
      </div>

      <ClientForm mode="create" />
    </div>
  )
}
