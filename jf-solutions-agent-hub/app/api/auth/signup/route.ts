import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { hashPassword } from "@/src/lib/password"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email." },
        { status: 409 }
      )
    }

    const hashed = hashPassword(password)

    // TODO: Uncomment when DB is working
// await prisma.user.create({
//   data: { email, password: hashedPassword, name },
// });

return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
