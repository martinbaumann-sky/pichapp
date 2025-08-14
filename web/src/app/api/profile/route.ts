import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { ensureUserInDatabase } from "@/lib/user";

export async function GET() {
  try {
    const userId = await requireUserId();
    // asegurar usuario creado
    await ensureUserInDatabase({ id: userId, email: null });
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    // Server-side validation
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const comuna = String(body.comuna || "").trim();
    const position = body.position ? String(body.position) : null;
    if (!name || !comuna) {
      return NextResponse.json({ error: "Nombre y comuna son obligatorios" }, { status: 400 });
    }
    const digits = phone.replace(/\D/g, "");
    if (!/^56?9?\d{8}$/.test(digits)) {
      return NextResponse.json({ error: "Celular inválido (+56 9 XXXXXXXX)" }, { status: 400 });
    }
    const data: any = { name, phone, comuna, position };
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}


