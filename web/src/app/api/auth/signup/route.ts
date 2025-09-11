import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { setPasswordHash } from "@/lib/auth-password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();
    const lastName = body?.lastName ? String(body.lastName) : null;
    const comuna = String(body?.comuna || "");
    const position = body?.position ? String(body.position) : null;
    const phone = body?.phone ? String(body.phone) : "+56 9 1234 5678";
    const birthday = body?.birthday ? String(body.birthday) : null;
    const gender = body?.gender ? String(body.gender) : null;

    if (!email || !password || !name || !comuna) {
      return NextResponse.json({ ok: false, error: "Completa email, contraseña, nombre y comuna" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return NextResponse.json({ ok: false, error: "Este correo ya está registrado" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        isAdmin: false,
        profile: {
          create: {
            name,
            phone,
            comuna,
            position: position as any,
          },
        },
      },
      select: { id: true, email: true, isAdmin: true, profile: { select: { name: true, comuna: true, position: true } } },
    });

    // Persist hash in auxiliary table to avoid DB migrations in dev
    try { await setPasswordHash(user.id, passwordHash); } catch {}

    const token = await createSession(user.id);
    const res = NextResponse.json({ ok: true, user: sanitizeUser(user) });
    attachSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "No se pudo crear la cuenta" }, { status: 500 });
  }
}

function sanitizeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    isAdmin: !!u.isAdmin,
    name: u.profile?.name || null,
    comuna: u.profile?.comuna || null,
    position: u.profile?.position || null,
  };
}
