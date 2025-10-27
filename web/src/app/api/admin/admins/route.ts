import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildEmailLookupWhere } from "@/lib/email-normalization";

export async function POST(request: Request) {
  try {
    const actorId = await requireUserId();
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true, isAdmin: true },
    });

    if (!actor || (actor.role !== "SUPERADMIN" && !actor.isAdmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: buildEmailLookupWhere(email),
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "No encontramos una cuenta con ese correo" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true, role: "SUPERADMIN" },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        profile: { select: { name: true } },
        createdAt: true,
        sessions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json(
      {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        name: updated.profile?.name ?? null,
        createdAt: updated.createdAt.toISOString(),
        lastLoginAt: updated.sessions[0]?.createdAt?.toISOString?.() ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/admins]", err);
    return NextResponse.json({ error: "No se pudo asignar el rol de administrador" }, { status: 500 });
  }
}
