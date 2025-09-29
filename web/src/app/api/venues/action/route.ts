import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function htmlResponse(title: string, message: string) {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>${title}</title><style>
      body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;color:#0f172a;padding:48px;}
      .card{max-width:520px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 40px rgba(15,23,42,0.1);border:1px solid rgba(148,163,184,0.2);}
      h1{font-size:24px;margin-bottom:12px;}
      p{font-size:15px;line-height:1.6;margin:0;}
    </style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function cancelMatchesForOrganizer(tx: Prisma.TransactionClient, userId: string) {
  const matches = await tx.match.findMany({ where: { organizerId: userId }, select: { id: true } });
  for (const match of matches) {
    const id = match.id;
    await tx.spot.updateMany({ where: { matchId: id }, data: { status: "CANCELED" } });
    await tx.waitlistEntry.updateMany({ where: { matchId: id }, data: { status: "EXPIRED" } }).catch(() => null);
    await tx.payment.updateMany({ where: { matchId: id }, data: { status: "REFUNDED" } }).catch(() => null);
    await tx.match.update({ where: { id }, data: { status: "CANCELED", public: false } });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const decision = url.searchParams.get("decision");
    if (!token || !decision) {
      return htmlResponse("Solicitud inválida", "Falta el token o la decisión a ejecutar.");
    }

    const venue = await prisma.venue.findFirst({
      where: { verificationToken: token },
      select: {
        id: true,
        ownerId: true,
        name: true,
        status: true,
      },
    });
    if (!venue) {
      return htmlResponse("Token inválido", "No encontramos una solicitud asociada a este enlace.");
    }

    if (decision === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.venue.update({
          where: { id: venue.id },
          data: { status: "APPROVED", verifiedAt: new Date(), verificationToken: null },
        });
        await tx.user.update({
          where: { id: venue.ownerId },
          data: { role: "VENUE", status: "ACTIVE" },
        });
      });
      return htmlResponse(
        "Cuenta de cancha aprobada",
        `Marcamos "${venue.name}" como verificada. La cuenta ya puede crear partidos oficiales.`
      );
    }

    if (decision === "block") {
      await prisma.$transaction(async (tx) => {
        await cancelMatchesForOrganizer(tx, venue.ownerId);
        await tx.session.deleteMany({ where: { userId: venue.ownerId } }).catch(() => null);
        await tx.localPassword.deleteMany({ where: { userId: venue.ownerId } }).catch(() => null);
        await tx.profile.deleteMany({ where: { userId: venue.ownerId } }).catch(() => null);
        await tx.user.update({
          where: { id: venue.ownerId },
          data: {
            status: "BLOCKED",
            role: "PLAYER",
            isAdmin: false,
            email: null,
          },
        });
        await tx.venue.update({
          where: { id: venue.id },
          data: { status: "BLOCKED", verificationToken: null },
        });
      });
      return htmlResponse(
        "Cuenta bloqueada y partidos cancelados",
        `Eliminamos el acceso de "${venue.name}" y cancelamos todos los partidos asociados.`
      );
    }

    return htmlResponse("Acción desconocida", "Solo se permiten decisiones de aprobar o bloquear.");
  } catch (err) {
    console.error("[GET /api/venues/action]", err);
    return htmlResponse("Error", "Ocurrió un problema al procesar la solicitud.");
  }
}
