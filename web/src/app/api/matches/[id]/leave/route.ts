import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const matchId = params.id;
    if (!matchId) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const match = await prisma.match.findUnique({ where: { id: matchId }, select: { startsAt: true } });
    if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

    // Regla: solo permite bajarse hasta 2 horas antes del inicio
    const startsAt = match.startsAt ? new Date(match.startsAt) : null;
    if (startsAt) {
      const msUntilStart = startsAt.getTime() - Date.now();
      const cutoffMs = 2 * 60 * 60 * 1000;
      if (msUntilStart < cutoffMs) {
        return NextResponse.json({ error: "Ya no puedes bajarte del partido. Faltan menos de 2 horas." }, { status: 403 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Liberar cupo del usuario
      const mySpots = await tx.spot.findMany({
        where: { matchId, userId, status: "PAID" },
        select: { id: true },
      });

      for (const s of mySpots) {
        await tx.spot.update({
          where: { id: s.id },
          data: { status: "AVAILABLE", userId: null, team: null, position: null, holdUntil: null },
        });
      }

      // Liberar invitados del usuario (si existen) y eliminar sus cuentas temporales
      const invites = await tx.guestInvite.findMany({
        where: { matchId, inviterId: userId },
        select: { id: true, spotId: true, guestUserId: true },
      }).catch(() => []);

      for (const inv of invites) {
        if (inv.spotId) {
          await tx.spot.update({
            where: { id: inv.spotId },
            data: { status: "AVAILABLE", userId: null, team: null, position: null, holdUntil: null },
          }).catch(() => null);
        }
        await tx.profile.deleteMany({ where: { userId: inv.guestUserId } }).catch(() => null);
        await tx.user.delete({ where: { id: inv.guestUserId } }).catch(() => null);
        await tx.guestInvite.delete({ where: { id: inv.id } }).catch(() => null);
      }

      const released = mySpots.length + invites.length;
      const available = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
      await tx.match.update({ where: { id: matchId }, data: { status: available > 0 ? "PUBLISHED" : "FULL" } }).catch(() => null);

      return { released, invites: invites.length };
    });

    return NextResponse.json({ ok: true, message: `Te bajaste del partido. Se liberaron ${result.released} cupo(s).` });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo bajar del partido" }, { status: 500 });
  }
}


