import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/src/lib/auth"
import Sidebar from "@/src/components/layout/Sidebar"
import Header from "@/src/components/layout/Header"

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clientes", href: "/clientes" },
  { label: "Proyectos", href: "/proyectos" },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FAF9F6" }}>
      <Sidebar items={navItems} />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          userName={session.user?.name ?? "Usuario"}
          userEmail={session.user?.email ?? ""}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
