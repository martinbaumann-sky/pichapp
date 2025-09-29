import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { getPasswordHash } from "@/lib/auth-password";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";

const rl = createRateLimiter({ name: "venue_login", limit: 8, windowSec: 60 });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu correo y contraseña." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        emailVerifiedAt: true,
        profile: { select: { name: true, comuna: true, position: true } },
      },
    });

    if (!user || (user.role !== "VENUE_ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Este correo no corresponde a una cuenta de cancha." },
        { status: 403 },
      );
    }

    let hash: string | null = null;
    try {
      hash = await getPasswordHash(user.id);
    } catch {}
    if (!hash && (user as any).passwordHash) {
      hash = (user as any).passwordHash as string;
    }
    if (!hash) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await createSession(user.id);
    const res = NextResponse.json({ ok: true, user: sanitizeUser(user) });
    attachSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error("[venue/login]", err);
    return NextResponse.json(
      { error: "No pudimos iniciar sesión. Intenta nuevamente." },
      { status: 500 },
    );
  }
}

function sanitizeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    role: (u.role ?? "PLAYER").toLowerCase(),
    emailVerified: !!u.emailVerifiedAt,
    isAdmin: !!u.isAdmin,
    name: u.profile?.name || null,
    comuna: u.profile?.comuna || null,
    position: u.profile?.position || null,
  };
}
