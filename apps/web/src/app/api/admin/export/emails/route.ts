import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const actorId = await requireUserId();
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true, isAdmin: true },
    });

    if (!actor || (actor.role !== "SUPERADMIN" && !actor.isAdmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const [players, venues] = await Promise.all([
      prisma.user.findMany({
        where: { role: "PLAYER", email: { not: null } },
        select: { email: true, profile: { select: { name: true } }, createdAt: true },
      }),
      prisma.venue.findMany({
        select: {
          name: true,
          comuna: true,
          owner: { select: { email: true, profile: { select: { name: true } } } },
          createdAt: true,
        },
      }),
    ]);

    const lines = ["type,name,email,comuna,created_at"];
    const q = (value: string | null | undefined) => JSON.stringify(value ?? "");

    for (const player of players) {
      if (!player.email) continue;
      const name = player.profile?.name ?? "";
      lines.push(["player", q(name), q(player.email), q(null), player.createdAt.toISOString()].join(","));
    }

    for (const venue of venues) {
      const email = venue.owner?.email ?? "";
      if (!email) continue;
      const name = venue.name ?? venue.owner?.profile?.name ?? "";
      const comuna = venue.comuna ?? "";
      lines.push(["venue", q(name), q(email), q(comuna), venue.createdAt.toISOString()].join(","));
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pichapp-emails-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/export/emails]", err);
    return NextResponse.json({ error: "No se pudo exportar los correos" }, { status: 500 });
  }
}
