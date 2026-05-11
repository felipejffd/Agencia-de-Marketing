"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface SidebarProps {
  items: NavItem[]
}

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col w-60 min-h-screen shrink-0"
      style={{ backgroundColor: "#0E0E0E" }}
    >
      <div
        className="h-14 flex items-center px-6 border-b"
        style={{ borderColor: "#1F1F1F" }}
      >
        <span
          className="text-base font-semibold tracking-wide"
          style={{ color: "#FAF9F6" }}
        >
          JF Solutions
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                color: active ? "#FAF9F6" : "#8A8A8A",
                backgroundColor: active ? "#BD8130" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#FAF9F6"
                  e.currentTarget.style.backgroundColor = "#1F1F1F"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#8A8A8A"
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
