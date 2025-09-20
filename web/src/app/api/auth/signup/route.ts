import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { setPasswordHash } from "@/lib/auth-password";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { normalizeForStorage } from "@/lib/phone";
import { createVerificationCode, sendVerificationEmail } from "@/lib/email-verification";

const rl = createRateLimiter({ name: "auth_signup", limit: 5, windowSec: 300 });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { ok: false, error: "Limite de registros alcanzado. Intenta mas tarde." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();
    const lastName = body?.lastName ? String(body.lastName) : null;
    const comuna = String(body?.comuna || "");
    const position = body?.position ? String(body.position) : null;
    const rawPhone = body?.phone ? String(body.phone) : "";
    const defaultPhone = normalizeForStorage("+56 9 1234 5678") ?? "56900000000";
    const phone = normalizeForStorage(rawPhone) ?? defaultPhone;

    if (!email || !password || !name || !comuna) {
      return NextResponse.json(
        { ok: false, error: "Completa email, contrasena, nombre y comuna" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Este correo ya esta registrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = [name, lastName].filter(Boolean).join(" ");

    // Crear usuario y marcar email como verificado inmediatamente para evitar el
    // flujo de verificación por ahora.
    const user = await prisma.user.create({
      data: {
        email,
        isAdmin: false,
        profile: {
          create: {
            name: fullName || name,
            phone,
            comuna,
            position: position as any,
          },
        },
      },
      select: { id: true, email: true, profile: { select: { name: true } } },
    });

    try {
      await setPasswordHash(user.id, passwordHash);
    } catch {}

    // Respondemos indicando éxito y omitiendo el paso de verificación.
    return NextResponse.json({ ok: true, requiresVerification: false, email });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "No se pudo crear la cuenta" },
      { status: 500 }
    );
  }
}
