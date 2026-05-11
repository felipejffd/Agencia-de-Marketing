"use client"

import { signOut } from "next-auth/react"

interface HeaderProps {
  userName: string
  userEmail: string
}

export default function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 border-b shrink-0"
      style={{ backgroundColor: "#FAF9F6", borderColor: "#E5E4E0" }}
    >
      <div />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-none" style={{ color: "#0E0E0E" }}>
            {userName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8A8A" }}>
            {userEmail}
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-3 py-1.5 text-xs font-medium border transition-colors"
          style={{
            color: "#0E0E0E",
            borderColor: "#D1CFC9",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0E0E0E"
            e.currentTarget.style.color = "#FAF9F6"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = "#0E0E0E"
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
