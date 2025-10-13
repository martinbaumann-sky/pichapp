import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { verified } = body as { verified?: boolean };

    if (typeof verified !== "boolean") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const venue = await prisma.venue.update({
      where: { id: params.id },
      data: { verified },
      select: {
        id: true,
        name: true,
        comuna: true,
        plan: true,
        verified: true,
        owner: { select: { email: true, profile: { select: { name: true } } } },
      },
    });

    return NextResponse.json(venue, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/venues]", err);
    return NextResponse.json({ error: "No se pudo actualizar la cancha" }, { status: 500 });
  }
}

