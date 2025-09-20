import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { requireUserId } from "@/lib/auth";
import { ensureUserInDatabase } from "@/lib/user";
<<<<<<< HEAD
import { normalizeForStorage } from "@/lib/phone";
=======
import { digitsOnly, normalizeForStorage } from "@/lib/phone";
>>>>>>> ed92f3cfd883cb47dd2736c9ea353b38e3e58f4e

export async function GET() {
  try {
    const userId = await requireUserId();
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
    const name = String(body.name || "").trim();
    const phoneInput = String(body.phone || "").trim();
    const comuna = String(body.comuna || "").trim();
    const position = body.position ? String(body.position) : null;

    if (!name || !comuna) {
      return NextResponse.json({ error: "Nombre y comuna son obligatorios" }, { status: 400 });
    }
<<<<<<< HEAD

    const normalizedPhone = normalizeForStorage(phoneInput);
    const localNine = normalizedPhone ? normalizedPhone.slice(-9) : '';
    if (!normalizedPhone || localNine.length !== 9 || !localNine.startsWith('9')) {
      return NextResponse.json({ error: "Celular invalido (+56 9 XXXXXXXX)" }, { status: 400 });
    }

    const data: any = { name, phone: normalizedPhone, comuna, position };
=======
    const digits = digitsOnly(phone);
    if (!/^56?9?\d{8}$/.test(digits)) {
      return NextResponse.json({ error: "Celular inválido (+56 9 XXXXXXXX)" }, { status: 400 });
    }
    const normalizedPhone = normalizeForStorage(phone);
    const data: any = { name, phone: normalizedPhone || phone, comuna, position };
>>>>>>> ed92f3cfd883cb47dd2736c9ea353b38e3e58f4e
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
