import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { testMpConnection } from "@/lib/mp/marketplace";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const venueId = typeof body?.venueId === "string" ? body.venueId : null;

    if (!venueId) {
      return NextResponse.json({ error: "ID de cancha requerido" }, { status: 400 });
    }

    // Verificar que el usuario sea el propietario de la cancha
    const venue = await prisma.venue.findFirst({
      where: { id: venueId, ownerId: userId },
      select: { id: true, name: true, mpAccessToken: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
    }

    if (!venue.mpAccessToken) {
      return NextResponse.json({ 
        error: "La cancha no tiene Mercado Pago conectado",
        needsConnection: true 
      }, { status: 400 });
    }

    // Probar la conexión
    const result = await testMpConnection(venueId);

    return NextResponse.json({
      venueId: venue.id,
      venueName: venue.name,
      ...result,
    });
  } catch (error) {
    console.error("[venue/mp/test-connection]", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      success: false 
    }, { status: 500 });
  }
}

