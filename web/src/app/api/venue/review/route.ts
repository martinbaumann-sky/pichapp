import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyVenueReviewToken } from "@/lib/venue-approval-token";
import { deletePasswordHash } from "@/lib/auth-password";

function renderHtml(title: string, message: string, ok = true) {
  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charSet="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); }
        h1 { margin: 0 0 16px; font-size: 24px; }
        p { margin: 0 0 12px; line-height: 1.6; }
        a { display: inline-block; margin-top: 12px; color: #0f172a; text-decoration: none; font-weight: 600; }
        .status { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: 13px; margin-bottom: 20px; }
        .status.ok { background: rgba(16, 185, 129, 0.12); color: #047857; }
        .status.error { background: rgba(248, 113, 113, 0.12); color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="status ${ok ? "ok" : "error"}">${ok ? "✔︎ Acción completada" : "⚠︎ No se pudo completar"}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/panel/cancha">Ir al panel de canchas</a>
      </div>
    </body>
  </html>`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const decision = (url.searchParams.get("decision") || "").toLowerCase();
    if (!token || (decision !== "approve" && decision !== "block")) {
      return new NextResponse(renderHtml("Solicitud inválida", "Falta el token o la decisión." , false), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    let payload;
    try {
      payload = await verifyVenueReviewToken(token);
    } catch (error) {
      return new NextResponse(renderHtml("Token inválido", "El enlace de revisión expiró o es incorrecto.", false), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (payload.action !== decision) {
      return new NextResponse(renderHtml("Acción no permitida", "Este enlace no corresponde a la acción solicitada.", false), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: payload.venueId },
      include: { owner: true },
    });

    if (!venue) {
      return new NextResponse(renderHtml("Cancha no encontrada", "La cuenta ya no existe o ya fue procesada.", false), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (decision === "approve") {
      if (venue.verified) {
        return new NextResponse(renderHtml("Cuenta ya verificada", "Esta cancha ya estaba aprobada previamente."), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      await prisma.venue.update({ where: { id: venue.id }, data: { verified: true } });
      return new NextResponse(
        renderHtml(
          "Cancha verificada",
          `Marcamos a ${venue.name} como verificada. Ya puede publicar partidos oficiales.`,
        ),
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    if (venue.owner?.disabledAt) {
      return new NextResponse(renderHtml("Cuenta ya bloqueada", "Esta cancha ya había sido bloqueada anteriormente."), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    await prisma.$transaction(async (tx) => {
      const matchIds = await tx.match
        .findMany({ where: { organizerId: venue.ownerId }, select: { id: true } })
        .then((items) => items.map((item) => item.id));

      if (matchIds.length > 0) {
        await tx.spot.updateMany({ where: { matchId: { in: matchIds } }, data: { status: "CANCELED" } });
        await tx.payment.updateMany({ where: { matchId: { in: matchIds } }, data: { status: "REFUNDED" } });
        await tx.waitlistEntry.deleteMany({ where: { matchId: { in: matchIds } } });
        await tx.message.deleteMany({ where: { matchId: { in: matchIds } } });
        await tx.guestInvite.deleteMany({ where: { matchId: { in: matchIds } } });
        await tx.match.updateMany({
          where: { id: { in: matchIds } },
          data: { status: "CANCELED", public: false, venueId: null, fieldId: null },
        });
      }

      await tx.field.deleteMany({ where: { venueId: venue.id } });
      await tx.venue.delete({ where: { id: venue.id } });
      await tx.user.update({
        where: { id: venue.ownerId },
        data: {
          role: "PLAYER",
          disabledAt: new Date(),
          passwordHash: null,
          isAdmin: false,
        },
      });
    });

    await deletePasswordHash(venue.ownerId);

    return new NextResponse(
      renderHtml(
        "Cuenta bloqueada",
        `Bloqueamos la cuenta de ${venue.name}. Sus partidos fueron cancelados y la sesión del administrador quedó deshabilitada.`,
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (error) {
    console.error("[venue/review]", error);
    return new NextResponse(
      renderHtml("Error inesperado", "Ocurrió un problema al procesar la solicitud.", false),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
