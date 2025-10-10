import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

function serializeDate(date: Date | null) {
  return date ? date.toISOString() : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
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
    const { suspend } = body as { suspend?: boolean };

    if (typeof suspend !== "boolean") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { disabledAt: suspend ? new Date() : null },
      select: {
        id: true,
        email: true,
        role: true,
        disabledAt: true,
        profile: { select: { name: true, comuna: true } },
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        disabledAt: serializeDate(user.disabledAt),
        profile: user.profile,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "No se pudo actualizar el usuario" }, { status: 500 });
  }
}

