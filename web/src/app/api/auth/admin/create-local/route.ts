import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setDevPassword } from "@/lib/auth-local";

// Endpoint de ayuda para desarrollo: crea/actualiza un usuario admin y asigna contraseña en memoria.
// POST body: { email: string, password: string, id?: string }
// NO usar en producción.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const id = String(body?.id || crypto.randomUUID());
    if (!email || !password) return NextResponse.json({ error: "email y password son requeridos" }, { status: 400 });

    const user = await prisma.user.upsert({
      where: { id },
      update: { email, isAdmin: true },
      create: { id, email, isAdmin: true },
    });

    // Asegurar profile mínimo
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { name: "Admin", phone: "+56900000000", comuna: "Santiago" },
      create: { userId: user.id, name: "Admin", phone: "+56900000000", comuna: "Santiago" },
    });

    // Establecer contraseña en memoria (solo dev)
    try { setDevPassword(email, password); } catch (e) { /* silent */ }

    return NextResponse.json({ ok: true, id: user.id, email, note: "Recuerda reiniciar dev server si usas env changes" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}





