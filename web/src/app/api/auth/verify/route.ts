import { NextRequest, NextResponse } from "next/server";
import { verifyCode, normalizePhone } from "@/lib/sms-dev";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log(`[verify] received: ${JSON.stringify(body)}`);
    const phone = body?.phone;
    const code = body?.code;
    if (!phone || !code) return NextResponse.json({ ok: false, error: "Phone or code missing" }, { status: 400 });

    const v = verifyCode(phone, String(code));
    console.log(`[verify] verification result: ${JSON.stringify(v)}`);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error || "Código inválido" }, { status: 400 });

    // Si el código es válido, intentar encontrar el usuario (match por phone normalizado o últimos 8)
    const normalized = normalizePhone(phone);
    let user = null;
    try {
      // Buscar exacto
      user = await prisma.user.findFirst({ where: { phone: normalized } });
      if (!user) {
        // fallback por últimos 8
        const candidates = await prisma.user.findMany();
        user = candidates.find((u: any) => (String(u.phone || "").replace(/\D+/g, "").slice(-8) === normalized.slice(-8))) || null;
      }
    } catch (e) {
      console.log(`[verify] prisma lookup error: ${String(e)}`);
    }

    if (user) {
      try {
        // Si el usuario viene de Prisma (DB real), crear sesión en memoria via auth-local si está disponible
        // Import dinámico para evitar ciclos
        try {
          const { createSession } = await import("@/lib/auth-local");
          const sid = createSession(user as any);
          const res = NextResponse.json({ ok: true, user });
          res.cookies.set("session_id", sid, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
          res.cookies.set("uid", user.id, { path: "/", maxAge: 60 * 60 * 24 * 30 });
          return res;
        } catch (e) {
          // fallback: devolver user sin sesión
          return NextResponse.json({ ok: true, user });
        }
      } catch (e) {
        return NextResponse.json({ ok: true, user });
      }
    }

    return NextResponse.json({ ok: true, needsSignup: true });
  } catch (err: any) {
    console.log(`[verify] handler error: ${String(err)}`);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
